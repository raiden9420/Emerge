// Survey form schema
export type SurveyFormData = {
  name: string;
  email: string;
  subjects: string[];
  interests: string;
  skills: string;
  goal: string;
  thinking_style: "Plan" | "Flow";
  extra_info?: string;
  avatar?: string;
};

// Dashboard data types
export type DashboardData = {
  user: UserProfile;
  goals: Goal[];
  activities: Activity[];
  recommendations: Recommendation[];
  trends: Trend[];
  daily_challenge?: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    xp: number;
  };
};

export type UserProfile = {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  subjects: string[];
  interests: string;
  skills: string;
  goal: string;
  thinking_style: string;
  extra_info?: string;
  level: number;
  progress: number;
  streak_days?: number;
  hasProfile: boolean;
};

export type Goal = {
  id: string;
  title: string;
  completed: boolean;
  progress: number;
};

export type Activity = {
  id: string;
  type: 'lesson' | 'badge' | 'course';
  title: string;
  time: string;
  isRecent: boolean;
};

export type Recommendation = {
  id: string;
  type: 'course' | 'video';
  title: string;
  description: string;
  url: string;
  metadata?: {
    duration?: string;
    level?: string;
    thumbnailUrl?: string;
    channelTitle?: string;
  };
};

export type Trend = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'article' | 'post';
  metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
};

// Chat message type
export type ChatMessage = {
  id: number;
  message: string;
  sender: 'user' | 'bot';
  timestamp: string;
};
