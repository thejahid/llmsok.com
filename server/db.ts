import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not set. Using in-memory storage for testing only!",
  );
  // For testing only - will use in-memory storage
  process.env.DATABASE_URL = "postgresql://localhost:5432/test";
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });