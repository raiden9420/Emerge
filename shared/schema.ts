import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  subjects: json("subjects").$type<string[]>(),
  interests: text("interests"),
  skills: text("skills"),
  goal: text("goal"),
  thinking_style: text("thinking_style"),
  extra_info: text("extra_info"),
  level: integer("level").default(1),
  progress: integer("progress").default(0),
  streak_days: integer("streak_days").default(0),
  last_login_date: timestamp("last_login_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatar: true,
  subjects: true,
  interests: true,
  skills: true,
  goal: true,
  thinking_style: true,
  extra_info: true,
});

// Goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  progress: integer("progress").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  user_id: true,
  title: true,
  completed: true,
  progress: true,
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'lesson', 'badge', 'course', etc.
  title: text("title").notNull(),
  time: timestamp("time").defaultNow(),
  is_recent: boolean("is_recent").default(true),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  user_id: true,
  type: true,
  title: true,
  is_recent: true,
});

// Chat history table
export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  sender: text("sender").notNull(), // 'user' or 'bot'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatSchema = createInsertSchema(chatHistory).pick({
  user_id: true,
  message: true,
  sender: true,
});

// User recommendations table
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'course', 'video', 'article'
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).pick({
  user_id: true,
  type: true,
  title: true,
  description: true,
  url: true,
  metadata: true,
});

// Export the types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ChatMessage = typeof chatHistory.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatSchema>;

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
