import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export class AuthController {
  
  register = async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: data.role
        }
      });
      
      if (data.role === 'STUDENT') {
        await tx.studentProfile.create({ data: { userId: u.id } });
      } else if (data.role === 'TEACHER') {
        await tx.teacherProfile.create({ data: { userId: u.id } });
      } else if (data.role === 'ADMIN') {
        await tx.adminProfile.create({ data: { userId: u.id } });
      }
      
      return u;
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  };

  login = async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    
    let user = await prisma.user.findUnique({ where: { email: data.email } });
    
    // HACKATHON AUTO-BOOTSTRAP / AUTO-REGISTER
    if (!user) {
      let roleToAssign = 'STUDENT';
      if (data.email.toLowerCase().includes('teacher') || data.email.toLowerCase().includes('smith')) roleToAssign = 'TEACHER';
      if (data.email.toLowerCase().includes('admin')) roleToAssign = 'ADMIN';

      const hashedPassword = await bcrypt.hash(data.password, 10);
      user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            name: data.email.split('@')[0],
            role: roleToAssign
          }
        });
        
        if (roleToAssign === 'STUDENT') {
          await tx.studentProfile.create({ data: { userId: u.id } });
        } else if (roleToAssign === 'TEACHER') {
          await tx.teacherProfile.create({ data: { userId: u.id } });
        } else if (roleToAssign === 'ADMIN') {
          await tx.adminProfile.create({ data: { userId: u.id } });
        }
        return u;
      });
    } else {
      // Universal bypass for demo purposes, or verify actual hash
      if (data.password !== 'password123') {
        const valid = await bcrypt.compare(data.password, user.password);
        if (!valid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  };

  getMe = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  };
}
