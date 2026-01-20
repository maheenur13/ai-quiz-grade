import type { Quiz, Submission } from "../types/quiz";
import { apiService } from "./apiService";

// Quiz operations
export async function saveQuiz(quiz: Quiz): Promise<Quiz> {
  try {
    const savedQuiz = await apiService.saveQuiz(quiz);
    return savedQuiz;
  } catch (error) {
    console.error("Error saving quiz:", error);
    throw error;
  }
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  try {
    const quiz = await apiService.getQuiz(id);
    return quiz;
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return null;
  }
}

export async function getAllQuizzes(): Promise<Quiz[]> {
  try {
    const quizzes = await apiService.getAllQuizzes();
    return quizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return [];
  }
}

export async function deleteQuiz(id: string): Promise<void> {
  try {
    await apiService.deleteQuiz(id);
  } catch (error) {
    console.error("Error deleting quiz:", error);
    throw error;
  }
}

export async function getQuizByLink(link: string): Promise<Quiz | null> {
  try {
    const quiz = await apiService.getQuizByLink(link);
    return quiz;
  } catch (error) {
    console.error("Error fetching quiz by link:", error);
    return null;
  }
}

// Submission operations
export async function saveSubmission(quizId: string, submission: Submission): Promise<Submission> {
  try {
    const savedSubmission = await apiService.saveSubmission(submission);
    return savedSubmission;
  } catch (error) {
    console.error("Error saving submission:", error);
    throw error;
  }
}

export async function getAllSubmissions(): Promise<Submission[]> {
  try {
    const submissions = await apiService.getAllSubmissions();
    return submissions;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
}

export async function getSubmissionsByQuizId(quizId: string): Promise<Submission[]> {
  try {
    const submissions = await apiService.getSubmissionsByQuizId(quizId);
    return submissions;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
}
