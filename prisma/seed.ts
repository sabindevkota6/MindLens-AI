import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  // admin login for dashboard verification queue (override with ADMIN_SEED_* in .env)
  const adminEmail =
    process.env.ADMIN_SEED_EMAIL ?? "admin@mindlens.local";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "AdminDev123!";
  const adminName = process.env.ADMIN_SEED_NAME ?? "MindLens Admin";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", passwordHash: adminHash },
    });
    await prisma.adminProfile.upsert({
      where: { userId: existing.id },
      update: { fullName: adminName },
      create: { userId: existing.id, fullName: adminName },
    });
    console.log(`Updated admin user: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminHash,
        role: "ADMIN",
        adminProfile: { create: { fullName: adminName } },
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
