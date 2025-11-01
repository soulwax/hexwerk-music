// File: drizzle.env.ts

import "dotenv/config";

const required = (key: string) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

const config = {
  DB_HOST: required("DB_HOST"),
  DB_PORT: required("DB_PORT"),
  DB_ADMIN_USER: required("DB_ADMIN_USER"),
  DB_ADMIN_PASSWORD: required("DB_ADMIN_PASSWORD"),
  DB_NAME: required("DB_NAME"),
};

export default config;