import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function bootstrapDatabase() {
  console.log('Seeding Database with Hackathon Demo Data...');

  await prisma.user.deleteMany();
  await prisma.class.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.assessment.deleteMany();

  const pw = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const student = await prisma.user.create({
    data: {
      name: 'Aarav Sharma', email: 'aarav@test.com', password: pw, role: 'STUDENT',
      studentProfile: { create: {} }
    },
    include: { studentProfile: true }
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Mr. Smith', email: 'smith@test.com', password: pw, role: 'TEACHER',
      teacherProfile: { create: {} }
    },
    include: { teacherProfile: true }
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User', email: 'admin@test.com', password: pw, role: 'ADMIN',
      adminProfile: { create: {} }
    }
  });

  // 2. Class
  const mathClass = await prisma.class.create({
    data: {
      name: 'Grade 10 Mathematics',
      students: { connect: { id: student.studentProfile!.id } },
      teachers: { connect: { id: teacher.teacherProfile!.id } }
    }
  });

  // 3. Concepts
  const algebra = await prisma.concept.create({ data: { name: 'Algebra Basics' } });
  const quadratic = await prisma.concept.create({ data: { name: 'Quadratic Equations' } });
  const factorization = await prisma.concept.create({ data: { name: 'Factorization' } });
  
  await prisma.conceptDependency.create({
    data: { conceptId: quadratic.id, prerequisiteId: algebra.id }
  });
  await prisma.conceptDependency.create({
    data: { conceptId: quadratic.id, prerequisiteId: factorization.id }
  });

  // 4. Assessment
  const assessment = await prisma.assessment.create({
    data: {
      title: 'Mathematics — Algebra & Functions Assessment',
      subject: 'Math', difficulty: 'INTERMEDIATE', status: 'PUBLISHED',
      creatorId: teacher.id,
      assignedClasses: { connect: { id: mathClass.id } }
    }
  });

  // Questions
  const q1 = await prisma.question.create({
    data: {
      text: 'Solve for x: x^2 - 5x + 6 = 0', type: 'MCQ', options: JSON.stringify(['x=2, x=3', 'x=-2, x=-3', 'x=1, x=6']),
      correctAnswer: 'x=2, x=3', conceptId: quadratic.id, difficulty: 'INTERMEDIATE'
    }
  });
  const q2 = await prisma.question.create({
    data: {
      text: 'What are the roots of x^2 + 4x + 4 = 0?', type: 'MCQ', options: JSON.stringify(['x=-2', 'x=2', 'x=4']),
      correctAnswer: 'x=-2', conceptId: quadratic.id, difficulty: 'INTERMEDIATE'
    }
  });
  const q3 = await prisma.question.create({
    data: {
      text: 'Expand (x+3)(x-2)', type: 'MCQ', options: JSON.stringify(['x^2 + x - 6', 'x^2 - x - 6', 'x^2 + 5x - 6']),
      correctAnswer: 'x^2 + x - 6', conceptId: algebra.id, difficulty: 'BEGINNER'
    }
  });

  await prisma.assessmentQuestion.create({ data: { assessmentId: assessment.id, questionId: q1.id, order: 1 } });
  await prisma.assessmentQuestion.create({ data: { assessmentId: assessment.id, questionId: q2.id, order: 2 } });
  await prisma.assessmentQuestion.create({ data: { assessmentId: assessment.id, questionId: q3.id, order: 3 } });

  // 5. Attempt & Responses (Simulate Aarav failing Quadratic but passing Algebra)
  const attempt = await prisma.attempt.create({
    data: {
      studentId: student.studentProfile!.id,
      assessmentId: assessment.id,
      status: 'COMPLETED',
      score: 33.3,
      completedAt: new Date()
    }
  });

  const r1 = await prisma.response.create({
    data: { attemptId: attempt.id, questionId: q1.id, submittedAnswer: 'x=-2, x=-3', isCorrect: false, analysisStatus: 'COMPLETED', errorClassification: 'Sign Error' }
  });
  const r2 = await prisma.response.create({
    data: { attemptId: attempt.id, questionId: q2.id, submittedAnswer: 'x=2', isCorrect: false, analysisStatus: 'COMPLETED', errorClassification: 'Sign Error' }
  });
  const r3 = await prisma.response.create({
    data: { attemptId: attempt.id, questionId: q3.id, submittedAnswer: 'x^2 + x - 6', isCorrect: true, analysisStatus: 'COMPLETED' }
  });

  // 6. Learning Gap (Quadratic Equations)
  const gap = await prisma.learningGap.create({
    data: {
      studentId: student.studentProfile!.id,
      conceptId: quadratic.id,
      severity: 'HIGH',
      confidence: 0.91,
      status: 'ACTIVE',
      diagnosis: 'Student demonstrates partial understanding of equation structure but struggles with sign handling and root identification.',
      errorPatterns: 'Repeated sign errors and incorrect formula application'
    }
  });

  await prisma.gapEvidence.create({ data: { learningGapId: gap.id, responseId: r1.id, reason: 'Incorrect sign handling' } });
  await prisma.gapEvidence.create({ data: { learningGapId: gap.id, responseId: r2.id, reason: 'Incorrect sign handling' } });

  console.log('Seed completed successfully!');
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
