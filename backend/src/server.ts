import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { app } from "./app.js";

const server = app.listen(env.PORT, () => {
  console.log(`API server running on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Closing API server.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
