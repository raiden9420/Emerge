import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Use memory storage in development if DATABASE_URL is not provided
const client = process.env.DATABASE_URL 
  ? postgres(process.env.DATABASE_URL)
  : null;

export const db = client ? drizzle(client, { schema }) : null;
