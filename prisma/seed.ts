import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const specialties = [
  "Anxiety",
  "Depression",
  "Trauma",
  "Stress Management",
  "Grief & Loss",
  "Anger Management",
  "Self-Esteem",
  "OCD",
  "PTSD",
  "General Counseling",
  "Behavioral Therapy",
  "Life Coaching / Transitions",
];

async function main() {
  console.log("Seeding specialties...");

  for (const name of specialties) {
    await prisma.specialtyType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${specialties.length} specialties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
