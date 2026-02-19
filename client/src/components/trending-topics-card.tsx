import { useState } from "react";
import { TrendingUp, RefreshCw, BookOpen, Twitter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Trend } from "@/lib/types";

type TrendingTopicsProps = {
  userId: string;
};

export function TrendingTopicsCard({ userId }: TrendingTopicsProps) {
  const [subject, setSubject] = useState<string>("");

  // First fetch user data to get the subject
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: [`/api/user/${userId}`],
    onSuccess: (data) => {
      if (data?.user?.subjects?.length) {
        setSubject(data.user.subjects[0]);
      } else {
        setSubject("Career Development");
      }
    }
  });

  // Then fetch trends based on the subject
  const { 
    data: trendsData, 
    isLoading: isLoadingTrends, 
    error, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['career-trends', subject],
    queryFn: async () => {
      if (!subject) return [];
      
      const response = await fetch(`/api/career-trends/${encodeURIComponent(subject)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }
      
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!subject,
  });

  const isLoading = isLoadingUser || isLoadingTrends;
  const trends: Trend[] = trendsData || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          What's Hot
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
          title="Refresh trends"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isError ? (
            <p className="text-sm text-red-500 text-center py-4">
              Failed to load trends. Please try again.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading trends...
            </p>
          ) : trends.length > 0 ? (
            trends.map((trend: Trend) => (
              <div key={trend.id} className="flex items-start space-x-4">
                <div className="rounded-full bg-muted p-2">
                  {trend.type === 'post' ? <Twitter className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-medium">{trend.title}</h3>
                  <p className="text-sm text-muted-foreground">{trend.description}</p>
                  {trend.metrics && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ♥ {trend.metrics.like_count} · 🔄 {trend.metrics.retweet_count}
                    </p>
                  )}
                  <a 
                    href={trend.url}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Learn more →
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trends available at the moment.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
