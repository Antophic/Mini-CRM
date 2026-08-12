import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stages = [
  { key: "new_lead", label: "New Lead", sortOrder: 10, isWon: false, isClosed: false },
  { key: "contacted", label: "Contacted", sortOrder: 20, isWon: false, isClosed: false },
  { key: "proposal", label: "Proposal", sortOrder: 30, isWon: false, isClosed: false },
  { key: "negotiation", label: "Negotiation", sortOrder: 40, isWon: false, isClosed: false },
  { key: "won", label: "Won", sortOrder: 50, isWon: true, isClosed: true },
  { key: "lost", label: "Lost", sortOrder: 60, isWon: false, isClosed: true },
];

async function main() {
  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      create: stage,
      update: stage,
      where: { key: stage.key },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
