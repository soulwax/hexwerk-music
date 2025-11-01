// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { readFileSync } from "fs";
import path from "path";
import drizzleEnv from "./drizzle.env";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: drizzleEnv.DB_HOST ?? "localhost",
    port: parseInt(drizzleEnv.DB_PORT ?? "5432", 10),
    user: drizzleEnv.DB_ADMIN_USER,
    password: drizzleEnv.DB_ADMIN_PASSWORD,
    database: drizzleEnv.DB_NAME ?? "postgres",
    ssl: {
      rejectUnauthorized: true,
      ca: readFileSync(path.join(process.cwd(), "certs/ca.pem")).toString(),
    },
  },
});
