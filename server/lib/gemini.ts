import { User } from "@shared/schema";
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function suggestGoals(subjects: string[], skills: string, interests: string, count: number = 1): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Updated model name
    const subjectsString = subjects.join(", ");
    const prompt = `Suggest ${count} specific and actionable career development goal focused on the subjects: ${subjectsString}
Consider these aspects - Current Skills: ${skills}, Interests: ${interests}

Based on these, suggest career development activities like:
- Industry research and analysis
- Skill-building exercises
- Portfolio development
- Professional networking
- Personal branding
- Technical learning
- Career exploration

Requirements for goals:
- Must be achievable in 1-2 hours
- Should be specific and actionable
- Vary between different types of activities
- Focus on career exploration and professional development
- Should help understand career paths and opportunities
- Include industry-relevant skills or knowledge
- Be specific and measurable

Format as JSON array of strings. Example:
["Research and analyze 2 leading companies in ${subjectsString} sector", "Create a portfolio entry demonstrating ${skills}"]

Response must be only the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log("Raw Gemini response for goals:", text);

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, count);
      }
      throw new Error("Invalid response format from AI");
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to generate valid goals");
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error; // Propagate error to show in UI
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"" });
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating chat response with Gemini:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. What specific career advice can I help you with regarding your studies or job preparation?";
  }
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