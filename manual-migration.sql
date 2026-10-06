CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "StudentProfile" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

CREATE TABLE "TeacherProfile" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");

CREATE TABLE "AdminProfile" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

CREATE TABLE "Class" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Concept" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Concept_name_key" ON "Concept"("name");

CREATE TABLE "ConceptDependency" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "conceptId" TEXT NOT NULL,
  "prerequisiteId" TEXT NOT NULL,
  CONSTRAINT "ConceptDependency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConceptDependency_conceptId_prerequisiteId_key" ON "ConceptDependency"("conceptId", "prerequisiteId");

CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subject" TEXT,
  "topic" TEXT,
  "difficulty" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "creatorId" TEXT NOT NULL,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "text" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "options" TEXT,
  "correctAnswer" TEXT NOT NULL,
  "topic" TEXT,
  "difficulty" TEXT,
  "explanation" TEXT,
  "conceptId" TEXT NOT NULL,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentQuestion" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "assessmentId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_questionId_key" ON "AssessmentQuestion"("assessmentId", "questionId");

CREATE TABLE "Attempt" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "studentId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Response" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "submittedAnswer" TEXT NOT NULL,
  "isCorrect" BOOLEAN,
  "isPartiallyCorrect" BOOLEAN DEFAULT false,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "errorClassification" TEXT,
  "analysisStatus" TEXT,
  "misconception" TEXT,
  CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningGap" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "studentId" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL,
  "diagnosis" TEXT,
  "errorPatterns" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningGap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GapEvidence" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "learningGapId" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "reason" TEXT,
  CONSTRAINT "GapEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningPath" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "learningGapId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningPathStep" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "learningPathId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "referenceId" TEXT,
  CONSTRAINT "LearningPathStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeSession" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "studentId" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeQuestion" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "sessionId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "options" TEXT,
  "correctAnswer" TEXT NOT NULL,
  "explanation" TEXT,
  "difficulty" TEXT,
  "order" INTEGER NOT NULL,
  CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reassessment" (
  "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
  "studentId" TEXT NOT NULL,
  "learningGapId" TEXT NOT NULL,
  "beforeScore" DOUBLE PRECISION,
  "afterScore" DOUBLE PRECISION,
  "improvement" DOUBLE PRECISION,
  "status" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Reassessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_StudentClasses" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_StudentClasses_AB_unique" ON "_StudentClasses"("A", "B");
CREATE INDEX "_StudentClasses_B_index" ON "_StudentClasses"("B");

CREATE TABLE "_TeacherClasses" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_TeacherClasses_AB_unique" ON "_TeacherClasses"("A", "B");
CREATE INDEX "_TeacherClasses_B_index" ON "_TeacherClasses"("B");

CREATE TABLE "_ClassAssessments" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_ClassAssessments_AB_unique" ON "_ClassAssessments"("A", "B");
CREATE INDEX "_ClassAssessments_B_index" ON "_ClassAssessments"("B");


ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConceptDependency" ADD CONSTRAINT "ConceptDependency_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConceptDependency" ADD CONSTRAINT "ConceptDependency_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningGap" ADD CONSTRAINT "LearningGap_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningGap" ADD CONSTRAINT "LearningGap_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GapEvidence" ADD CONSTRAINT "GapEvidence_learningGapId_fkey" FOREIGN KEY ("learningGapId") REFERENCES "LearningGap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GapEvidence" ADD CONSTRAINT "GapEvidence_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_learningGapId_fkey" FOREIGN KEY ("learningGapId") REFERENCES "LearningGap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LearningPathStep" ADD CONSTRAINT "LearningPathStep_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reassessment" ADD CONSTRAINT "Reassessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reassessment" ADD CONSTRAINT "Reassessment_learningGapId_fkey" FOREIGN KEY ("learningGapId") REFERENCES "LearningGap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "_StudentClasses" ADD CONSTRAINT "_StudentClasses_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_StudentClasses" ADD CONSTRAINT "_StudentClasses_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TeacherClasses" ADD CONSTRAINT "_TeacherClasses_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TeacherClasses" ADD CONSTRAINT "_TeacherClasses_B_fkey" FOREIGN KEY ("B") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ClassAssessments" ADD CONSTRAINT "_ClassAssessments_A_fkey" FOREIGN KEY ("A") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ClassAssessments" ADD CONSTRAINT "_ClassAssessments_B_fkey" FOREIGN KEY ("B") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
