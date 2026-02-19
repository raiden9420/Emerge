import { useState, useEffect } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type WhatsNextProps = {
  userId: number;
};

export function WhatsNextCard({ userId }: WhatsNextProps) {
  const [video, setVideo] = useState<{ title: string; description: string; url: string; thumbnailUrl?: string; channelTitle?: string } | null>(null);
  const [course, setCourse] = useState<{ title: string; description: string; duration: string; level: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const profileResponse = await fetch(`/api/user/${userId}`);
      
      if (!profileResponse.ok) {
        throw new Error(`HTTP error! status: ${profileResponse.status}`);
      }
      
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.user.hasProfile) {
        toast({
          title: "Profile Required",
          description: "Please complete your profile survey to get recommendations.",
          variant: "default"
        });
        // Set default recommendations
        setVideo({
          title: "Career Development Essentials",
          description: "Learn the fundamentals of career planning and growth",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        });
        setCourse({
          title: "Professional Skills 101",
          description: "Master the essential skills for career success",
          duration: "2 weeks",
          level: "Beginner",
          url: "https://www.coursera.org/learn/professional-skills"
        });
        return;
      }

      // Fetch video recommendation
      const videoResponse = await fetch(`/api/personalized-recommendations/${userId}`);
      
      if (!videoResponse.ok) {
        throw new Error(`HTTP error! status: ${videoResponse.status}`);
      }
      
      const videoData = await videoResponse.json();

      if (videoData.success && videoData.data?.video) {
        setVideo(videoData.data.video);
      } else {
        setVideo({
          title: "Career Development Essentials",
          description: "Learn the fundamentals of career planning and growth",
          url: "https://replit.com/learn",
          thumbnailUrl: "https://placehold.co/320x180?text=Career+Development",
          channelTitle: "Replit Learning"
        });
      }

      // Fetch course recommendation
      const courseResponse = await fetch(`/api/course-recommendation/${userId}`);
      
      if (!courseResponse.ok) {
        throw new Error(`HTTP error! status: ${courseResponse.status}`);
      }
      
      const courseData = await courseResponse.json();

      if (courseData.success && courseData.course) {
        setCourse(courseData.course);
      } else {
        toast({
          title: "Course Recommendation",
          description: "Unable to load course recommendation. Please try again.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personalized Recommendations</CardTitle>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchRecommendations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {course && (
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{course.title}</h4>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">{course.duration}</span>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">{course.level}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => window.open(course.url, '_blank')}
              >
                Start Learning
              </Button>
            </div>
          )}
          {video && (
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Recommended Video</h4>
                  <p className="text-sm text-muted-foreground">{video.title}</p>
                  {video.description && (
                    <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
                  )}
                  {video.channelTitle && (
                    <p className="text-xs text-primary mt-1">By {video.channelTitle}</p>
                  )}
                </div>
              </div>
              {video.thumbnailUrl && (
                <div className="w-full h-32 bg-muted mt-3 flex items-center justify-center rounded-md overflow-hidden">
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="flex flex-col items-center justify-center text-muted-foreground h-full">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span class="text-xs">Video preview</span>
                        </div>
                      `;
                    }}
                  />
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-3" 
                onClick={() => window.open(video.url, '_blank')}
              >
                Watch Video
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
