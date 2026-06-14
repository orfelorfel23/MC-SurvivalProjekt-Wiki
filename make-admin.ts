import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Please provide the email of the user to make admin.");
    console.log("Usage: npx tsx make-admin.ts <user-email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found. Please log in to the website first to create an account.`);
    process.exit(1);
  }

  // Create or verify ADMIN role
  const existingRole = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId: user.id,
        role: "ADMIN"
      }
    }
  });

  if (existingRole) {
    console.log(`User ${email} is already an ADMIN.`);
  } else {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: "ADMIN"
      }
    });
    console.log(`Successfully granted ADMIN role to ${email}.`);
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
