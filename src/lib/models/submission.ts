import mongoose, { Schema, Document, Types } from "mongoose";

export type SubmissionStatus = "in_progress" | "submitted" | "scored";
export type AIRecommendation = "strongly_advance" | "advance" | "maybe" | "reject";

export interface IAnswer {
  questionOrder: number;
  answer: string;
}

export interface IScore {
  questionOrder: number;
  score: number;
  reasoning: string;
  strengths: string;
  weaknesses: string;
}

export interface IRecruiterOverride {
  decision: "advance" | "reject" | null;
  feedback: string;
}

export interface ISubmission extends Document {
  assessmentId: Types.ObjectId;
  candidateName: string;
  candidateEmail: string;
  answers: IAnswer[];
  startedAt: Date;
  submittedAt?: Date;
  status: SubmissionStatus;
  scores: IScore[];
  totalScore?: number;
  aiRecommendation?: AIRecommendation | null;
  aiSummary?: string;
  recruiterOverride?: IRecruiterOverride;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionOrder: { type: Number, required: true },
  answer: { type: String, default: "" },
});

const ScoreSchema = new Schema<IScore>({
  questionOrder: { type: Number, required: true },
  score: { type: Number, required: true },
  reasoning: { type: String, required: true },
  strengths: { type: String, default: "" },
  weaknesses: { type: String, default: "" },
});

const RecruiterOverrideSchema = new Schema<IRecruiterOverride>({
  decision: { type: String, enum: ["advance", "reject", null], default: null },
  feedback: { type: String, default: "" },
});

const SubmissionSchema = new Schema<ISubmission>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    answers: { type: [AnswerSchema], default: [] },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: { type: String, enum: ["in_progress", "submitted", "scored"], default: "in_progress" },
    scores: { type: [ScoreSchema], default: [] },
    totalScore: { type: Number },
    aiRecommendation: { type: String, enum: ["strongly_advance", "advance", "maybe", "reject", null], default: null },
    aiSummary: { type: String },
    recruiterOverride: { type: RecruiterOverrideSchema },
  },
  { timestamps: true }
);

export const Submission =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);
