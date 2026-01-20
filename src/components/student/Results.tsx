import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Typography, Space, Tag, Divider, Alert } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { getQuizByLink } from "../../services/storageService";
import type { Quiz, Submission, EvaluationResult } from "../../types/quiz";

const { Title, Text, Paragraph } = Typography;

// Helper to get question ID (handles both id and _id from MongoDB)
function getQuestionId(question: { id?: string; _id?: string }): string {
  return question.id || question._id || String(Math.random());
}

export default function Results() {
  const { link } = useParams<{ link: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    if (!link) return;

    getQuizByLink(link)
      .then((loadedQuiz) => {
        if (!loadedQuiz) {
          return;
        }

        setQuiz(loadedQuiz);

        // Get submission from sessionStorage
        const submissionData = sessionStorage.getItem(`quiz_${link}_submission`);
        if (submissionData) {
          try {
            const sub = JSON.parse(submissionData) as Submission;
            setSubmission(sub);
            if (sub.evaluation) {
              setEvaluation(sub.evaluation);
            }
          } catch (error) {
            console.error("Error parsing submission:", error);
          }
        }
      })
      .catch((error) => {
        console.error("Error loading quiz:", error);
      });
  }, [link]);

  if (!quiz || !submission || !evaluation) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Title level={2}>Results Not Available</Title>
        <Text>Unable to load quiz results.</Text>
      </div>
    );
  }

  const percentage = Math.round((evaluation.score / evaluation.maxScore) * 100);
  const isPassing = percentage >= 60;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px" }}>
      <Card style={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)" }}>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={1} style={{ fontWeight: 700, marginBottom: 8 }}>{quiz.title}</Title>
            <Text type="secondary" style={{ fontSize: "16px" }}>Results for: {submission.studentName}</Text>
          </div>

          <Divider />

          <Card
            style={{
              background: isPassing 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)" 
                : "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
              borderColor: isPassing ? "#10b981" : "#f59e0b",
              borderWidth: "2px",
            }}
          >
            <Space orientation="vertical" align="center" style={{ width: "100%" }}>
              <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                Score: {evaluation.score} / {evaluation.maxScore}
              </Title>
              <Text strong style={{ fontSize: 24, fontWeight: 600 }}>
                {percentage}%
              </Text>
              <Tag 
                color={isPassing ? "success" : "warning"} 
                style={{ 
                  fontSize: 15,
                  padding: "6px 16px",
                  borderRadius: "12px",
                  fontWeight: 500,
                }}
              >
                {isPassing ? "Passed" : "Needs Improvement"}
              </Tag>
            </Space>
          </Card>

          <Divider>Question Results</Divider>

          {quiz.questions.map((question, index) => {
            const questionId = getQuestionId(question);
            const result = evaluation.results.find((r) => String(r.questionId) === questionId);
            const studentAnswer = submission.answers.find((a) => String(a.questionId) === questionId);
            const isCorrect = result?.isCorrect ?? false;

            return (
              <Card
                key={questionId}
                style={{
                  marginBottom: 16,
                  borderColor: isCorrect ? "#52c41a" : "#ff4d4f",
                }}
              >
                <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                        Question {index + 1}: {question.question}
                      </Text>
                    </div>
                    <div>
                      {isCorrect ? (
                        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 24 }} />
                      )}
                    </div>
                  </div>

                  {question.type !== "written" && question.options && (
                    <div>
                      <Text type="secondary" strong>
                        Your Answer:{" "}
                      </Text>
                      {Array.isArray(studentAnswer?.answer) ? (
                        <Text>
                          {studentAnswer.answer
                            .map((ans) => {
                              if (!question.options) return String(ans);
                              // If answer is already text (from evaluation), use it directly
                              if (typeof ans === "string" && question.options.includes(ans)) {
                                return ans;
                              }
                              // Otherwise try to find by index
                              const idx = Number(ans);
                              if (!isNaN(idx) && question.options[idx]) {
                                return question.options[idx];
                              }
                              return String(ans);
                            })
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      ) : (
                        <Text>
                          {(() => {
                            const answer = studentAnswer?.answer;
                            if (!answer || !question.options) return "Not answered";
                            // If answer is already text (from evaluation), use it directly
                            if (typeof answer === "string") {
                              const foundOption = question.options.find(opt => opt === answer);
                              if (foundOption) return foundOption;
                              // Try to parse as index
                              const idx = Number(answer);
                              if (!isNaN(idx) && question.options[idx]) {
                                return question.options[idx];
                              }
                              return answer; // Return as-is if it's text
                            }
                            return "Not answered";
                          })()}
                        </Text>
                      )}
                    </div>
                  )}

                  {question.type === "written" && (
                    <div>
                      <Text type="secondary" strong>
                        Your Answer:
                      </Text>
                      <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                        {studentAnswer?.answer || "Not answered"}
                      </Paragraph>
                    </div>
                  )}

                  {result?.feedback && (
                    <Alert
                      title={result.feedback}
                      type={isCorrect ? "success" : "error"}
                      showIcon
                    />
                  )}
                </Space>
              </Card>
            );
          })}

          <Divider />

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">Thank you for completing the quiz!</Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
