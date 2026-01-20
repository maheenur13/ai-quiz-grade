import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion {
  id: string;
  type: "single" | "multiple" | "written";
  question: string;
  options: string[] | null;
  correctAnswer: string | string[] | null;
}

export interface IQuiz extends Document {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: IQuestion[];
  status: "draft" | "published";
  shareLink?: string;
  createdAt: number;
  updatedAt: number;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  type: { type: String, enum: ["single", "multiple", "written"], required: true },
  question: { type: String, required: true },
  options: { type: [String], default: null },
  correctAnswer: { type: Schema.Types.Mixed, default: null },
});

const QuizSchema = new Schema<IQuiz>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  questions: [QuestionSchema],
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  shareLink: { type: String, index: true },
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
});

export default mongoose.model<IQuiz>("Quiz", QuizSchema);
