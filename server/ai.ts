import { User } from "@shared/schema";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

export async function generateGoalSuggestions(user: User, count = 1): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  if (!user.subjects?.length) {
    throw new Error("User subjects are required for goal generation");
  }

  const subjectsString = user.subjects.join(", ");
  const prompt = `Suggest ${count} specific and actionable career development goals focused on the subjects: ${subjectsString}
    Consider these aspects - Current Skills: ${user.skills}, Interests: ${user.interests}
    Their thinking style is: ${user.thinking_style} and career goal is: ${user.goal}

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

    Format the response as a JSON array of strings.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    // Parse the response to extract the goals
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to extract JSON array from the response
    try {
      // Find anything that looks like a JSON array in the text
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        const goals = JSON.parse(jsonMatch[0]);
        if (Array.isArray(goals) && goals.length > 0) {
          return goals.slice(0, count);
        }
      }
    } catch (err) {
      console.error("Error parsing AI response:", err);
    }

    // Fallback to simple text parsing if JSON extraction fails
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[0-9]+\.\s*/, '').replace(/"/g, ''))
      .slice(0, count);

  } catch (error) {
    console.error("Error generating goal suggestions:", error);
    return [];
  }
}

export async function generateCourseRecommendation(user: User): Promise<{ title: string; description: string; duration: string; level: string; url: string }> {
  try {
    if (!GEMINI_API_KEY) {
      console.log("No Gemini API key available. Using fallback course.");
      return {
        title: "No Course Found",
        description: "No course recommendation available.",
        duration: "N/A",
        level: "N/A",
        url: "N/A"
      };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Recommend one specific, free online course for a student interested in ${user.subjects?.join(", ")}.
                Return the response as a JSON object with the following fields:
                "title": the course title,
                "description": a brief description of the course content,
                "duration": estimated time to complete (e.g., "4 weeks"),
                "level": difficulty level (e.g., "Beginner", "Intermediate", "Advanced"),
                "url": a valid URL to the course (use real URLs from platforms like Coursera, edX, Khan Academy, or MIT OpenCourseWare)`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const course = JSON.parse(jsonMatch[0]);
        if (course.title && course.description) {
          return {
            title: course.title,
            description: course.description,
            duration: course.duration || "4 weeks",
            level: course.level || "Beginner",
            url: course.url || "https://www.coursera.org/"
          };
        }
      }
    } catch (err) {
      console.error("Error parsing course recommendation:", err);
    }

    return {
      title: "No Course Found",
      description: "No course recommendation available.",
      duration: "N/A",
      level: "N/A",
      url: "N/A"
    };
  } catch (error) {
    console.error("Error generating course recommendation:", error);
    return {
      title: "No Course Found",
      description: "No course recommendation available.",
      duration: "N/A",
      level: "N/A",
      url: "N/A"
    };
  }
}

export async function getVideoRecommendation(subject: string): Promise<{ title: string; description: string; url: string; thumbnailUrl?: string; channelTitle?: string }> {
  try {
    if (!YOUTUBE_API_KEY) {
      console.log("No YouTube API key available. Using fallback video.");
      return {
        title: "No Video Found",
        description: "No video recommendation available.",
        url: "N/A",
        channelTitle: "N/A"
      };
    }

    const query = encodeURIComponent(`${subject} career development tutorial`);
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${query}&type=video&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const video = data.items?.[0];

    if (video) {
      return {
        title: video.snippet.title,
        description: video.snippet.description,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        thumbnailUrl: video.snippet.thumbnails.medium.url,
        channelTitle: video.snippet.channelTitle
      };
    }

    return {
      title: "No Video Found",
      description: "No video recommendation available.",
      url: "N/A",
      channelTitle: "N/A"
    };
  } catch (error) {
    console.error("Error fetching video recommendation:", error);
    return {
      title: "No Video Found",
      description: "No video recommendation available.",
      url: "N/A",
      channelTitle: "N/A"
    };
  }
}

export async function getCareeTrends(subject: string): Promise<any[]> {
  try {
    if (!GEMINI_API_KEY) {
      console.log("No Gemini API key available. Using fallback trends.");
      return [];
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate 2 current trending topics or news items relevant to careers in ${subject}.
                Return the response as a JSON array with objects having the following structure:
                {
                  "id": a unique string ID,
                  "title": a brief headline (max 10 words),
                  "description": a one-sentence description,
                  "type": either "article" or "post",
                  "url": a real URL related to the topic (e.g., from Indeed, LinkedIn, or an educational site)
                }

                For some entries, include a "metrics" object with:
                { 
                  "like_count": a number between 100-2000,
                  "retweet_count": a number between 50-500,
                  "reply_count": a number between 20-200
                }`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      // Extract JSON array from the response
      const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
      if (jsonMatch) {
        const trends = JSON.parse(jsonMatch[0]);
        if (Array.isArray(trends) && trends.length > 0) {
          return trends;
        }
      }
    } catch (err) {
      console.error("Error parsing trends response:", err);
    }

    return [];
  } catch (error) {
    console.error("Error generating trends:", error);
    return [];
  }
}

export async function getChatResponse(message: string, userData: Partial<User>): Promise<string> {
  try {
    if (!GEMINI_API_KEY) {
      console.log("No Gemini API key available. Using fallback chat response.");
      return "I'm sorry, I'm currently offline. Please try again later.";
    }

    const subjects = userData.subjects || ["General"];
    const interests = userData.interests || "";
    const goal = userData.goal || "career development";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are Emerge, a career coach helping a student interested in ${subjects.join(", ")}.
                Their interests include ${interests} and their career goal is ${goal}.

                Provide a helpful, supportive, and actionable response to their question:
                "${message}"

                Give specific advice tailored to their academic interests and career goals.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return replyText || "I'm having trouble understanding. Can you rephrase your question?";
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I'm sorry, I encountered an error. Please try again later.";
  }
}