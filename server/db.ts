import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

// Connect to the database using the DATABASE_URL environment variable
const client = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;

export const db = client ? drizzle(client, { schema }) : null;
