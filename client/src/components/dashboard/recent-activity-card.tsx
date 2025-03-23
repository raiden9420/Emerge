import { GraduationCap, Award, BookOpen, ChevronRight, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Activity = {
  id: string;
  type: 'lesson' | 'badge' | 'course';
  title: string;
  time: string;
  isRecent: boolean;
};

type RecentActivityCardProps = {
  activities: Activity[];
};

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lesson':
        return <GraduationCap className="h-4 w-4 text-primary" />;
      case 'badge':
        return <Award className="h-4 w-4 text-muted-foreground" />;
      case 'course':
        return <BookOpen className="h-4 w-4 text-muted-foreground" />;
      default:
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'lesson':
        return <>Attended <span className="font-semibold">{activity.title}</span></>;
      case 'badge':
        return <>Earned <span className="font-semibold">{activity.title}</span></>;
      case 'course':
        return <>Started <span className="font-semibold">{activity.title}</span></>;
      default:
        return activity.title;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <History className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Your recent career development activities
        </p>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="relative mt-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  activity.type === 'lesson' ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                {activity.isRecent && (
                  <span className="absolute bottom-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{getActivityText(activity)}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-4">
          View all activity
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
