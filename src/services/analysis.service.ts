import { prisma } from '../utils/prisma';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Gemini SDK
// Assumes GEMINI_API_KEY is available in the environment
const ai = new GoogleGenAI({}); 

export class AnalysisService {
  
  static async analyzeAttempt(attemptId: string) {
    console.log(`Starting analysis for attempt: ${attemptId}`);
    
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        student: { include: { user: true } },
        assessment: true,
        responses: {
          include: {
            question: {
              include: { concept: true }
            }
          }
        }
      }
    });

    if (!attempt) return;

    // Group responses by concept
    const conceptMap = new Map<string, any[]>();
    for (const r of attempt.responses) {
      const cid = r.question.conceptId;
      if (!conceptMap.has(cid)) conceptMap.set(cid, []);
      conceptMap.get(cid)!.push(r);
    }

    // Process each concept group
    for (const [conceptId, responses] of conceptMap.entries()) {
      const total = responses.length;
      const incorrect = responses.filter(r => !r.isCorrect).length;
      const correct = total - incorrect;
      const score = (correct / total) * 100;
      const conceptName = responses[0].question.concept.name;

      console.log(`Analyzing Concept: ${conceptName}, Score: ${score}% (${correct}/${total})`);

      if (incorrect === 0) {
        // Mark responses as completed analysis
        await prisma.response.updateMany({
          where: { id: { in: responses.map(r => r.id) } },
          data: { analysisStatus: 'COMPLETED' }
        });
        
        // If there was an active gap, maybe resolve it or improve it (omitted for brevity here, normally handled by progress engine)
        continue;
      }

      // We have errors. We need to evaluate them using the hybrid engine.
      // Gather deterministic evidence.
      const evidencePayload = responses.map(r => ({
        responseId: r.id,
        questionText: r.question.text,
        type: r.question.type,
        correctAnswer: r.question.correctAnswer,
        submittedAnswer: r.submittedAnswer,
        isCorrect: r.isCorrect,
        difficulty: r.question.difficulty
      }));

      // Call AI for deeper insight
      let aiResult;
      try {
        const prompt = `
You are an expert AI Learning Gap Detector.
Analyze the following student responses for the concept "${conceptName}".
Determine if there is a genuine conceptual learning gap, or just careless mistakes.

Rules for Severity:
- LOW: Careless mistakes or isolated calculation errors.
- MEDIUM: Some misunderstanding, but partial correct answers exist.
- HIGH: Consistent conceptual errors or formula misapplication.
- CRITICAL: Complete lack of understanding or severe fundamental misconception.

Rules for Confidence:
- Float between 0.0 and 1.0. 
- E.g., if only 1 question is wrong out of 1 total, confidence should be lower (e.g., 0.5) because evidence is isolated.
- If 3/3 are wrong with the same error, confidence should be high (e.g., 0.95).

Evidence:
${JSON.stringify(evidencePayload, null, 2)}

Provide a structured analysis.
`;
        const responseSchema: Schema = {
          type: Type.OBJECT,
          properties: {
            hasGap: { type: Type.BOOLEAN, description: 'True if a genuine learning gap exists.' },
            severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            confidence: { type: Type.NUMBER, description: 'Between 0.0 and 1.0' },
            diagnosis: { type: Type.STRING, description: 'A detailed explanation of the misconception and why this gap exists.' },
            errorPattern: { type: Type.STRING, description: 'The specific type of error observed (e.g., Sign error, Formula misuse).' },
            evidenceResponseIds: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'The response IDs that strongly support this diagnosis.'
            }
          },
          required: ['hasGap', 'severity', 'confidence', 'diagnosis', 'errorPattern', 'evidenceResponseIds']
        };

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.2
          }
        });

        const text = result.text;
        if (text) {
          aiResult = JSON.parse(text);
        }

      } catch (err) {
        console.error('AI Analysis failed, falling back to deterministic', err);
        // Fallback deterministic logic
        aiResult = {
          hasGap: incorrect > 0,
          severity: incorrect / total > 0.5 ? 'HIGH' : 'MEDIUM',
          confidence: total > 2 ? 0.8 : 0.4,
          diagnosis: 'Deterministic fallback: Incorrect responses detected.',
          errorPattern: 'General Error',
          evidenceResponseIds: responses.filter(r => !r.isCorrect).map(r => r.id)
        };
      }

      if (aiResult?.hasGap) {
        // Upsert Learning Gap
        const existingGap = await prisma.learningGap.findFirst({
          where: { studentId: attempt.studentId, conceptId, status: 'ACTIVE' }
        });

        let gap;
        if (existingGap) {
          gap = await prisma.learningGap.update({
            where: { id: existingGap.id },
            data: {
              severity: aiResult.severity,
              confidence: aiResult.confidence,
              diagnosis: aiResult.diagnosis,
              errorPatterns: aiResult.errorPattern
            }
          });
          // Delete old evidence to replace
          await prisma.gapEvidence.deleteMany({ where: { learningGapId: gap.id } });
        } else {
          gap = await prisma.learningGap.create({
            data: {
              studentId: attempt.studentId,
              conceptId,
              severity: aiResult.severity,
              confidence: aiResult.confidence,
              status: 'ACTIVE',
              diagnosis: aiResult.diagnosis,
              errorPatterns: aiResult.errorPattern
            }
          });
        }

        // Create Evidence links
        const evidencePromises = aiResult.evidenceResponseIds.map((rId: string) => 
          prisma.gapEvidence.create({
            data: {
              learningGapId: gap.id,
              responseId: rId,
              reason: 'Identified by AI as supporting evidence.'
            }
          })
        );
        await Promise.all(evidencePromises);
      }

      // Mark responses as analyzed
      await prisma.response.updateMany({
        where: { id: { in: responses.map(r => r.id) } },
        data: { 
          analysisStatus: 'COMPLETED',
          errorClassification: aiResult?.errorPattern 
        }
      });
    }

    console.log(`Completed analysis for attempt: ${attemptId}`);
  }
}
