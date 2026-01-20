const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

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

export const apiService = {
  // Quiz endpoints
  async getAllQuizzes() {
    return fetchAPI("/quizzes");
  },

  async getQuiz(id: string) {
    return fetchAPI(`/quizzes/${id}`);
  },

  async getQuizByLink(link: string) {
    return fetchAPI(`/quizzes/link/${link}`);
  },

  async saveQuiz(quiz: unknown) {
    return fetchAPI("/quizzes", {
      method: "POST",
      body: JSON.stringify(quiz),
    });
  },

  async deleteQuiz(id: string) {
    return fetchAPI(`/quizzes/${id}`, {
      method: "DELETE",
    });
  },

  // Submission endpoints
  async getAllSubmissions() {
    return fetchAPI("/submissions");
  },

  async getSubmissionsByQuizId(quizId: string) {
    return fetchAPI(`/submissions/quiz/${quizId}`);
  },

  async saveSubmission(submission: unknown) {
    return fetchAPI("/submissions", {
      method: "POST",
      body: JSON.stringify(submission),
    });
  },
};
