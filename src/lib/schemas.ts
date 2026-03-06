import { z } from "zod/v4";

export const jdAnalysisSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string().optional().default(""),
  seniority: z.enum(["junior", "mid", "senior", "lead"]),
  domain: z.string(),
  skills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  keyResponsibilities: z.array(z.string()),
});

export const questionSchema = z.object({
  type: z.enum(["MCQ", "SHORT_ANSWER", "SCENARIO", "MINI_TASK"]),
  content: z.string(),
  options: z.array(z.string()).optional(),
  expectedAnswer: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  skillTested: z.string(),
  order: z.number(),
});

export const assessmentResponseSchema = z.object({
  questions: z.array(questionSchema),
});

export const scoreItemSchema = z.object({
  questionOrder: z.number(),
  score: z.number(),
  reasoning: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
});

export const scoringResponseSchema = z.object({
  scores: z.array(scoreItemSchema),
  overallSummary: z.string(),
  recommendation: z.enum(["strongly_advance", "advance", "maybe", "reject"]),
});

export const regeneratedQuestionSchema = z.object({
  type: z.enum(["MCQ", "SHORT_ANSWER", "SCENARIO", "MINI_TASK"]),
  content: z.string(),
  options: z.array(z.string()).optional(),
  expectedAnswer: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  skillTested: z.string(),
});

export const similarityResponseSchema = z.object({
  reusableQuestions: z.array(z.object({
    originalOrder: z.number(),
    action: z.enum(["reuse_as_is", "modify"]),
    modificationNote: z.string(),
  })),
  similarityScore: z.number(),
});

export type JDAnalysis = z.infer<typeof jdAnalysisSchema>;
export type Question = z.infer<typeof questionSchema>;
export type AssessmentResponse = z.infer<typeof assessmentResponseSchema>;
export type ScoringResponse = z.infer<typeof scoringResponseSchema>;
export type SimilarityResponse = z.infer<typeof similarityResponseSchema>;
