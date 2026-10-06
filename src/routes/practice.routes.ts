import { Router } from 'express';
import { PracticeController } from '../controllers/practice.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();
const controller = new PracticeController();

router.use(authenticate);
router.use(requireRole(['STUDENT']));

router.post('/generate', controller.generatePractice);
router.post('/:sessionId/submit', controller.submitPractice);

export default router;
