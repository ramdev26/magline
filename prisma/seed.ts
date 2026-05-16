import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.PRISMA_DATABASE_URL;

if (!databaseUrl) {
  console.error("Set DATABASE_URL or POSTGRES_URL before running seed.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

const SUPER_ADMIN_EMAIL = "luckygamage@ymail.com";
const SUPER_ADMIN_PASSWORD = "Mgl@9Kx#2026Qw7$Zp4Lm";
const SUPER_ADMIN_NAME = "Lucky Gamage";

async function main() {
  console.log("Clearing existing data...");
  await prisma.inquiry.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.salesPerson.deleteMany();
  await prisma.salesManager.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      role: "SUPER_ADMIN",
      passwordHash: await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12),
    },
  });

  console.log("Done. All inquiry/customer/sales data removed.");
  console.log("Super admin account created:");
  console.log(`  Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log("Store this password securely and change it after first login if desired.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
