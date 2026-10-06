import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth';
import { prisma } from '../utils/prisma';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/stats', async (req, res) => {
  const users = await prisma.user.count();
  const assessments = await prisma.assessment.count();
  const activeGaps = await prisma.learningGap.count({ where: { status: 'ACTIVE' } });
  
  res.json({ users, assessments, activeGaps });
});

export default router;
