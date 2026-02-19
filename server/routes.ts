import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from './db';
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertGoalSchema, insertActivitySchema, insertChatSchema, insertRecommendationSchema } from "@shared/schema";
import { suggestGoals, getChatResponse } from "./lib/gemini";
import { fetchYoutubeRecommendations } from "./lib/youtube";
import { User } from '@shared/schema';


export async function registerRoutes(app: Express): Promise<Server> {
  // API routes

  // Authentication
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }

      // Find user by email (used as username)
      const user = await storage.getUserByUsername(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // In a real app, use bcrypt to compare passwords
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // Check if user has completed profile setup
      const hasProfile = Boolean(user.subjects && user.interests);

      // Calculate streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newStreak = user.streak_days || 0;
      let shouldUpdate = false;

      if (user.last_login_date) {
        const lastLogin = new Date(user.last_login_date);
        lastLogin.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today.getTime() - lastLogin.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consequent day login, increment streak
          newStreak += 1;
          shouldUpdate = true;
        } else if (diffDays > 1) {
          // Missed a day (or more), reset streak
          newStreak = 1;
          shouldUpdate = true;
        }
        // If diffDays === 0, same day login, do nothing
      } else {
        // First login ever (or since feature added)
        newStreak = 1;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await storage.updateUser(user.id, {
          streak_days: newStreak,
          last_login_date: new Date()
        });
      }

      return res.json({
        success: true,
        message: "Login successful",
        userId: user.id,
        hasProfile
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Login failed"
      });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      // In a real app, you might want to invalidate sessions or tokens here
      return res.json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }

      // Create new user
      try {
        const user = await storage.createUser({
          username: email,
          password: password, // In a real app, hash this password
          email: email,
          subjects: [],
          interests: "",
          skills: "",
          goal: "",
          thinking_style: "Plan"
        });

        return res.json({
          success: true,
          message: "Registration successful",
          userId: user.id
        });
      } catch (createError) {
        console.error("Error creating user:", createError);
        return res.status(500).json({
          success: false,
          message: "Failed to create user"
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({
        success: false,
        message: "Registration failed"
      });
    }
  });


  // Survey submission
  app.post("/api/survey", async (req: Request, res: Response) => {
    try {
      console.log("Survey submission received:", JSON.stringify(req.body, null, 2));

      // Validate the request body but be more flexible with subjects
      const surveySchema = insertUserSchema.extend({
        subjects: z.array(z.string()).optional().default([]),
        username: z.string().optional(),
        password: z.string().optional().default("password123"),
        user_id: z.number().optional(), // Allow user_id for existing users
      });

      let data;
      try {
        data = surveySchema.parse(req.body);
      } catch (parseError) {
        console.error("Survey validation error:", parseError);
        return res.status(400).json({
          success: false,
          message: "Invalid survey data: " + (parseError instanceof Error ? parseError.message : String(parseError))
        });
      }

      // Ensure we have an array for subjects even if it's empty
      const subjects = Array.isArray(data.subjects) ? data.subjects : [];

      // Check if this is for an existing user (update) or a new user (create)
      const userId = data.user_id;
      let user;

      try {
        if (userId) {
          // This is an existing user - update profile
          console.log(`Updating existing user with ID: ${userId}`);
          user = await storage.updateUser(userId, {
            name: data.name,
            email: data.email,
            avatar: data.avatar,
            subjects: subjects,
            interests: data.interests || '',
            skills: data.skills || '',
            goal: data.goal || '',
            thinking_style: data.thinking_style || 'Plan',
            extra_info: data.extra_info || ''
          });

          if (!user) {
            throw new Error(`User with ID ${userId} not found`);
          }

          console.log("User profile updated successfully:", user.id);

          // Create profile update activity
          try {
            await storage.createActivity({
              user_id: user.id,
              type: "lesson",
              title: "Updated Career Profile",
              is_recent: true
            });

            console.log(`Created profile update activity for user ${user.id}`);
          } catch (activityError) {
            console.error("Error creating profile update activity:", activityError);
            // Continue even if activity creation fails
          }
        } else {
          // This is a new user - create profile
          // Generate a username if not provided
          if (!data.username) {
            // Extract part before @ from email or use 'user' as fallback
            const baseUsername = data.email ? data.email.split('@')[0] : 'user';
            // Add random numbers to ensure uniqueness
            data.username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
          }

          // Create the user with proper handling of arrays
          user = await storage.createUser({
            username: data.username,
            password: data.password,
            name: data.name,
            email: data.email,
            avatar: data.avatar,
            subjects: subjects,
            interests: data.interests || '',
            skills: data.skills || '',
            goal: data.goal || '',
            thinking_style: data.thinking_style || 'Plan',
            extra_info: data.extra_info || ''
          });

          console.log("New user created successfully:", user.id);

          try {
            // Generate initial goals
            const initialGoals = await suggestGoals(subjects, data.skills || '', data.interests || '');

            if (initialGoals && initialGoals.length > 0) {
              for (const goalText of initialGoals) {
                await storage.createGoal({
                  user_id: user.id,
                  title: goalText,
                  completed: false,
                  progress: 0
                });
              }

              console.log(`Created ${initialGoals.length} initial goals for user ${user.id}`);
            }
          } catch (goalError) {
            console.error("Error generating initial goals:", goalError);
            // Continue even if goal creation fails
          }

          try {
            // Create initial activity
            await storage.createActivity({
              user_id: user.id,
              type: "lesson",
              title: "Joined Emerge Career Platform",
              is_recent: true
            });

            console.log(`Created initial activity for user ${user.id}`);
          } catch (activityError) {
            console.error("Error creating initial activity:", activityError);
            // Continue even if activity creation fails
          }
        }

        // For both new and existing users, check if we need to generate goals
        if (userId) {
          const existingGoals = await storage.getGoalsByUserId(user.id);

          if (!existingGoals || existingGoals.length === 0) {
            try {
              // Generate goals for existing user with no goals
              const goals = await suggestGoals(user.subjects || [], user.skills || '', user.interests || '');

              if (goals && goals.length > 0) {
                for (const goalText of goals) {
                  await storage.createGoal({
                    user_id: user.id,
                    title: goalText,
                    completed: false,
                    progress: 0
                  });
                }

                console.log(`Created ${goals.length} goals for existing user ${user.id}`);
              }
            } catch (goalError) {
              console.error("Error generating goals for existing user:", goalError);
              // Continue even if goal creation fails
            }
          }
        }

        return res.json({
          success: true,
          message: userId ? "Profile updated successfully" : "Survey submitted successfully",
          userId: user.id
        });
      } catch (userError) {
        console.error("Error processing user data:", userError);
        return res.status(400).json({
          success: false,
          message: userError instanceof Error ? userError.message : "Failed to process user data"
        });
      }
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

      // If user has no goals but better profile, try to generate some
      if (goals.length === 0 && user.subjects && user.subjects.length > 0) {
        try {
          // Generate 3 initial goals
          const newGoals = await suggestGoals(user.subjects || [], user.skills || '', user.interests || '', 3);

          if (newGoals && newGoals.length > 0) {
            for (const goalText of newGoals) {
              const createdGoal = await storage.createGoal({
                user_id: user.id,
                title: goalText,
                completed: false,
                progress: 0
              });
              // Add to the local goals array so they show up immediately
              goals.push(createdGoal);
            }
          }
        } catch (err) {
          console.error("Error auto-generating goals:", err);
        }
      }

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
        time: a.time ? a.time.toISOString() : new Date().toISOString(),
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
          streak_days: user.streak_days || 0,
          hasProfile: Boolean(user.subjects && user.interests)
        },
        goals: formattedGoals,
        activities: formattedActivities,
        recommendations: formattedRecommendations,
        trends,
        daily_challenge: {
          id: "daily-1",
          title: "Complete one learning goal",
          description: "Finish at least one of your set goals for today to earn extra XP.",
          completed: false,
          xp: 50
        }
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
          streak_days: user.streak_days || 0,
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

      if (!user.subjects?.length) {
        return res.status(400).json({
          success: false,
          message: "User profile incomplete. Please add subjects of interest."
        });
      }

      // Get existing goals before generating new ones
      const existingGoals = await storage.getGoalsByUserId(userId);

      try {
        const newGoal = await suggestGoals(user.subjects, user.skills || '', user.interests || '', 1);

        // Add the new goal without removing existing ones
        if (newGoal.length > 0) {
          await storage.createGoal({
            user_id: user.id,
            title: newGoal[0],
            completed: false,
            progress: 0
          });
        }

        const updatedGoals = await storage.getGoalsByUserId(userId);

        return res.json({
          success: true,
          message: "New goal added successfully",
          goals: updatedGoals.map(g => g.title)
        });
      } catch (aiError) {
        console.error("AI Service Error:", aiError);
        return res.status(503).json({
          success: false,
          message: "Unable to generate new goal. AI service error: " + (aiError instanceof Error ? aiError.message : "Internal error"),
          goals: existingGoals.map(g => g.title)
        });
      }
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
          timestamp: m.timestamp ? m.timestamp.toISOString() : new Date().toISOString()
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
          timestamp: message.timestamp ? message.timestamp.toISOString() : new Date().toISOString()
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

      // Save user message to chat history
      await storage.createChatMessage({
        user_id: userData.id,
        message: message,
        sender: 'user'
      });

      // Generate a response using Gemini AI
      const botResponse = await getChatResponse(message, userData);

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
      if (!user || !user.subjects || user.subjects.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User or subjects not found"
        });
      }

      // Get fresh recommendation based on user's first subject
      const subject = user.subjects[0] || 'Career Development';
      const videoRecommendation = await fetchYoutubeRecommendations(subject);

      // Save the recommendation
      await storage.createRecommendation({
        user_id: user.id,
        type: 'video',
        title: videoRecommendation.title,
        description: videoRecommendation.description,
        url: videoRecommendation.url,
        metadata: {
          thumbnailUrl: videoRecommendation.thumbnailUrl || "",
          channelTitle: videoRecommendation.channelTitle || ""
        } as any
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

      // Get course recommendation from Class Central
      const { searchClassCentralCourses } = await import('./lib/classcentral');
      const course = await searchClassCentralCourses(user.subjects?.[0] || 'Career');

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "No course recommendations found"
        });
      }

      // Save the recommendation
      await storage.createRecommendation({
        user_id: user.id,
        type: 'course',
        title: course.title,
        description: course.description,
        url: course.url,
        metadata: {
          duration: course.duration,
          level: course.level
        } as any
      });

      return res.json({
        success: true,
        course: {
          title: course.title,
          description: course.description,
          url: course.url,
          duration: course.duration,
          level: course.level
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

      const { fetchCareerTrends } = await import('./lib/trends');
      const trends = await fetchCareerTrends(subject);

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