import { prisma } from '../utils/prisma';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({});

export class PracticeService {
  
  static async generateTargetedPractice(studentId: string, conceptId: string, count: number = 3) {
    // 1. Fetch the learning gap to understand the specific weakness
    const gap = await prisma.learningGap.findFirst({
      where: { studentId, conceptId, status: 'ACTIVE' },
      include: { concept: true }
    });

    if (!gap) throw new Error("No active learning gap found for this concept.");

    const prompt = `
You are an expert tutor AI.
A student has a learning gap in the concept "${gap.concept.name}".
Their specific diagnosis is: "${gap.diagnosis}"
The common error pattern they exhibit is: "${gap.errorPatterns}"

Please generate ${count} practice questions specifically targeted to help the student overcome this exact weakness. Do NOT just generate generic questions about the concept. Address the misconception.

Ensure adaptive difficulty: start easier (BEGINNER) and progress to INTERMEDIATE.
`;
    
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'For MCQ only. Leave empty for short answer.' },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING, description: 'Educational explanation for why the answer is correct.' },
              difficulty: { type: Type.STRING, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] }
            },
            required: ['text', 'correctAnswer', 'explanation', 'difficulty']
          }
        }
      },
      required: ['questions']
    };

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.4
      }
    });

    if (!result.text) throw new Error("AI failed to generate practice.");
    
    const data = JSON.parse(result.text);

    // Create session in DB
    const session = await prisma.practiceSession.create({
      data: {
        studentId,
        conceptId,
        status: 'IN_PROGRESS'
      }
    });

    // Save questions
    const savedQuestions = [];
    let order = 0;
    for (const q of data.questions) {
      const saved = await prisma.practiceQuestion.create({
        data: {
          sessionId: session.id,
          text: q.text,
          options: q.options ? JSON.stringify(q.options) : null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          order: order++
        }
      });
      savedQuestions.push(saved);
    }

    return { session, questions: savedQuestions };
  }
}
