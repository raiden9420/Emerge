
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchClassCentralCourses(subject: string) {
  try {
    const searchUrl = `https://www.classcentral.com/search?q=${encodeURIComponent(subject)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const courses = [];

    $('.bg-white').each((_, element) => {
      const title = $(element).find('h2').text().trim();
      const description = $(element).find('.text-1').text().trim();
      const url = 'https://www.classcentral.com' + $(element).find('a').attr('href');
      const provider = $(element).find('.text-2').text().trim();
      
      if (title && url) {
        courses.push({
          title,
          description: description || `Course by ${provider}`,
          url,
          duration: 'Self-paced',
          level: 'All levels',
          platform: provider || 'Class Central'
        });
      }
    });

    return courses[0] || null;
  } catch (error) {
    console.error('Error scraping Class Central:', error);
    return null;
  }
}
