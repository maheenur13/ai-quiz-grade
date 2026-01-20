import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Radio, Checkbox, Input, Button, Space, Typography, message, Divider, Spin } from "antd";
import { getQuizByLink, saveSubmission } from "../../services/storageService";
import { evaluateAnswers } from "../../services/aiService";
import { Timer } from "../shared/Timer";
import type { Quiz, StudentAnswer, Submission } from "../../types/quiz";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Helper to get question ID (handles both id and _id from MongoDB)
function getQuestionId(question: { id?: string; _id?: string }): string {
  return question.id || question._id || String(Math.random());
}

// Helper to get quiz ID (handles both id and _id from MongoDB)
function getQuizId(quiz: { id?: string; _id?: string }): string {
  return quiz.id || quiz._id || String(Math.random());
}

export default function QuizView() {
  const navigate = useNavigate();
  const { link } = useParams<{ link: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!link) {
      message.error("Invalid quiz link");
      navigate("/");
      return;
    }

    const name = sessionStorage.getItem(`quiz_${link}_name`);
    if (!name) {
      message.warning("Please enter your name first");
      navigate(`/quiz/${link}`);
      return;
    }

    getQuizByLink(link)
      .then((loadedQuiz) => {
        if (!loadedQuiz) {
          message.error("Quiz not found or not published");
          navigate("/");
          return;
        }

        // Validate quiz structure
        if (!loadedQuiz.questions || !Array.isArray(loadedQuiz.questions) || loadedQuiz.questions.length === 0) {
          message.error("Invalid quiz data: questions are missing");
          navigate("/");
          return;
        }

        setQuiz(loadedQuiz);
        setStudentName(name);

        // Initialize answers
        const initialAnswers: Record<string, string | string[]> = {};
        loadedQuiz.questions.forEach((q) => {
          const questionId = getQuestionId(q);
          if (q.type === "multiple") {
            initialAnswers[questionId] = [];
          }
          // For single and written, don't initialize - leave undefined
          // This ensures Radio.Group works correctly with undefined values
        });
        setAnswers(initialAnswers);
      })
      .catch((error) => {
        console.error("Error loading quiz:", error);
        message.error("Failed to load quiz");
        navigate("/");
      });
  }, [link, navigate]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: value,
      };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => {
      const questionId = getQuestionId(q);
      const answer = answers[questionId];
      if (q.type === "multiple") {
        return !Array.isArray(answer) || answer.length === 0;
      }
      return !answer || (typeof answer === "string" && answer.trim() === "");
    });

    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      // Convert answers to StudentAnswer format
      // For single/multiple choice, convert indices to option text for evaluation
      const studentAnswers: StudentAnswer[] = quiz.questions.map((q) => {
        const questionId = getQuestionId(q);
        const answer = answers[questionId] || (q.type === "multiple" ? [] : "");
        
        if (q.type === "single" && q.options && typeof answer === "string") {
          // Convert index to option text
          const optionIndex = parseInt(answer, 10);
          return {
            questionId: questionId,
            answer: q.options[optionIndex] || answer,
          };
        } else if (q.type === "multiple" && q.options && Array.isArray(answer)) {
          // Convert indices to option texts
          const optionTexts = answer.map((idx) => {
            const optionIndex = parseInt(String(idx), 10);
            return q.options?.[optionIndex] || String(idx);
          });
          return {
            questionId: questionId,
            answer: optionTexts,
          };
        }
        
        return {
          questionId: questionId,
          answer: answer,
        };
      });

      // Evaluate answers
      const evaluation = await evaluateAnswers(quiz, studentAnswers);

      // Save submission
      const quizId = getQuizId(quiz);
      const submission: Submission = {
        quizId: quizId,
        studentName,
        answers: studentAnswers,
        submittedAt: Date.now(),
        evaluation,
      };

      await saveSubmission(quizId, submission);

      // Store submission ID in sessionStorage for results page
      sessionStorage.setItem(`quiz_${link}_submission`, JSON.stringify(submission));

      setSubmitted(true);
      message.success("Quiz submitted successfully!");
      
      // Navigate to results after a short delay
      setTimeout(() => {
        navigate(`/results/${link}`);
      }, 1000);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to submit quiz. Please try again."
      );
      setSubmitting(false);
    }
  };

  const handleTimerExpire = () => {
    if (!submitted) {
      message.warning("Time's up! Submitting your quiz...");
      handleSubmit();
    }
  };

  if (!quiz) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading quiz...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Title level={2}>Quiz Submitted!</Title>
        <Text>Redirecting to results...</Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px" }}>
      <Card style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)" }}>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                {quiz.title}
              </Title>
              <Text type="secondary" style={{ fontSize: "15px" }}>Participant: {studentName}</Text>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text strong style={{ display: "block", marginBottom: 8, fontSize: "14px" }}>
                Time Remaining
              </Text>
              <Timer
                durationSeconds={quiz.durationMinutes * 60}
                onExpire={handleTimerExpire}
              />
            </div>
          </div>

          <Divider />

          {quiz.questions.map((question, index) => {
            const questionId = getQuestionId(question);
            return (
              <Card 
                key={`question-card-${questionId}`} 
                title={
                  <span style={{ fontWeight: 600, fontSize: "18px" }}>Question {index + 1}</span>
                } 
                style={{ marginBottom: 16 }}
              >
                <Text strong style={{ display: "block", marginBottom: 20, fontSize: 17, lineHeight: 1.6 }}>
                  {question.question}
                </Text>

                {question.type === "single" && question.options && (
                  <Radio.Group
                    key={`radio-group-${questionId}`}
                    name={`radio-group-${questionId}`}
                    value={answers[questionId] ? String(answers[questionId]) : undefined}
                    onChange={(e) => {
                      const selectedValue = String(e.target.value);
                      handleAnswerChange(questionId, selectedValue);
                    }}
                  >
                    <Space orientation="vertical">
                      {question.options.map((option, optIndex) => (
                        <Radio 
                          key={`radio-${questionId}-${optIndex}`} 
                          value={String(optIndex)}
                        >
                          {option}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                )}

                {question.type === "multiple" && question.options && (
                  <Checkbox.Group
                    value={Array.isArray(answers[questionId]) ? (answers[questionId] as string[]) : []}
                    onChange={(checkedValues) => {
                      handleAnswerChange(questionId, checkedValues.map(String));
                    }}
                    key={`checkbox-group-${questionId}`}
                  >
                    <Space orientation="vertical">
                      {question.options.map((option, optIndex) => (
                        <Checkbox key={`${questionId}-opt-${optIndex}`} value={optIndex.toString()}>
                          {option}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                )}

                {question.type === "written" && (
                  <TextArea
                    rows={4}
                    value={answers[questionId] ? String(answers[questionId]) : ""}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                    placeholder="Type your answer here..."
                  />
                )}
              </Card>
            );
          })}

          <Divider />

          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={submitting}
            block
            style={{ 
              height: "48px",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            Submit Quiz
          </Button>
        </Space>
      </Card>
    </div>
  );
}
