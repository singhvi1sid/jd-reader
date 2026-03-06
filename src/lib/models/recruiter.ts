import mongoose, { Schema, Document } from "mongoose";

export interface IRecruiter extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  provider: "credentials" | "google";
  createdAt: Date;
  updatedAt: Date;
}

const RecruiterSchema = new Schema<IRecruiter>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    provider: { type: String, enum: ["credentials", "google"], required: true },
  },
  { timestamps: true }
);

export const Recruiter =
  mongoose.models.Recruiter || mongoose.model<IRecruiter>("Recruiter", RecruiterSchema);
