import type { Quiz, StudentAnswer, EvaluationResult } from "../types/quiz";

// Get API URL from environment variable
// In production on Netlify, use relative URLs (same domain)
// For local development, it defaults to localhost
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is explicitly set, use it
  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  
  // If we're on Netlify (production), use relative URLs
  // This allows the API to work on the same domain via Netlify Functions
  if (import.meta.env.PROD && typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
    return '/api';
  }
  
  // Default to localhost for development
  return "http://localhost:3001/api";
};

const API_BASE_URL = getApiBaseUrl();

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

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    const errorMessage = error.details || error.error || `HTTP error! status: ${response.status}`;
    console.error("API Error:", error);
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function generateQuiz(prompt: string): Promise<QuizGenerationResponse> {
  try {
    const quizData = await fetchAPI("/ai/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });

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
  try {
    const evaluation = await fetchAPI("/ai/evaluate", {
      method: "POST",
      body: JSON.stringify({ quiz, answers }),
    });

    return evaluation;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to evaluate answers: ${error.message}`);
    }
    throw new Error("Failed to evaluate answers: Unknown error");
  }
}
