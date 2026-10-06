import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import authRoutes from './routes/auth.routes';
import assessmentRoutes from './routes/assessment.routes';
import studentRoutes from './routes/student.routes';
import teacherRoutes from './routes/teacher.routes';
import adminRoutes from './routes/admin.routes';
import practiceRoutes from './routes/practice.routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'du-01-engine' });
});

app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/practice', practiceRoutes);

// Error handling
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);
// In Render, we need the app to listen even if NODE_ENV is production.
// We only skip listening if we are explicitly running inside Netlify functions.
if (!process.env.NETLIFY) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
