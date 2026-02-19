import { useState, useEffect, FormEvent } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = localStorage.getItem('userId');

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    subjects: [] as string[],
    interests: "",
    skills: "",
    goal: "",
    thinking_style: "Plan",
    extra_info: ""
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        if (data.success && data.user) {
          setProfile({
            name: data.user.name || "",
            email: data.user.email || "",
            subjects: Array.isArray(data.user.subjects) ? data.user.subjects : [],
            interests: data.user.interests || "",
            skills: data.user.skills || "",
            goal: data.user.goal || "",
            thinking_style: data.user.thinking_style || "Plan",
            extra_info: data.user.extra_info || ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      }
    }
    fetchProfile();
  }, [userId, toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          user_id: parseInt(userId)
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Profile Updated",
          description: "Your settings have been saved successfully."
        });
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="pl-0 hover:pl-2 transition-all"
          onClick={() => setLocation('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your personal information and career preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="john@example.com"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Focus Subjects</label>
                <Input
                  value={(profile.subjects || []).join(', ')}
                  onChange={(e) => setProfile({
                    ...profile,
                    subjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="e.g. Computer Science, Mathematics (comma separated)"
                />
                <p className="text-xs text-muted-foreground">Separate multiple subjects with commas</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Career Goal</label>
                <Input
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                  placeholder="e.g. Become a Senior Software Engineer"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thinking Style</label>
                  <Select
                    value={profile.thinking_style}
                    onValueChange={(val) => setProfile({ ...profile, thinking_style: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select thinking style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Plan">Plan (Detailed & Structured)</SelectItem>
                      <SelectItem value="Analyst">Analyst (Data-Driven)</SelectItem>
                      <SelectItem value="Creative">Creative (Innovative)</SelectItem>
                      <SelectItem value="Doer">Doer (Action-Oriented)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Interests</label>
                <Textarea
                  value={profile.interests}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                  placeholder="What are your professional interests?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Skills</label>
                <Textarea
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  placeholder="List your key technical and soft skills"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Info</label>
                <Textarea
                  value={profile.extra_info}
                  onChange={(e) => setProfile({ ...profile, extra_info: e.target.value })}
                  placeholder="Anything else we should know?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
