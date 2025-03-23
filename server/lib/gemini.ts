import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function suggestGoals(subjects: string[], skills: string, interests: string, count: number = 1): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const subjectsString = subjects.join(", ");
    const prompt = `Suggest ${count} specific and actionable career development goals focused on the subjects: ${subjectsString}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return [text];
  } catch (error) {
    console.error("Error generating goals with Gemini:", error);
    return [];
  }
}

export async function getCourseRecommendation(profile: any) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Recommend a course based on profile: ${JSON.stringify(profile)}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return {
      success: true,
      course: {
        title: "Career Development Course",
        description: "Learn essential career skills",
        duration: "Self-paced",
        level: "All levels",
        platform: "LinkedIn Learning",
        url: `https://www.linkedin.com/learning/`
      }
    };
  } catch (error) {
    return { success: false, message: "Failed to get recommendation" };
  }
}

export async function getChatResponse(message: string, userData: any): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Chat response error:", error);
    return "I apologize, but I'm having trouble generating a response right now.";
  }
}