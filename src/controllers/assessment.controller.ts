// @ts-nocheck 
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { AnalysisService } from '../services/analysis.service';

const createAssessmentSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
});

const addQuestionSchema = z.object({
  text: z.string(),
  type: z.enum(['MCQ', 'SHORT_ANSWER']),
  options: z.string().optional(), // JSON string array
  correctAnswer: z.string(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  explanation: z.string().optional(),
  conceptId: z.string()
});

const submitAttemptSchema = z.object({
  responses: z.array(z.object({
    questionId: z.string(),
    submittedAnswer: z.string()
  }))
});

export class AssessmentController {
  
  createAssessment = async (req: Request, res: Response) => {
    const data = createAssessmentSchema.parse(req.body);
    const userId = (req as any).user.id;

    const assessment = await prisma.assessment.create({
      data: {
        ...data,
        status: 'DRAFT',
        creatorId: userId
      }
    });
    res.status(201).json({ assessment });
  };

  updateAssessment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body; // In real app, validate with Zod
    const assessment = await prisma.assessment.update({
      where: { id },
      data
    });
    res.json({ assessment });
  };

  addQuestion = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = addQuestionSchema.parse(req.body);
    
    // Create question and link it
    const question = await prisma.question.create({
      data: {
        text: data.text,
        type: data.type,
        options: data.options,
        correctAnswer: data.correctAnswer,
        topic: data.topic,
        difficulty: data.difficulty,
        explanation: data.explanation,
        conceptId: data.conceptId
      }
    });

    const aq = await prisma.assessmentQuestion.create({
      data: {
        assessmentId: id,
        questionId: question.id,
        order: await prisma.assessmentQuestion.count({ where: { assessmentId: id } })
      }
    });

    res.status(201).json({ question, assessmentQuestion: aq });
  };

  assignAssessment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { classId } = req.body;
    
    await prisma.class.update({
      where: { id: classId },
      data: {
        assignedAssessments: { connect: { id } }
      }
    });
    
    // Set to published if it was draft
    await prisma.assessment.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    res.json({ message: 'Assigned successfully' });
  };

  listAssessments = async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    if (user.role === 'STUDENT') {
      // Find classes student is in
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
        include: { classes: { include: { assignedAssessments: true } } }
      });
      
      const assessments = profile?.classes.flatMap(c => c.assignedAssessments) || [];
      return res.json({ assessments });
    } else {
      // Teacher or Admin sees all they have access to. Simplified to all for demo.
      const assessments = await prisma.assessment.findMany();
      res.json({ assessments });
    }
  };

  getAssessment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: true
          }
        }
      }
    });
    
    if (!assessment) return res.status(404).json({ error: 'Not found' });
    
    // Don't send correct answers to students unless completed
    const user = (req as any).user;
    if (user.role === 'STUDENT') {
      assessment.questions = assessment.questions.map(aq => {
        const q = aq.question;
        return {
          ...aq,
          question: {
            id: q.id, text: q.text, type: q.type, options: q.options, topic: q.topic, difficulty: q.difficulty, conceptId: q.conceptId
          } as any
        };
      });
    }
    
    res.json({ assessment });
  };

  startAttempt = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    
    if (!profile) return res.status(400).json({ error: 'Student profile not found' });

    const attempt = await prisma.attempt.create({
      data: {
        studentId: profile.id,
        assessmentId: id,
        status: 'IN_PROGRESS'
      }
    });
    
    res.status(201).json({ attempt });
  };

  submitAttempt = async (req: Request, res: Response) => {
    const { id, attemptId } = req.params;
    const data = submitAttemptSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { student: true, assessment: { include: { questions: { include: { question: true } } } } }
    });

    if (!attempt || attempt.student.userId !== userId) {
      return res.status(404).json({ error: 'Attempt not found or unauthorized' });
    }
    
    if (attempt.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Attempt already completed' });
    }

    // Save responses deterministically and grade them
    let correctCount = 0;
    const totalQuestions = attempt.assessment.questions.length;
    const responseRecords = [];
    
    const questionMap = new Map(attempt.assessment.questions.map(aq => [aq.questionId, aq.question]));

    for (const r of data.responses) {
      const q = questionMap.get(r.questionId);
      if (!q) continue;

      let isCorrect = false;
      let isPartiallyCorrect = false;
      
      // Basic deterministic grading (can be enhanced with fuzzy matching for short answers)
      if (q.type === 'MCQ') {
        isCorrect = (r.submittedAnswer === q.correctAnswer);
      } else {
        isCorrect = (r.submittedAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim());
        // Simple partial logic could go here, deferred to AI
      }

      if (isCorrect) correctCount++;

      const savedResponse = await prisma.response.create({
        data: {
          attemptId: attempt.id,
          questionId: r.questionId,
          submittedAnswer: r.submittedAnswer,
          isCorrect,
          isPartiallyCorrect,
          analysisStatus: 'PENDING'
        }
      });
      responseRecords.push(savedResponse);
    }

    const score = (correctCount / totalQuestions) * 100;

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score
      }
    });

    // TRIGGER AI ANALYSIS ENGINE (Asynchronously)
    // We don't await this so the user gets an immediate response.
    AnalysisService.analyzeAttempt(attempt.id).catch(err => {
      console.error('Analysis failed for attempt', attempt.id, err);
    });

    res.json({ message: 'Submitted successfully', score });
  };
}
