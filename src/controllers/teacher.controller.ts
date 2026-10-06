import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class TeacherController {
  
  getDashboard = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const profile = await prisma.teacherProfile.findUnique({
      where: { userId },
      include: {
        classes: {
          include: {
            students: {
              include: { user: true, learningGaps: { where: { status: 'ACTIVE' }, include: { concept: true } } }
            },
            assignedAssessments: true
          }
        }
      }
    });

    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ dashboard: profile });
  };

  getClassAnalytics = async (req: Request, res: Response) => {
    const { classId } = req.params;
    
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            learningGaps: {
              where: { status: 'ACTIVE' },
              include: { concept: true }
            }
          }
        }
      }
    });

    if (!classData) return res.status(404).json({ error: 'Class not found' });

    // Aggregate learning gaps
    const gapCounts = new Map<string, { conceptName: string, count: number, critical: number }>();
    
    for (const s of classData.students) {
      for (const g of s.learningGaps) {
        if (!gapCounts.has(g.conceptId)) {
          gapCounts.set(g.conceptId, { conceptName: g.concept.name, count: 0, critical: 0 });
        }
        const stat = gapCounts.get(g.conceptId)!;
        stat.count++;
        if (g.severity === 'CRITICAL') stat.critical++;
      }
    }

    res.json({ class: classData.name, learningGapAggregations: Array.from(gapCounts.values()) });
  };
}
