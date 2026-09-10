const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "Appointment" SET "appointmentType" = 'New consultation' WHERE "appointmentType" = 'Initial consultation'`
  );
  console.log(`Updated ${result} appointment(s) from "Initial consultation" to "New consultation".`);
  await prisma.$disconnect();
})();
