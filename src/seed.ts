import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function bootstrapDatabase() {
  console.log('Starting idempotent DB bootstrap...');

  const pw = await bcrypt.hash('password123', 10);

  // 1. Create Users Safely (Upsert)
  const student = await prisma.user.upsert({
    where: { email: 'aarav@test.com' },
    update: { password: pw },
    create: {
      name: 'Aarav Sharma', email: 'aarav@test.com', password: pw, role: 'STUDENT',
      studentProfile: { create: {} }
    },
    include: { studentProfile: true }
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'smith@test.com' },
    update: { password: pw },
    create: {
      name: 'Mr. Smith', email: 'smith@test.com', password: pw, role: 'TEACHER',
      teacherProfile: { create: {} }
    },
    include: { teacherProfile: true }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: pw },
    create: {
      name: 'Admin User', email: 'admin@test.com', password: pw, role: 'ADMIN',
      adminProfile: { create: {} }
    },
    include: { adminProfile: true }
  });

  console.log('Idempotent DB bootstrap finished successfully.');
}

if (require.main === module) {
  bootstrapDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
