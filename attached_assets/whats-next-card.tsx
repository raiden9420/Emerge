import { useState, useEffect } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type WhatsNextProps = {
  userId: number;
};

export function WhatsNextCard({ userId }: WhatsNextProps) {
  const [video, setVideo] = useState<{ title: string; description: string; url: string } | null>(null);
  const [course, setCourse] = useState<{ title: string; description: string; duration: string; level: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const profileResponse = await fetch(`/api/user/${userId}`);
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
      const videoData = await videoResponse.json();

      if (!videoResponse.ok) {
        throw new Error('Failed to fetch video recommendations');
      }

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
      const courseData = await courseResponse.json();
      console.log('Course recommendation response:', courseData);

      if (courseData.success && courseData.course) {
        setCourse(courseData.course);
      } else {
        console.error('Course recommendation error:', courseData);
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
                onClick={() => window.location.href = course.url}
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
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-md mt-3"
                />
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