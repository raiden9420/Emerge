
import { Trophy, CheckCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type DailyChallengeProps = {
    challenge?: {
        id: string;
        title: string;
        description: string;
        completed: boolean;
        xp: number;
    };
};

export function DailyChallengeCard({ challenge }: DailyChallengeProps) {
    const [isCompleted, setIsCompleted] = useState(challenge?.completed || false);
    const { toast } = useToast();

    if (!challenge) return null;

    const handleComplete = () => {
        if (isCompleted) return;

        setIsCompleted(true);
        toast({
            title: "Challenge Completed! 🎉",
            description: `You earned ${challenge.xp} XP!`,
        });
        // In a real app, you would call an API here
    };

    return (
        <Card className={`border-l-4 ${isCompleted ? 'border-l-green-500' : 'border-l-blue-500'}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Daily Challenge
                    </CardTitle>
                    <span className="text-xs font-bold px-2 py-1 bg-secondary rounded-full">
                        {challenge.xp} XP
                    </span>
                </div>
                <CardDescription>Complete this to keep your streak!</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium">{challenge.title}</h4>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>

                    <Button
                        className="w-full"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={handleComplete}
                        disabled={isCompleted}
                    >
                        {isCompleted ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Completed
                            </>
                        ) : (
                            <>
                                <Circle className="mr-2 h-4 w-4" />
                                Mark as Complete
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
