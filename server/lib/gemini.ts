import { User } from "@shared/schema";

// In a real app, we would use the Gemini API here
// This is a simplified version without actual API calls
export async function generateGoalSuggestions(user: User): Promise<string[]> {
  console.log("Generating goal suggestions for user:", user.username);
  
  // Generate goal suggestions based on user data
  const subject = user.subjects?.[0] || '';
  const goal = user.goal || '';
  
  const commonGoals = [
    "Update your LinkedIn profile with your current skills and experience",
    "Create a portfolio website showcasing your projects and skills",
    "Read an industry-relevant book or research paper",
    "Attend a networking event in your field"
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
  } else if (subject === 'Engineering') {
    subjectSpecificGoals = [
      "Complete a CAD (Computer-Aided Design) tutorial",
      "Build a simple prototype of an engineering solution",
      "Practice solving engineering problems using calculus",
      "Research sustainable engineering practices",
      "Join an engineering student organization"
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
  
  // Add goal-specific goals
  let careerGoals: string[] = [];
  
  if (goal === 'Internship') {
    careerGoals = [
      "Create a targeted resume for internship applications",
      "Practice answering common internship interview questions",
      "Research 10 companies offering internships in your field",
      "Reach out to alumni who interned at your target companies",
      "Develop a 30-second elevator pitch for networking events"
    ];
  } else if (goal === 'Job') {
    careerGoals = [
      "Create a professional resume highlighting your skills and education",
      "Practice technical and behavioral interview questions",
      "Research salary expectations for entry-level positions",
      "Set up job alerts on major job platforms",
      "Develop a job search strategy and timeline"
    ];
  } else if (goal === 'Learn') {
    careerGoals = [
      "Create a learning plan with specific milestones",
      "Find and subscribe to relevant industry newsletters",
      "Join online communities related to your field",
      "Set up a regular study schedule",
      "Find a mentor in your field of interest"
    ];
  }
  
  // Combine and randomize goals
  const allGoals = [...commonGoals, ...subjectSpecificGoals, ...careerGoals];
  
  // Shuffle array
  const shuffled = allGoals.sort(() => 0.5 - Math.random());
  
  // Return 5 random goals
  return shuffled.slice(0, 5);
}
