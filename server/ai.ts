import { User } from "@shared/schema";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

export async function generateGoalSuggestions(user: User, count = 5): Promise<string[]> {
  try {
    // Skip in development if no API key is available
    if (!GEMINI_API_KEY) {
      console.log("No Gemini API key available. Using fallback goals.");
      return getFallbackGoals(user.subjects?.[0] || "");
    }

    const subjectsString = user.subjects?.join(", ") || "";
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
    return getFallbackGoals(user.subjects?.[0] || "");
  }
}

export async function generateCourseRecommendation(user: User): Promise<{ title: string; description: string; duration: string; level: string; url: string }> {
  try {
    if (!GEMINI_API_KEY) {
      console.log("No Gemini API key available. Using fallback course.");
      return getFallbackCourse(user.subjects?.[0] || "");
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
    
    return getFallbackCourse(user.subjects?.[0] || "");
  } catch (error) {
    console.error("Error generating course recommendation:", error);
    return getFallbackCourse(user.subjects?.[0] || "");
  }
}

export async function getVideoRecommendation(subject: string): Promise<{ title: string; description: string; url: string; thumbnailUrl?: string; channelTitle?: string }> {
  try {
    if (!YOUTUBE_API_KEY) {
      console.log("No YouTube API key available. Using fallback video.");
      return getFallbackVideo(subject);
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
    
    return getFallbackVideo(subject);
  } catch (error) {
    console.error("Error fetching video recommendation:", error);
    return getFallbackVideo(subject);
  }
}

export async function getCareeTrends(subject: string): Promise<any[]> {
  try {
    if (!GEMINI_API_KEY) {
      console.log("No Gemini API key available. Using fallback trends.");
      return getFallbackTrends(subject);
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
    
    return getFallbackTrends(subject);
  } catch (error) {
    console.error("Error generating trends:", error);
    return getFallbackTrends(subject);
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

// Fallback functions when API is not available
function getFallbackGoals(subject: string): string[] {
  const generalGoals = [
    "Complete an online course in your field",
    "Read an academic journal article weekly",
    "Join a professional association",
    "Attend a virtual career fair",
    "Build a portfolio of your work"
  ];
  
  const subjectGoals: Record<string, string[]> = {
    "Computer Science": [
      "Build a personal coding project",
      "Contribute to an open source project",
      "Learn a new programming language",
      "Complete a data structures course",
      "Join a hackathon"
    ],
    "Biology": [
      "Learn PCR techniques",
      "Read a research paper on genetics",
      "Practice lab safety procedures",
      "Join biology research discussion forum",
      "Study cell culture techniques"
    ],
    "Literature": [
      "Analyze a classic literary work",
      "Write a short story or poem weekly",
      "Start a literary analysis blog",
      "Join a writing workshop",
      "Learn literary criticism methods"
    ],
    "Engineering": [
      "Complete a CAD design project",
      "Study material properties",
      "Build a prototype of a simple device",
      "Learn engineering standards",
      "Practice problem-solving methodologies"
    ]
  };
  
  return subjectGoals[subject] || generalGoals;
}

function getFallbackCourse(subject: string): { title: string; description: string; duration: string; level: string; url: string } {
  const generalCourse = {
    title: "Career Development Essentials",
    description: "Learn the fundamentals of career planning and growth",
    duration: "4 weeks",
    level: "Beginner",
    url: "https://www.coursera.org/learn/career-development"
  };
  
  const subjectCourses: Record<string, any> = {
    "Computer Science": {
      title: "Introduction to Computer Science",
      description: "Learn programming fundamentals and computational thinking",
      duration: "8 weeks",
      level: "Beginner",
      url: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science"
    },
    "Biology": {
      title: "Introduction to Biology - The Secret of Life",
      description: "Explore the principles of biochemistry, genetics, molecular biology, and more",
      duration: "16 weeks",
      level: "Intermediate",
      url: "https://www.edx.org/learn/biology/massachusetts-institute-of-technology-introduction-to-biology-the-secret-of-life"
    },
    "Literature": {
      title: "Introduction to Literary Theory",
      description: "Explore different approaches to interpreting literature",
      duration: "6 weeks",
      level: "Intermediate",
      url: "https://www.coursera.org/learn/literary-theory"
    },
    "Engineering": {
      title: "Engineering Mechanics",
      description: "Master the fundamentals of engineering physics and design",
      duration: "10 weeks",
      level: "Intermediate",
      url: "https://www.edx.org/learn/engineering/mit-a-hands-on-introduction-to-engineering-simulations"
    }
  };
  
  return subjectCourses[subject] || generalCourse;
}

function getFallbackVideo(subject: string): { title: string; description: string; url: string; thumbnailUrl?: string; channelTitle?: string } {
  const generalVideo = {
    title: "How to Plan Your Career Path",
    description: "Expert advice on planning your career journey",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    channelTitle: "Career Insights"
  };
  
  const subjectVideos: Record<string, any> = {
    "Computer Science": {
      title: "Map of Computer Science",
      description: "Overview of the various fields within computer science",
      url: "https://www.youtube.com/watch?v=SzJ46YA_RaA",
      channelTitle: "Domain of Science"
    },
    "Biology": {
      title: "Biology Career Opportunities",
      description: "Explore various career paths in biological sciences",
      url: "https://www.youtube.com/watch?v=3PaPtSpXoFk",
      channelTitle: "Science Explained"
    },
    "Literature": {
      title: "Careers for Literature Majors",
      description: "Beyond teaching: career options for literature graduates",
      url: "https://www.youtube.com/watch?v=iq8Sa2Uw_Xw",
      channelTitle: "Literary Insights"
    },
    "Engineering": {
      title: "Engineering Fields Explained",
      description: "Overview of different engineering specializations",
      url: "https://www.youtube.com/watch?v=btGYcizV0iI",
      channelTitle: "Engineering Academy"
    }
  };
  
  return subjectVideos[subject] || generalVideo;
}

function getFallbackTrends(subject: string): any[] {
  const generalTrends = [
    {
      id: "gen1",
      title: "Remote Work Continues to Reshape Industries",
      description: "Companies are adapting policies for long-term remote work options",
      type: "article",
      url: "https://www.linkedin.com/news/story/remote-work-reshaping-careers"
    },
    {
      id: "gen2",
      title: "Skills-Based Hiring on the Rise",
      description: "Employers focus more on skills than degrees for new hires",
      type: "post",
      metrics: {
        like_count: 1240,
        retweet_count: 350,
        reply_count: 95
      },
      url: "https://www.indeed.com/career-advice/finding-a-job/skills-based-hiring"
    }
  ];
  
  const subjectTrends: Record<string, any[]> = {
    "Computer Science": [
      {
        id: "cs1",
        title: "AI Skills Demand Surges 38% in 2023",
        description: "Companies seek professionals with expertise in machine learning and AI development",
        type: "article",
        url: "https://www.linkedin.com/news/story/ai-skills-demand-soars-4298632/"
      },
      {
        id: "cs2",
        title: "Cybersecurity Professionals Face Growing Challenges",
        description: "New threats emerge as remote work expands company vulnerabilities",
        type: "post",
        metrics: {
          like_count: 1876,
          retweet_count: 423,
          reply_count: 156
        },
        url: "https://www.indeed.com/career-advice/career-development/cybersecurity-challenges"
      }
    ],
    "Biology": [
      {
        id: "bio1",
        title: "Biotech Job Market Expected to Grow 10% in 2023",
        description: "New report shows increasing demand for biotechnology professionals",
        type: "article",
        url: "https://www.biospace.com/article/careers/"
      },
      {
        id: "bio2",
        title: "Breakthrough in Genomic Sequencing Techniques",
        description: "New methods could revolutionize personalized medicine approaches",
        type: "post",
        metrics: {
          like_count: 1243,
          retweet_count: 456,
          reply_count: 87
        },
        url: "https://www.bls.gov/ooh/life-physical-and-social-science/biological-technicians.htm"
      }
    ]
  };
  
  return subjectTrends[subject] || generalTrends;
}
