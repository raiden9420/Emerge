
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    subjects: [] as string[],
    interests: "",
    skills: "",
    extra_info: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        if (data.success) {
          setProfile(data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }
    if (userId) fetchProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, user_id: parseInt(userId || '0') })
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subjects (comma-separated)</label>
          <Input
            value={profile.subjects.join(', ')}
            onChange={(e) => setProfile({ ...profile, subjects: e.target.value.split(',').map(s => s.trim()) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Interests</label>
          <Textarea
            value={profile.interests}
            onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Skills</label>
          <Textarea
            value={profile.skills}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Additional Information</label>
          <Textarea
            value={profile.extra_info}
            onChange={(e) => setProfile({ ...profile, extra_info: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
