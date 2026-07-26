import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI config (v7).
 * Prefer DIRECT_URL for migrations when DATABASE_URL is pooled (Supabase).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      "postgresql://localhost:5432/zolanzo",
  },
});
