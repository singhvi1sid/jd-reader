import mongoose, { Schema, Document } from "mongoose";

export type QuestionType = "MCQ" | "SHORT_ANSWER" | "SCENARIO" | "MINI_TASK";
export type Difficulty = "easy" | "medium" | "hard";
export type Seniority = "junior" | "mid" | "senior" | "lead";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type AssessmentStatus = "draft" | "reviewing" | "finalized";

export interface IQuestion {
  type: QuestionType;
  content: string;
  options?: string[];
  expectedAnswer?: string;
  difficulty: Difficulty;
  skillTested: string;
  order: number;
  reviewStatus: ReviewStatus;
}

export interface IScoringThresholds {
  strongHire: number;
  hire: number;
  maybe: number;
  reject: number;
}

export interface IAssessment extends Document {
  jobTitle: string;
  companyName: string;
  seniority: Seniority;
  domain: string;
  skills: string[];
  niceToHaveSkills: string[];
  keyResponsibilities: string[];
  rawJobDescription: string;
  questions: IQuestion[];
  status: AssessmentStatus;
  accessCode?: string;
  timeLimit: number;
  recruiterId?: string;
  scoringThresholds: IScoringThresholds;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  type: { type: String, enum: ["MCQ", "SHORT_ANSWER", "SCENARIO", "MINI_TASK"], required: true },
  content: { type: String, required: true },
  options: { type: [String], default: undefined },
  expectedAnswer: { type: String },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  skillTested: { type: String, required: true },
  order: { type: Number, required: true },
  reviewStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
});

const AssessmentSchema = new Schema<IAssessment>(
  {
    jobTitle: { type: String, required: true },
    companyName: { type: String, default: "" },
    seniority: { type: String, enum: ["junior", "mid", "senior", "lead"], required: true },
    domain: { type: String, required: true },
    skills: { type: [String], required: true },
    niceToHaveSkills: { type: [String], default: [] },
    keyResponsibilities: { type: [String], default: [] },
    rawJobDescription: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true },
    status: { type: String, enum: ["draft", "reviewing", "finalized"], default: "reviewing" },
    accessCode: { type: String, unique: true, sparse: true },
    timeLimit: { type: Number, default: 45 },
    recruiterId: { type: String, index: true },
    scoringThresholds: {
      type: {
        strongHire: { type: Number, default: 80 },
        hire: { type: Number, default: 60 },
        maybe: { type: Number, default: 40 },
        reject: { type: Number, default: 20 },
      },
      default: { strongHire: 80, hire: 60, maybe: 40, reject: 20 },
    },
  },
  { timestamps: true }
);

export const Assessment =
  mongoose.models.Assessment || mongoose.model<IAssessment>("Assessment", AssessmentSchema);
