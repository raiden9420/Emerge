import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

export const db = await (async () => {
  if (!process.env.DATABASE_URL) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const fs = await import("fs");
    const path = await import("path");

    // Ensure data directory exists
    const dataDir = path.resolve(process.cwd(), ".data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Use a persistent database in the current directory if possible
    const client = new PGlite(path.join(dataDir, "pglite"));
    const db = drizzlePglite(client, { schema });
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Using local PGlite database with migrations applied");
    return db;
  } else {
    const queryClient = postgres(process.env.DATABASE_URL);
    return drizzle(queryClient, { schema });
  }
})();
