import { TrendingUp, RefreshCw, BookOpen, Twitter as X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

type TrendingTopicsProps = {
  userId: string;
};

type Trend = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "article" | "post";
  metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
};

export function TrendingTopicsCard({ userId }: TrendingTopicsProps) {
  const {
    data: trends = [],
    isLoading,
    refetch,
    error,
    isError,
  } = useQuery({
    queryKey: ["career-trends", userId],
    queryFn: async () => {
      try {
        // Fetch user data to get subject
        const userResponse = await fetch(`/api/user/${userId}`);

        if (!userResponse.ok) {
          throw new Error(`HTTP error! status: ${userResponse.status}`);
        }

        const userData = await userResponse.json();

        if (!userData.success) {
          throw new Error("Failed to fetch user data");
        }

        const subject = userData.user?.subjects?.[0] || "Career Development";

        // Fetch trends based on subject
        const trendsResponse = await fetch(
          `/api/career-trends/${encodeURIComponent(subject)}`,
        );

        if (!trendsResponse.ok) {
          throw new Error(`HTTP error! status: ${trendsResponse.status}`);
        }

        const trendsData = await trendsResponse.json();

        if (!trendsData.success) {
          throw new Error(trendsData.message || "Failed to fetch trends data");
        }

        return Array.isArray(trendsData.data) ? trendsData.data : [];
      } catch (error) {
        console.error("Error fetching trends:", error);
        return [];
      }
    },
    refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Career Trend Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
          title="Refresh trends"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Discover the latest trends and opportunities in your field, updated
          regularly with industry insights. Links open in a new tab.
        </p>
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
                  {trend.type === "post" ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium">{trend.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {trend.description}
                  </p>
                  {trend.metrics && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ♥ {trend.metrics.like_count} · 🔄{" "}
                      {trend.metrics.retweet_count}
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
