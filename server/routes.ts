import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertGoalSchema, insertActivitySchema, insertChatSchema, insertRecommendationSchema } from "@shared/schema";
import { generateGoalSuggestions } from "./lib/gemini";
import { fetchYoutubeRecommendations } from "./lib/youtube";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Survey submission
  app.post("/api/survey", async (req: Request, res: Response) => {
    try {
      const surveySchema = insertUserSchema.extend({
        subjects: z.array(z.string()).min(1, "Please select at least one subject"),
      });
      
      const data = surveySchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(data.username || "");
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "Username already taken" 
        });
      }
      
      // Create the user
      const user = await storage.createUser({
        username: data.username || data.email,
        password: data.password || "password123", // In a real app, hash the password
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        subjects: data.subjects,
        interests: data.interests,
        skills: data.skills,
        goal: data.goal,
        thinking_style: data.thinking_style,
        extra_info: data.extra_info
      });
      
      // Generate initial goals
      const initialGoals = await generateGoalSuggestions(user);
      if (initialGoals && initialGoals.length > 0) {
        for (const goalText of initialGoals) {
          await storage.createGoal({
            user_id: user.id,
            title: goalText,
            completed: false,
            progress: 0
          });
        }
      }
      
      // Create initial activity
      await storage.createActivity({
        user_id: user.id,
        type: "lesson",
        title: "Joined Emerge Career Platform",
        is_recent: true
      });
      
      return res.json({ 
        success: true, 
        message: "Survey submitted successfully", 
        userId: user.id 
      });
    } catch (error) {
      console.error("Error submitting survey:", error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to submit survey" 
      });
    }
  });
  
  // Dashboard data
  app.get("/api/dashboard/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      const [goals, activities, recommendations] = await Promise.all([
        storage.getGoalsByUserId(userId),
        storage.getActivitiesByUserId(userId),
        storage.getRecommendationsByUserId(userId)
      ]);
      
      // Format the return data
      const formattedGoals = goals.map(g => ({
        id: g.id.toString(),
        title: g.title,
        completed: g.completed,
        progress: g.progress
      }));
      
      const formattedActivities = activities.slice(0, 5).map(a => ({
        id: a.id.toString(),
        type: a.type,
        title: a.title,
        time: a.time.toISOString(),
        isRecent: a.is_recent
      }));
      
      const formattedRecommendations = recommendations.map(r => ({
        id: r.id.toString(),
        type: r.type,
        title: r.title,
        description: r.description || "",
        url: r.url,
        metadata: r.metadata
      }));
      
      // Create dummy trends if none exist
      const trends = [
        {
          id: "1",
          title: "The Growing Demand for Full-Stack Developers",
          description: "Companies are increasingly looking for developers with both frontend and backend expertise.",
          url: "https://www.example.com/trends/fullstack",
          type: "post",
          metrics: {
            like_count: 432,
            retweet_count: 89,
            reply_count: 32
          }
        },
        {
          id: "2",
          title: `${user.subjects?.[0] || 'Career'} Jobs Projected to Grow 13% by 2030`,
          description: `${user.subjects?.[0] || 'Technology'} jobs are growing much faster than the average for all occupations.`,
          url: "https://www.bls.gov/ooh/computer-and-information-technology/home.htm",
          type: "article"
        }
      ];
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          subjects: user.subjects,
          interests: user.interests,
          skills: user.skills,
          goal: user.goal,
          thinking_style: user.thinking_style,
          extra_info: user.extra_info,
          level: user.level,
          progress: user.progress,
          hasProfile: Boolean(user.subjects && user.interests)
        },
        goals: formattedGoals,
        activities: formattedActivities,
        recommendations: formattedRecommendations,
        trends
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch dashboard data" 
      });
    }
  });
  
  // User data
  app.get("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          subjects: user.subjects,
          interests: user.interests,
          skills: user.skills,
          goal: user.goal,
          thinking_style: user.thinking_style,
          extra_info: user.extra_info,
          level: user.level,
          progress: user.progress,
          hasProfile: Boolean(user.subjects && user.interests)
        }
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch user data" 
      });
    }
  });
  
  // Goals management
  app.post("/api/goals", async (req: Request, res: Response) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      
      const goal = await storage.createGoal(goalData);
      
      return res.json({ 
        success: true, 
        message: "Goal created successfully", 
        goal
      });
    } catch (error) {
      console.error("Error creating goal:", error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create goal" 
      });
    }
  });
  
  app.put("/api/goals/:goalId", async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.goalId);
      if (isNaN(goalId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid goal ID" 
        });
      }
      
      const goal = await storage.updateGoal(goalId, req.body);
      if (!goal) {
        return res.status(404).json({ 
          success: false, 
          message: "Goal not found" 
        });
      }
      
      // If goal is completed, update user progress
      if (req.body.completed === true) {
        const user = await storage.getUser(goal.user_id);
        if (user) {
          await storage.updateUserProgress(user.id, 10); // Increment progress by 10%
          
          // Add activity for goal completion
          await storage.createActivity({
            user_id: user.id,
            type: "badge",
            title: `Completed goal: ${goal.title}`,
            is_recent: true
          });
        }
      }
      
      return res.json({ 
        success: true, 
        message: "Goal updated successfully", 
        goal
      });
    } catch (error) {
      console.error("Error updating goal:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update goal" 
      });
    }
  });
  
  app.delete("/api/goals/:goalId", async (req: Request, res: Response) => {
    try {
      const goalId = parseInt(req.params.goalId);
      if (isNaN(goalId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid goal ID" 
        });
      }
      
      const success = await storage.deleteGoal(goalId);
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: "Goal not found" 
        });
      }
      
      return res.json({ 
        success: true, 
        message: "Goal deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting goal:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to delete goal" 
      });
    }
  });
  
  // Generate goal suggestions
  app.get("/api/goals/suggest/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      const goalSuggestions = await generateGoalSuggestions(user);
      
      // Create the goals
      if (goalSuggestions && goalSuggestions.length > 0) {
        for (const goalText of goalSuggestions) {
          await storage.createGoal({
            user_id: user.id,
            title: goalText,
            completed: false,
            progress: 0
          });
        }
      }
      
      return res.json({ 
        success: true, 
        message: "Goals generated successfully", 
        goals: goalSuggestions
      });
    } catch (error) {
      console.error("Error generating goal suggestions:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to generate goal suggestions" 
      });
    }
  });
  
  // Activities
  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      
      const activity = await storage.createActivity(activityData);
      
      return res.json({ 
        success: true, 
        message: "Activity created successfully", 
        activity
      });
    } catch (error) {
      console.error("Error creating activity:", error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create activity" 
      });
    }
  });
  
  // Chat messages
  app.get("/api/chat/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const messages = await storage.getChatHistoryByUserId(userId);
      
      return res.json({ 
        success: true, 
        messages: messages.map(m => ({
          id: m.id,
          message: m.message,
          sender: m.sender,
          timestamp: m.timestamp.toISOString()
        }))
      });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch chat history" 
      });
    }
  });
  
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const messageData = insertChatSchema.parse(req.body);
      
      const message = await storage.createChatMessage(messageData);
      
      return res.json({ 
        success: true, 
        message: {
          id: message.id,
          message: message.message,
          sender: message.sender,
          timestamp: message.timestamp.toISOString()
        }
      });
    } catch (error) {
      console.error("Error creating chat message:", error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create chat message" 
      });
    }
  });
  
  // Career coach
  app.post("/api/career-coach", async (req: Request, res: Response) => {
    try {
      const { message, userData } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Invalid message"
        });
      }
      
      if (!userData || !userData.id) {
        return res.status(400).json({
          success: false,
          message: "User data is required"
        });
      }
      
      // In a real app, we would use the Gemini API here
      // For now, generate a static response based on user data
      const botResponse = `I'm your Emerge career coach. I can see you're interested in ${userData.subjects?.[0] || 'various subjects'} and your goal is ${userData.goal || 'career development'}. Let me help you achieve your career goals!`;
      
      // Save user message to chat history
      await storage.createChatMessage({
        user_id: userData.id,
        message: message,
        sender: 'user'
      });
      
      // Save bot response to chat history
      await storage.createChatMessage({
        user_id: userData.id,
        message: botResponse,
        sender: 'bot'
      });
      
      return res.json({ 
        success: true, 
        response: botResponse
      });
    } catch (error) {
      console.error("Error in career coach:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get a response from the career coach" 
      });
    }
  });
  
  // Personalized video recommendations
  app.get("/api/personalized-recommendations/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Get existing video recommendations
      const existingRecommendations = await storage.getRecommendationsByUserId(userId, 'video');
      if (existingRecommendations.length > 0) {
        // Return the most recent video recommendation
        const recentVideo = existingRecommendations[0];
        return res.json({
          success: true,
          data: {
            video: {
              title: recentVideo.title,
              description: recentVideo.description || "",
              url: recentVideo.url,
              thumbnailUrl: recentVideo.metadata?.thumbnailUrl || "",
              channelTitle: recentVideo.metadata?.channelTitle || ""
            }
          }
        });
      }
      
      // In a real app, fetch from YouTube Data API
      // For now, create a dummy recommendation
      const subject = user.subjects?.[0] || 'Career Development';
      const videoRecommendation = await fetchYoutubeRecommendations(subject);
      
      // Save the recommendation
      await storage.createRecommendation({
        user_id: user.id,
        type: 'video',
        title: videoRecommendation.title,
        description: videoRecommendation.description,
        url: videoRecommendation.url,
        metadata: {
          thumbnailUrl: videoRecommendation.thumbnailUrl,
          channelTitle: videoRecommendation.channelTitle
        }
      });
      
      return res.json({
        success: true,
        data: {
          video: videoRecommendation
        }
      });
    } catch (error) {
      console.error("Error getting video recommendations:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get video recommendations" 
      });
    }
  });
  
  // Course recommendations
  app.get("/api/course-recommendation/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      // Get existing course recommendations
      const existingRecommendations = await storage.getRecommendationsByUserId(userId, 'course');
      if (existingRecommendations.length > 0) {
        // Return the most recent course recommendation
        const recentCourse = existingRecommendations[0];
        return res.json({
          success: true,
          course: {
            title: recentCourse.title,
            description: recentCourse.description || "",
            url: recentCourse.url,
            duration: recentCourse.metadata?.duration || "8 weeks",
            level: recentCourse.metadata?.level || "Beginner"
          }
        });
      }
      
      // Create a course recommendation based on user's subjects
      const subject = user.subjects?.[0] || 'Computer Science';
      let courseTitle = "Intro to Career Development";
      let courseDescription = "Learn essential skills for career success";
      let courseLevel = "Beginner";
      
      // Customize based on subject
      if (subject === 'Computer Science') {
        courseTitle = "Data Structures and Algorithms";
        courseDescription = "Master the core concepts needed for technical interviews";
        courseLevel = "Intermediate";
      } else if (subject === 'Biology') {
        courseTitle = "Introduction to Biotechnology";
        courseDescription = "Learn the foundations of modern biotechnology applications";
      } else if (subject === 'Literature') {
        courseTitle = "Contemporary Literary Analysis";
        courseDescription = "Develop critical analysis skills for modern literature";
      }
      
      // Save the recommendation
      await storage.createRecommendation({
        user_id: user.id,
        type: 'course',
        title: courseTitle,
        description: courseDescription,
        url: "https://www.coursera.org/learn/data-structures",
        metadata: {
          duration: "8 weeks",
          level: courseLevel
        }
      });
      
      return res.json({
        success: true,
        course: {
          title: courseTitle,
          description: courseDescription,
          url: "https://www.coursera.org/learn/data-structures",
          duration: "8 weeks",
          level: courseLevel
        }
      });
    } catch (error) {
      console.error("Error getting course recommendations:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get course recommendations" 
      });
    }
  });
  
  // Career trends
  app.get("/api/career-trends/:subject", async (req: Request, res: Response) => {
    try {
      const subject = req.params.subject;
      
      // In a real app, fetch actual trends
      // For now, return static data
      const trends = [
        {
          id: "1",
          title: `The Growing Demand for ${subject} Professionals`,
          description: `Companies are increasingly looking for talented ${subject} graduates with practical experience.`,
          url: "https://www.example.com/trends/tech",
          type: "post",
          metrics: {
            like_count: 432,
            retweet_count: 89,
            reply_count: 32
          }
        },
        {
          id: "2",
          title: `${subject} Jobs Projected to Grow 13% by 2030`,
          description: `${subject} jobs are growing much faster than the average for all occupations.`,
          url: "https://www.bls.gov/ooh/computer-and-information-technology/home.htm",
          type: "article"
        }
      ];
      
      return res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error("Error getting career trends:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get career trends" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
