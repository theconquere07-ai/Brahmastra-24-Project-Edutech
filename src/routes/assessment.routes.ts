import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();
const controller = new AssessmentController();

router.use(authenticate);

// Teacher/Admin routes
router.post('/', requireRole(['TEACHER', 'ADMIN']), controller.createAssessment);
router.put('/:id', requireRole(['TEACHER', 'ADMIN']), controller.updateAssessment);
router.post('/:id/questions', requireRole(['TEACHER', 'ADMIN']), controller.addQuestion);
router.post('/:id/assign', requireRole(['TEACHER', 'ADMIN']), controller.assignAssessment);

// General/Student routes
router.get('/', controller.listAssessments);
router.get('/:id', controller.getAssessment);
router.post('/:id/attempt', requireRole(['STUDENT']), controller.startAttempt);
router.post('/:id/attempt/:attemptId/submit', requireRole(['STUDENT']), controller.submitAttempt);

export default router;
