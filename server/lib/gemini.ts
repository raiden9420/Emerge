import { User } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client with the Gemini API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not defined. AI features will use fallback responses.");
}
const genAI = new GoogleGenerativeAI(apiKey || "dummy-key");

/**
 * Generates goal suggestions using Gemini AI based on user profile
 */
export async function generateGoalSuggestions(user: User): Promise<string[]> {
  try {
    console.log("Generating goal suggestions for user:", user.username);
    
    // Extract user information
    const subject = user.subjects?.[0] || '';
    const interests = user.interests || '';
    const skills = user.skills || '';
    const goal = user.goal || '';
    
    // Create a prompt for the Gemini model
    const prompt = `Generate 5 specific, actionable career development goals for a student with the following profile:
    - Subject: ${subject}
    - Interests: ${interests}
    - Skills: ${skills}
    - Career Goal: ${goal}
    
    Each goal should:
    1. Be specific and actionable
    2. Be achievable in 1-2 hours
    3. Help advance their career prospects
    4. Be related to their subjects, interests, or skills
    5. Format as a list of 5 items, with each item being just the goal text
    
    Return only the 5 goals as a numbered list without any explanations or preamble.`;
    
    // Generate a response using the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response into an array of goals
    const goals = text
      .split(/\d\./)
      .map(goal => goal.trim())
      .filter(goal => goal.length > 0);
    
    if (goals.length >= 5) {
      return goals.slice(0, 5);
    }
    
    // Fallback in case parsing fails
    return getFallbackGoals(subject);
  } catch (error) {
    console.error("Error generating goals with Gemini:", error);
    return getFallbackGoals(user.subjects?.[0] || '');
  }
}

/**
 * Generates a course recommendation using Gemini AI based on user profile
 */
export async function generateCourseRecommendation(user: User): Promise<{ 
  title: string; 
  description: string; 
  duration: string; 
  level: string; 
  url: string; 
}> {
  try {
    // Extract user information
    const subject = user.subjects?.[0] || '';
    const interests = user.interests || '';
    const skills = user.skills || '';
    const goal = user.goal || '';
    
    // Create a prompt for the Gemini model
    const prompt = `Generate a detailed online course recommendation for a student with the following profile:
    - Subject: ${subject}
    - Interests: ${interests}
    - Skills: ${skills}
    - Career Goal: ${goal}
    
    The course should:
    1. Be relevant to their academic subject and career goal
    2. Help them build practical skills
    3. Be beginner to intermediate level
    
    Provide details in this format:
    - Course Title: [title]
    - Description: [brief description of 2-3 sentences]
    - Duration: [estimated time to complete]
    - Level: [Beginner/Intermediate/Advanced]
    - URL: [a realistic but fictional URL, for example: https://learning-platform.com/course-name]`;
    
    // Generate a response using the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the course details from the response
    const titleMatch = text.match(/Course Title:?\s*(.*)/i);
    const descriptionMatch = text.match(/Description:?\s*([\s\S]*?)(?=Duration:|Level:|URL:|$)/i);
    const durationMatch = text.match(/Duration:?\s*(.*)/i);
    const levelMatch = text.match(/Level:?\s*(.*)/i);
    const urlMatch = text.match(/URL:?\s*(https?:\/\/[^\s]+)/i);
    
    return {
      title: titleMatch?.[1]?.trim() || `${subject} Career Development Course`,
      description: descriptionMatch?.[1]?.trim() || `Learn essential career skills for ${subject}`,
      duration: durationMatch?.[1]?.trim() || "8 weeks",
      level: levelMatch?.[1]?.trim() || "Beginner",
      url: urlMatch?.[1]?.trim() || `https://career-courses.com/${subject.toLowerCase().replace(/\s+/g, '-')}`
    };
  } catch (error) {
    console.error("Error generating course recommendation with Gemini:", error);
    return getFallbackCourse(user.subjects?.[0] || '');
  }
}

/**
 * Generates a chat response for career coach using Gemini AI
 */
