export type QuestionType = "single" | "multiple" | "written";

export type QuizStatus = "draft" | "published";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string | string[] | null;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: Question[];
  status: QuizStatus;
  shareLink?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudentAnswer {
  questionId: string;
  answer: string | string[];
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  feedback: string;
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  results: QuestionResult[];
}

export interface Submission {
  quizId: string;
  studentName: string;
  answers: StudentAnswer[];
  submittedAt: number;
  evaluation?: EvaluationResult;
}
