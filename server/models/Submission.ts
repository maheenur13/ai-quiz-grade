import mongoose, { Schema, Document } from "mongoose";

export interface IStudentAnswer {
  questionId: string;
  answer: string | string[];
}

export interface IQuestionResult {
  questionId: string;
  isCorrect: boolean;
  feedback: string;
}

export interface IEvaluationResult {
  score: number;
  maxScore: number;
  results: IQuestionResult[];
}

export interface ISubmission extends Document {
  quizId: string;
  studentName: string;
  answers: IStudentAnswer[];
  submittedAt: number;
  evaluation?: IEvaluationResult;
}

const StudentAnswerSchema = new Schema<IStudentAnswer>({
  questionId: { type: String, required: true },
  answer: { type: Schema.Types.Mixed, required: true },
});

const QuestionResultSchema = new Schema<IQuestionResult>({
  questionId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  feedback: { type: String, required: false, default: "" },
});

const EvaluationResultSchema = new Schema<IEvaluationResult>({
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  results: [QuestionResultSchema],
});

const SubmissionSchema = new Schema<ISubmission>({
  quizId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  answers: [StudentAnswerSchema],
  submittedAt: { type: Number, default: Date.now },
  evaluation: EvaluationResultSchema,
});

export default mongoose.model<ISubmission>("Submission", SubmissionSchema);
