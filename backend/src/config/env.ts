import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}, z.boolean());

const envSchema = z.object({
  COOKIE_NAME: z.string().min(1).default("mini_crm_token"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
  COOKIE_SECURE: booleanFromEnv.default(false),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default("1d"),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  REQUEST_BODY_LIMIT: z.string().min(1).default("100kb"),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
