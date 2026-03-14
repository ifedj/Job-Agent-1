import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (development), then fall back to .env
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use the direct (non-pooled) URL for migrations to avoid pgBouncer issues
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
