import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();
const controller = new StudentController();

router.use(authenticate);
router.use(requireRole(['STUDENT']));

router.get('/dashboard', controller.getDashboard);
router.get('/learning-gaps/:gapId', controller.getLearningGap);

export default router;
