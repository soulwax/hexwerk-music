// File: src/server/db/index.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: true,
    ca: readFileSync(path.join(process.cwd(), "certs/ca.pem")).toString(),
  },
});

export const db = drizzle(pool, { schema });
