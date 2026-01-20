import { Card, Typography, Space, Tag, Divider, Alert } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { Quiz, Submission } from "../../types/quiz";

const { Title, Text, Paragraph } = Typography;

// Helper to get question ID (handles both id and _id from MongoDB)
function getQuestionId(question: { id?: string; _id?: string }): string {
  return question.id || question._id || String(Math.random());
}

interface SubmissionDetailsProps {
  quiz: Quiz;
  submission: Submission;
}

export default function SubmissionDetails({ quiz, submission }: SubmissionDetailsProps) {
  const evaluation = submission.evaluation;

  if (!evaluation) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Text>No evaluation available for this submission.</Text>
      </div>
    );
  }

  // Recalculate score from actual results using partial scores
  const totalQuestions = quiz.questions.length;
  const calculatedScore = evaluation.results.reduce((sum, r) => {
    const score = r.partialScore !== undefined ? r.partialScore : (r.isCorrect ? 1.0 : 0.0);
    return sum + score;
  }, 0);
  
  const actualScore = Math.round(calculatedScore * 100) / 100;
  const maxScore = totalQuestions;
  const displayScore = Math.abs(actualScore - evaluation.score) > 0.01 ? actualScore : evaluation.score;
  const displayMaxScore = maxScore !== evaluation.maxScore ? maxScore : evaluation.maxScore;
  
  const percentage = Math.round((displayScore / displayMaxScore) * 100);
  const isPassing = percentage >= 60;

  return (
    <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
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
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
              Score: {displayScore} / {displayMaxScore}
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
          
          // Try to find result by question ID first
          let result = evaluation.results.find((r) => {
            const rId = String(r.questionId || "").trim();
            const qId = String(questionId || "").trim();
            return rId === qId && rId !== "";
          });
          
          // Fallback to index-based matching if ID matching fails
          if (!result && evaluation.results[index]) {
            result = evaluation.results[index];
          }
          
          // Try to find student answer by question ID first
          let studentAnswer = submission.answers.find((a) => {
            const aId = String(a.questionId || "").trim();
            const qId = String(questionId || "").trim();
            return aId === qId && aId !== "";
          });
          
          // Fallback to index-based matching if ID matching fails
          if (!studentAnswer && submission.answers[index]) {
            studentAnswer = submission.answers[index];
          }
          
          const isCorrect = result?.isCorrect ?? false;
          const partialScore = result?.partialScore;
          const hasPartialCredit = partialScore !== undefined && partialScore > 0 && partialScore < 1;
          const isPartial = hasPartialCredit && isCorrect;
          
          // Determine border color based on correctness and partial credit
          let borderColor = "#ff4d4f"; // Red for wrong
          if (isCorrect && !hasPartialCredit) {
            borderColor = "#52c41a"; // Green for fully correct
          } else if (isPartial) {
            borderColor = "#faad14"; // Orange/amber for partial credit
          }

          return (
            <Card
              key={questionId}
              style={{
                marginBottom: 16,
                borderColor: borderColor,
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
                    {isPartial ? (
                      <Tag color="warning" style={{ fontSize: 14, padding: "4px 12px" }}>
                        Partial: {Math.round((partialScore || 0) * 100)}%
                      </Tag>
                    ) : isCorrect ? (
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
                            if (typeof ans === "string" && question.options.includes(ans)) {
                              return ans;
                            }
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
                          if (typeof answer === "string") {
                            const foundOption = question.options.find(opt => opt === answer);
                            if (foundOption) return foundOption;
                            const idx = Number(answer);
                            if (!isNaN(idx) && question.options[idx]) {
                              return question.options[idx];
                            }
                            return answer;
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
                    message={result.feedback}
                    type={isCorrect ? "success" : "error"}
                    showIcon
                  />
                )}
              </Space>
            </Card>
          );
        })}
      </Space>
    </div>
  );
}