export async function getChatResponse(message: string, userData: Partial<User>): Promise<string> {
  try {
    // Extract user information
    const subject = userData.subjects?.[0] || '';
    const interests = userData.interests || '';
    const skills = userData.skills || '';
    const goal = userData.goal || '';
    
    // Create a prompt for the Gemini model
    const prompt = `You are a professional career coach assistant for a student with the following profile:
    - Subject: ${subject}
    - Interests: ${interests}
    - Skills: ${skills}
    - Career Goal: ${goal}
    
    The student has asked: "${message}"
    
    Provide a helpful, supportive, and informative response that:
    1. Addresses their question directly
    2. Gives practical advice related to their academic and career interests
    3. Is encouraging and positive
    4. Is concise (max 150 words)
    
    Your response should be in a conversational tone as if you're having a direct chat with the student.`;
    
    // Generate a response using the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating chat response with Gemini:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. What specific career advice can I help you with regarding your studies or job preparation?";
  }
}

/**
 * Fallback goals if API call fails
 */
function getFallbackGoals(subject: string): string[] {
  const commonGoals = [
    "Update your LinkedIn profile with your current skills and experience",
    "Create a portfolio website showcasing your projects and skills",
    "Read an industry-relevant book or research paper",
    "Attend a networking event in your field",
    "Practice answering common interview questions in your field"
  ];
  
  let subjectSpecificGoals: string[] = [];
  
  // Add subject-specific goals
  if (subject === 'Computer Science') {
    subjectSpecificGoals = [
      "Complete a basic Python programming course",
      "Build a portfolio project showcasing database skills",
      "Research and apply to 3 summer internships in tech",
      "Contribute to an open-source project on GitHub",
      "Learn the fundamentals of cloud computing"
    ];
  } else if (subject === 'Biology') {
    subjectSpecificGoals = [
      "Master PCR techniques through an online course",
      "Practice writing a lab report in scientific format",
      "Research current trends in biotechnology",
      "Learn about ethical considerations in biological research",
      "Participate in a citizen science project"
    ];
  } else if (subject === 'Literature') {
    subjectSpecificGoals = [
      "Analyze a contemporary novel using literary theory",
      "Create a writing portfolio with different styles",
      "Learn about the publishing industry",
      "Practice critical reading and annotation skills",
      "Join a book club or literary discussion group"
    ];
  } else {
    // Generic goals for other subjects
    subjectSpecificGoals = [
      `Take an online course in ${subject}`,
      `Research current trends in ${subject}`,
      `Find and follow 5 thought leaders in ${subject} on social media`,
      `Create a study group for ${subject} topics`,
      `Read the latest research papers in ${subject}`
    ];
  }
  
  // Combine and return 5 goals
  return [...commonGoals, ...subjectSpecificGoals].slice(0, 5);
}

/**
 * Fallback course if API call fails
 */
function getFallbackCourse(subject: string): { title: string; description: string; duration: string; level: string; url: string } {
  if (subject === 'Computer Science') {
    return {
      title: "Data Structures and Algorithms",
      description: "Master the core concepts needed for technical interviews and build a strong foundation in computer science fundamentals.",
      duration: "10 weeks",
      level: "Intermediate",
      url: "https://career-courses.com/computer-science-algorithms"
    };
  } else if (subject === 'Biology') {
    return {
      title: "Introduction to Biotechnology",
      description: "Learn the foundations of modern biotechnology applications and techniques used in research and industry.",
      duration: "8 weeks",
      level: "Beginner",
      url: "https://career-courses.com/biotechnology-intro"
    };
  } else if (subject === 'Literature') {
    return {
      title: "Contemporary Literary Analysis",
      description: "Develop critical analysis skills for modern literature and enhance your writing capabilities.",
      duration: "6 weeks",
      level: "Intermediate",
      url: "https://career-courses.com/literary-analysis"
    };
  } else {
    return {
      title: `${subject} Career Development`,
      description: `Learn essential skills and knowledge to advance your career in ${subject}.`,
      duration: "8 weeks",
      level: "Beginner",
      url: `https://career-courses.com/${subject.toLowerCase().replace(/\s+/g, '-')}`
    };
  }
}
