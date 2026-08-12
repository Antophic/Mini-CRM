import { PrismaClient } from "@prisma/client";
import { isProduction } from "./env.js";

export const prisma = new PrismaClient({
  log: isProduction ? ["error"] : ["query", "warn", "error"],
});
