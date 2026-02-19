// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

// Make API key optional for local dev
let genAI: any;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn("GEMINI_API_KEY environment variable is not set. AI features will be mocked.");
  genAI = {
    getGenerativeModel: () => ({
      generateContent: async () => ({
        response: {
          text: () => JSON.stringify(["Mock Goal 1", "Mock Goal 2"])
        }
      })
    })
  };
}

export { genAI };

// Helper to get fallback goals based on subjects
function getFallbackGoals(subjects: string[], count: number): string[] {
  const defaults = [
    `Research top 3 companies hiring for ${subjects[0] || 'your field'} roles`,
    `Update LinkedIn profile with ${subjects[0] || 'relevant'} skills`,
    `Watch a 20-minute tutorial on ${subjects[0] || 'a key concept'}`,
    `Read one industry news article about ${subjects[0] || 'recent trends'}`,
    `Network with one professional in ${subjects[0] || 'the industry'}`
  ];
  return defaults.slice(0, count);
}

export async function suggestGoals(subjects: string[], skills: string, interests: string, count: number = 1): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const subjectsString = subjects.join(", ");
    const prompt = `Suggest ${count} specific and actionable career development goals focused on the subjects: ${subjectsString}
Consider these aspects - Current Skills: ${skills}, Interests: ${interests}

Based on the user's thinking style and career goals, suggest varied career development activities like:
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
- Focus on career exploration and professional development in the subject field
- Should help understand career paths and opportunities
- Include industry-relevant skills or knowledge
- Be specific and measurable
- Example: "Research 2 companies hiring ${subjectsString.split(',')[0]} professionals and list their requirements"

Format as JSON array of strings. Example:
["Complete 3 linear algebra practice problems", "Write a 1-page summary of photosynthesis process"]

Response must be only the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Clean the text to ensure it's valid JSON
      const cleanText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, count);
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse Gemini response as JSON, trying regex extraction.");
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const goals = JSON.parse(match[0]);
          return Array.isArray(goals) && goals.length > 0 ? goals.slice(0, count) : getFallbackGoals(subjects, count);
        } catch (parseError) {
          console.error("❌ Error parsing Gemini regex match:", parseError);
        }
      }
    }

    console.warn("⚠️ Could not generate valid goals from response, using fallback");
    return getFallbackGoals(subjects, count);
  } catch (error: any) {
    console.error("❌ Error generating goals with Gemini:", error.message || error);
    console.error("Error details:", error);
    return getFallbackGoals(subjects, count);
  }
}

export async function getChatResponse(message: string, userData: any): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const contextPrompt = `You are "Emerge", a supportive and knowledgeable career coach for ${userData.name || userData.username}.
    
User Profile:
- Focus Areas: ${userData.subjects ? userData.subjects.join(', ') : 'Not specified'}
- Skills: ${userData.skills || 'Not specified'}
- Interests: ${userData.interests || 'Not specified'}
- Primary Goal: ${userData.goal || 'Not specified'}
- Thinking Style: ${userData.thinking_style || 'Plan'}

Your Instructions:
1. Be concise and conversational (keep responses under 150 words generally).
2. Use clear formatting (bullet points) for lists.
3. Provide specific, actionable advice based on their profile.
4. If they ask a general question, relate it back to their specific interests/goals.
5. Tone: Encouraging, professional, and forward-looking.
    
User Message: ${message}`;

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Chat response error:", error);
    return "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
  }
}

export async function getRecommendations(profile: any) {
  if (!profile) {
    return { success: false, message: "Profile data is required" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = `Given this user profile: ${JSON.stringify(profile)}, suggest 3 learning recommendations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const recommendations = text.split('\n').filter(Boolean);

    if (recommendations.length === 0) {
      return { success: false, message: "No recommendations generated" };
    }

    return { success: true, recommendations };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate recommendations"
    };
  }
}