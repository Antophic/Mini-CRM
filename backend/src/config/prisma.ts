import { PrismaClient } from "@prisma/client";
import { env, isProduction } from "./env.js";

export const prisma = new PrismaClient({
  log: env.NODE_ENV === "test" ? [] : isProduction ? ["error"] : ["query", "warn", "error"],
});
