import { CheckIcon, PlusIcon, Medal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Goal = {
  id: string;
  title: string;
  completed: boolean;
  progress: number;
};

type GoalsCardProps = {
  goals: Goal[];
  userId: number;
};

export function GoalsCard({ goals, userId }: GoalsCardProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddGoal = async () => {
    if (!newGoalText.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/goals", {
        method: "POST",
        body: JSON.stringify({
          task: newGoalText,
          completed: false,
          userId
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to add goal');
      }

      // Reset form
      setNewGoalText("");
      setIsAddingGoal(false);

      // Invalidate goals cache to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/${userId}`] });

      // Create activity for the new goal
      await apiRequest("/api/activities", {
        method: "POST",
        body: JSON.stringify({
          userId,
          type: "goal_created",
          title: `Created new goal: ${newGoalText}`
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      toast({
        title: "Goal added",
        description: "Your new learning goal has been added successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGoal = async (goalId: string, completed: boolean) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await apiRequest(`/api/goals/${goalId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (completed) {
        // Wait a moment to show strike-through
        await new Promise(resolve => setTimeout(resolve, 500));
        await apiRequest(`/api/goals/${goalId}`, {
          method: 'DELETE'
        });
      }

      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/todos/${userId}`] });
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/goals/suggest/${userId}`);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to refresh goals');
      }

      // Force an immediate refetch of dashboard data and update UI
      await queryClient.invalidateQueries({ queryKey: [`/api/dashboard/${userId}`] });
      await queryClient.refetchQueries({ queryKey: [`/api/dashboard/${userId}`], type: 'active' });

      // Show success toast
      toast({
        title: "Goals refreshed",
        description: "New goal suggestions have been generated based on your profile."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new goal suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Learning Goals</CardTitle>
        <Medal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Complete these tasks to improve your career readiness
        </p>

        {isAddingGoal && (
          <div className="mb-4 flex space-x-2">
            <Input
              placeholder="Enter a new goal..."
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={handleAddGoal} disabled={isLoading || !newGoalText.trim()} size="sm">
              Add
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No goals yet. Add a goal or click "Refresh Suggestions" to get AI-generated goals based on your profile.</p>
            </div>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="flex items-start gap-2">
                <div 
                  className={`flex h-5 w-5 items-center justify-center rounded-full border border-primary/50 ${goal.completed ? 'bg-primary/10' : ''} cursor-pointer`}
                  onClick={() => handleToggleGoal(goal.id, !goal.completed)}
                >
                  {goal.completed && <CheckIcon className="h-3 w-3 text-primary" />}
                </div>
                <div className="w-full">
                  <p className={`text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {goal.title}
                  </p>
                  <div className="h-1.5 w-full bg-accent rounded-full mt-2">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsAddingGoal(!isAddingGoal)}
            disabled={isLoading}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add New Goal
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleRefreshSuggestions}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}