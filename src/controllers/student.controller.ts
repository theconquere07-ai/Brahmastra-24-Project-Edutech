// @ts-nocheck 
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class StudentController {
  
  getDashboard = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        classes: true,
        attempts: {
          include: { assessment: true },
          orderBy: { startedAt: 'desc' },
          take: 5
        },
        learningGaps: {
          where: { status: 'ACTIVE' },
          include: { concept: true }
        }
      }
    });

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json({ dashboard: profile });
  };

  getLearningGap = async (req: Request, res: Response) => {
    const { gapId } = req.params;
    
    const gap = await prisma.learningGap.findUnique({
      where: { id: gapId },
      include: {
        concept: true,
        evidences: {
          include: {
            response: {
              include: { question: true }
            }
          }
        }
      }
    });

    if (!gap) return res.status(404).json({ error: 'Gap not found' });
    res.json({ learningGap: gap });
  };
}
