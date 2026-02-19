import axios from 'axios';

export async function searchClassCentralCourses(subject: string) {
  try {
    const searchTerm = encodeURIComponent(subject);
    const linkedInUrl = `https://www.linkedin.com/learning/search?keywords=${searchTerm}`;

    return {
      title: `${subject} Courses on LinkedIn Learning`,
      description: `Browse curated ${subject} courses from industry experts`,
      url: linkedInUrl,
      duration: "Self-paced",
      level: "All levels",
      platform: "LinkedIn Learning"
    };
  } catch (error) {
    console.error('Error generating LinkedIn Learning URL:', error);
    return null;
  }
}