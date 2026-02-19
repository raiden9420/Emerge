import {
  users, type User, type InsertUser,
  goals, type Goal, type InsertGoal,
  activities, type Activity, type InsertActivity,
  chatHistory, type ChatMessage, type InsertChatMessage,
  recommendations, type Recommendation, type InsertRecommendation
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";

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
  clearUserGoals(userId: number): Promise<void>;

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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("Database not initialized");
    // Check existing users with the same username to avoid duplicates
    const existingUser = await this.getUserByUsername(insertUser.username);
    if (existingUser) {
      throw new Error(`Username '${insertUser.username}' is already taken`);
    }

    try {
      console.log('Creating user with data:', JSON.stringify(insertUser));

      // For PostgreSQL, we need to handle arrays correctly
      // The JSON field will be handled automatically by Drizzle ORM
      const result = await db.insert(users).values({
        username: insertUser.username,
        password: insertUser.password,
        name: insertUser.name || null,
        email: insertUser.email || null,
        avatar: insertUser.avatar || null,
        subjects: insertUser.subjects || [],
        interests: insertUser.interests || null,
        skills: insertUser.skills || null,
        goal: insertUser.goal || null,
        thinking_style: insertUser.thinking_style || null,
        extra_info: insertUser.extra_info || null
      }).returning();

      return result[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");
    const now = new Date();

    // Explicitly handle fields that might be updated
    const updateData: any = { ...userData, updated_at: now };

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async updateUserProgress(id: number, increment: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not initialized");

    // First get the current user
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;

    const newProgress = Math.min(100, (currentUser.progress || 0) + increment);
    let newLevel = currentUser.level || 1;

    // If progress reaches 100%, level up and reset progress
    if (newProgress >= 100) {
      newLevel += 1;
    }

    // Update the user
    const result = await db
      .update(users)
      .set({
        progress: newProgress % 100,
        level: newLevel,
        updated_at: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    return result.length > 0 ? result[0] : undefined;
  }

  // Goals methods
  async getGoalsByUserId(userId: number): Promise<Goal[]> {
    if (!db) throw new Error("Database not initialized");
    return db.select().from(goals).where(eq(goals.user_id, userId));
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(goals).values(insertGoal).returning();
    return result[0];
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    if (!db) throw new Error("Database not initialized");
    const now = new Date();
    const result = await db
      .update(goals)
      .set({ ...goalData, updated_at: now })
      .where(eq(goals.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteGoal(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(goals).where(eq(goals.id, id)).returning();
    return result.length > 0;
  }

  async clearUserGoals(userId: number): Promise<void> {
    try {
      await db.delete(goals).where(eq(goals.user_id, userId));
    } catch (error) {
      console.error("Error clearing user goals:", error);
      throw error;
    }
  }

  // Activities methods
  async getActivitiesByUserId(userId: number): Promise<Activity[]> {
    if (!db) throw new Error("Database not initialized");
    return db
      .select()
      .from(activities)
      .where(eq(activities.user_id, userId))
      .orderBy(desc(activities.time));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(activities).values(insertActivity).returning();
    return result[0];
  }

  // Chat history methods
  async getChatHistoryByUserId(userId: number): Promise<ChatMessage[]> {
    if (!db) throw new Error("Database not initialized");
    return db
      .select()
      .from(chatHistory)
      .where(eq(chatHistory.user_id, userId))
      .orderBy(chatHistory.timestamp);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(chatHistory).values(insertMessage).returning();
    return result[0];
  }

  // Recommendations methods
  async getRecommendationsByUserId(userId: number, type?: string): Promise<Recommendation[]> {
    if (!db) throw new Error("Database not initialized");

    if (type) {
      return db
        .select()
        .from(recommendations)
        .where(and(
          eq(recommendations.user_id, userId),
          eq(recommendations.type, type)
        ))
        .orderBy(desc(recommendations.created_at));
    } else {
      return db
        .select()
        .from(recommendations)
        .where(eq(recommendations.user_id, userId))
        .orderBy(desc(recommendations.created_at));
    }
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.insert(recommendations).values(insertRecommendation).returning();
    return result[0];
  }

  async deleteRecommendation(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not initialized");
    const result = await db.delete(recommendations).where(eq(recommendations.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();