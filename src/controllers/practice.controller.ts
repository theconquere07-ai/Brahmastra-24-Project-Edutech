import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { PracticeService } from '../services/practice.service';

export class PracticeController {
  
  generatePractice = async (req: Request, res: Response) => {
    const { conceptId } = req.body;
    const userId = (req as any).user.id;
    
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    try {
      const result = await PracticeService.generateTargetedPractice(profile.id, conceptId, 3);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  submitPractice = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { answers } = req.body; // Array of { questionId, answer }
    
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const questions = await prisma.practiceQuestion.findMany({ where: { sessionId } });
    const questionMap = new Map(questions.map(q => [q.id, q]));

    let correctCount = 0;
    const results = [];

    for (const a of answers) {
      const q = questionMap.get(a.questionId);
      if (!q) continue;

      const isCorrect = q.correctAnswer.trim().toLowerCase() === a.answer.trim().toLowerCase();
      if (isCorrect) correctCount++;

      results.push({
        questionId: q.id,
        isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation // return explanation immediately for practice!
      });
    }

    const score = (correctCount / questions.length) * 100;

    await prisma.practiceSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', score, completedAt: new Date() }
    });

    // Simple reassessment improvement logic (mocked for demo speed)
    // In full app, we'd queue a Reassessment if score > threshold

    res.json({ score, results });
  };
}
