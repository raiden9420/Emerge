import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Connect to the database using the DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Use postgres.js instead of neon-serverless
const queryClient = postgres(process.env.DATABASE_URL);

// Create drizzle client
export const db = drizzle(queryClient, { schema });
