import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();
const controller = new TeacherController();

router.use(authenticate);
router.use(requireRole(['TEACHER', 'ADMIN']));

router.get('/dashboard', controller.getDashboard);
router.get('/classes/:classId/analytics', controller.getClassAnalytics);

export default router;
