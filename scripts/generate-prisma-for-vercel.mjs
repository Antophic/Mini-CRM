import { spawnSync } from "node:child_process";

if (!process.env.VERCEL) {
  console.log("Skipping Prisma generate outside Vercel build.");
  process.exit(0);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  command,
  ["prisma", "generate", "--schema", "backend/prisma/schema.prisma"],
  {
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
