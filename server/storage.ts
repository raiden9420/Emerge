import { 
  users, type User, type InsertUser,
  goals, type Goal, type InsertGoal,
  activities, type Activity, type InsertActivity,
  chatHistory, type ChatMessage, type InsertChatMessage,
  recommendations, type Recommendation, type InsertRecommendation
} from "@shared/schema";

// Modify the interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserProgress(id: number, increment: number): Promise<User | undefined>;
  
  // Goals methods
  getGoalsByUserId(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Activities methods
  getActivitiesByUserId(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Chat history methods
  getChatHistoryByUserId(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Recommendations methods
  getRecommendationsByUserId(userId: number, type?: string): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  deleteRecommendation(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private goalsMap: Map<number, Goal>;
  private activitiesMap: Map<number, Activity>;
  private chatHistoryMap: Map<number, ChatMessage>;
  private recommendationsMap: Map<number, Recommendation>;
  
  private userId: number;
  private goalId: number;
  private activityId: number;
  private chatId: number;
  private recommendationId: number;

  constructor() {
    this.usersMap = new Map();
    this.goalsMap = new Map();
    this.activitiesMap = new Map();
    this.chatHistoryMap = new Map();
    this.recommendationsMap = new Map();
    
    this.userId = 1;
    this.goalId = 1;
    this.activityId = 1;
    this.chatId = 1;
    this.recommendationId = 1;
    
    // Add demo user
    this.createUser({
      username: "demo",
      password: "password",
      name: "John Doe",
      email: "john@example.com",
      subjects: ["Computer Science"],
      interests: "Programming, AI, Machine Learning",
      skills: "JavaScript, Python, React",
      goal: "Internship",
      thinking_style: "Plan",
      extra_info: "Looking for summer internships in tech"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const level = 1;
    const progress = 0;
    const created_at = new Date();
    const updated_at = new Date();
    
    const user: User = { 
      ...insertUser, 
      id, 
      level, 
      progress, 
      created_at, 
      updated_at 
    };
    
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const updated = { 
      ...user, 
      ...userData,
      updated_at: new Date()
    };
    
    this.usersMap.set(id, updated);
    return updated;
  }
  
  async updateUserProgress(id: number, increment: number): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const newProgress = Math.min(100, (user.progress || 0) + increment);
    let newLevel = user.level || 1;
    
    // If progress reaches 100%, level up and reset progress
    if (newProgress >= 100) {
      newLevel += 1;
    }
    
    const updated = { 
      ...user, 
      progress: newProgress % 100,
      level: newLevel,
      updated_at: new Date()
    };
    
    this.usersMap.set(id, updated);
    return updated;
  }

  // Goals methods
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    return Array.from(this.goalsMap.values()).filter(
      (goal) => goal.user_id === userId
    );
  }
  
  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.goalId++;
    const created_at = new Date();
    const updated_at = new Date();
    
    const goal: Goal = { 
      ...insertGoal, 
      id, 
      created_at, 
      updated_at 
    };
    
    this.goalsMap.set(id, goal);
    return goal;
  }
  
  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goalsMap.get(id);
    if (!goal) return undefined;
    
    const updated = { 
      ...goal, 
      ...goalData,
      updated_at: new Date()
    };
    
    this.goalsMap.set(id, updated);
    return updated;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goalsMap.delete(id);
  }

  // Activities methods
  async getActivitiesByUserId(userId: number): Promise<Activity[]> {
    return Array.from(this.activitiesMap.values())
      .filter((activity) => activity.user_id === userId)
      .sort((a, b) => b.time.getTime() - a.time.getTime()); // Sort by time (newest first)
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const time = insertActivity.time || new Date();
    
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      time
    };
    
    this.activitiesMap.set(id, activity);
    return activity;
  }

  // Chat history methods
  async getChatHistoryByUserId(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatHistoryMap.values())
      .filter((message) => message.user_id === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort by timestamp
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatId++;
    const timestamp = insertMessage.timestamp || new Date();
    
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      timestamp
    };
    
    this.chatHistoryMap.set(id, message);
    return message;
  }

  // Recommendations methods
  async getRecommendationsByUserId(userId: number, type?: string): Promise<Recommendation[]> {
    let recommendations = Array.from(this.recommendationsMap.values())
      .filter((rec) => rec.user_id === userId);
      
    if (type) {
      recommendations = recommendations.filter(rec => rec.type === type);
    }
    
    return recommendations.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }
  
  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const id = this.recommendationId++;
    const created_at = new Date();
    
    const recommendation: Recommendation = { 
      ...insertRecommendation, 
      id, 
      created_at
    };
    
    this.recommendationsMap.set(id, recommendation);
    return recommendation;
  }
  
  async deleteRecommendation(id: number): Promise<boolean> {
    return this.recommendationsMap.delete(id);
  }
}

export const storage = new MemStorage();
