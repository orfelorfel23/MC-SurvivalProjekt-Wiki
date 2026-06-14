import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@temp.com";
  const password = "password123";
  const name = "Temp Admin";

  console.log(`Creating user ${email}...`);
  
  // Create user via Better Auth API
  try {
    const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:3000"
      },
      body: JSON.stringify({
        email,
        password,
        name
      })
    });
    
    if (!res.ok) {
      const text = await res.text();
      if (text.includes("USER_ALREADY_EXISTS")) {
        console.log("User already exists, proceeding to grant admin role...");
      } else {
        throw new Error(`Failed to create user: ${res.status} ${res.statusText} - ${text}`);
      }
    } else {
      console.log("User created successfully via Auth API.");
    }
  } catch (err) {
    console.error("Warning: Could not create user via API. Make sure the dev server is running on localhost:3000.", err.message);
  }

  // Find user and grant admin
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found in DB. Registration failed.`);
    process.exit(1);
  }

  const existingRole = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId: user.id,
        role: "ADMIN"
      }
    }
  });

  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: "ADMIN"
      }
    });
    console.log(`Successfully granted ADMIN role to ${email}.`);
  } else {
    console.log(`User ${email} is already an ADMIN.`);
  }

  console.log("\n=============================================");
  console.log("TEMP ADMIN CREATED!");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("=============================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
