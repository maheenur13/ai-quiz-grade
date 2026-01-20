import Groq from "groq-sdk";
import type { Quiz, StudentAnswer, EvaluationResult } from "../types/quiz";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("VITE_GROQ_API_KEY is not set. AI features will not work.");
}

const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Required for frontend-only application
});

// Use free Groq models
const QUIZ_GENERATION_MODEL = "llama-3.1-8b-instant";
const EVALUATION_MODEL = "llama-3.1-8b-instant";

interface QuizGenerationResponse {
  title: string;
  description: string;
  durationMinutes: number;
  questions: Array<{
    id: string;
    type: "single" | "multiple" | "written";
    question: string;
    options: string[] | null;
    correctAnswer: string | string[] | null;
  }>;
}

interface EvaluationResponse {
  score: number;
  maxScore: number;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    feedback: string;
  }>;
}

function extractJSON(content: string): string {
  // Remove markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  
  // Try to find JSON object in the content
  const braceMatch = content.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return braceMatch[0];
  }
  
  return content;
}

export async function generateQuiz(prompt: string): Promise<QuizGenerationResponse> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured. Please set VITE_GROQ_API_KEY in your .env file.");
  }

  const systemMessage = "You are an AI quiz generator. Return ONLY valid JSON. Do not include markdown or explanations.";

  const userMessage = `Create a quiz from the following prompt:

"${prompt}"

Return JSON EXACTLY in this schema:
{
  "title": string,
  "description": string,
  "durationMinutes": number,
  "questions": [
    {
      "id": string,
      "type": "single" | "multiple" | "written",
      "question": string,
      "options": string[] | null,
      "correctAnswer": string | string[] | null
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      model: QUIZ_GENERATION_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const jsonContent = extractJSON(content);
    const quizData = JSON.parse(jsonContent) as QuizGenerationResponse;

    // Validate and ensure all questions have IDs
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error("Invalid quiz structure: questions array is missing");
    }

    quizData.questions = quizData.questions.map((q, index) => ({
      ...q,
      id: q.id || `q${index + 1}`,
    }));

    return quizData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
    throw new Error("Failed to generate quiz: Unknown error");
  }
}

export async function evaluateAnswers(
  quiz: Quiz,
  answers: StudentAnswer[]
): Promise<EvaluationResult> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured. Please set VITE_GROQ_API_KEY in your .env file.");
  }

  const systemMessage = "You are an AI exam evaluator. Evaluate answers objectively. Return ONLY valid JSON. For written questions, always include the correct/expected answer in the feedback.";

  // Build a map of questions with their correct answers for reference
  const questionsWithAnswers = quiz.questions.map((q) => ({
    id: q.id || (q as { id?: string; _id?: string })._id,
    type: q.type,
    question: q.question,
    correctAnswer: q.correctAnswer,
  }));

  const userMessage = `Quiz Questions with Correct Answers:
${JSON.stringify(questionsWithAnswers, null, 2)}

Student Answers:
${JSON.stringify(answers, null, 2)}

Instructions:
- For multiple choice questions: Compare student answer with correctAnswer. If incorrect, feedback should mention the correct option.
- For written questions: Evaluate if the student's answer demonstrates understanding. If incorrect or incomplete, feedback MUST include the correct/expected answer or key points. For example: "The correct answer should be: [provide the expected answer or key points]"
- Score: Count correct answers only.
- maxScore: Total number of questions.

Return JSON EXACTLY in this schema:
{
  "score": number,
  "maxScore": number,
  "results": [
    {
      "questionId": string,
      "isCorrect": boolean,
      "feedback": string
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      model: EVALUATION_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const jsonContent = extractJSON(content);
    const evaluation = JSON.parse(jsonContent) as EvaluationResponse;

    // Validate structure
    if (typeof evaluation.score !== "number" || typeof evaluation.maxScore !== "number") {
      throw new Error("Invalid evaluation structure: score or maxScore is missing");
    }

    if (!evaluation.results || !Array.isArray(evaluation.results)) {
      throw new Error("Invalid evaluation structure: results array is missing");
    }

    // Ensure all results have required fields with defaults
    evaluation.results = evaluation.results.map((result) => {
      const r = result as { questionId?: string; isCorrect?: boolean; feedback?: string; feedbackText?: string };
      return {
        questionId: String(r.questionId || ""),
        isCorrect: Boolean(r.isCorrect),
        feedback: String(r.feedback || r.feedbackText || ""),
      };
    });

    return evaluation;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to evaluate answers: ${error.message}`);
    }
    throw new Error("Failed to evaluate answers: Unknown error");
  }
}
