
import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.warn('YOUTUBE_API_KEY environment variable is missing. YouTube features will use fallback.');
}

type VideoRecommendation = {
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  channelTitle?: string;
};

export async function fetchYoutubeRecommendations(subject: string): Promise<VideoRecommendation> {
  try {
    const searchQuery = `${subject} career guide tutorial`;
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: 1,
        relevanceLanguage: 'en',
        key: YOUTUBE_API_KEY,
        videoEmbeddable: true,
        order: 'relevance'
      }
    });

    const video = response.data.items[0];
    if (!video) {
      throw new Error('No videos found');
    }

    return {
      title: video.snippet.title,
      description: video.snippet.description,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      thumbnailUrl: video.snippet.thumbnails.medium.url,
      channelTitle: video.snippet.channelTitle
    };
  } catch (error) {
    console.error('YouTube API error:', error);
    // Fallback video recommendation
    return {
      title: `${subject} Career Guide`,
      description: "Career development and guidance",
      url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${subject} career guide`),
      thumbnailUrl: "https://placehold.co/320x180?text=Career+Development+Guide",
      channelTitle: "Career Insights"
    };
  }
}
