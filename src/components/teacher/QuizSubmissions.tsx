import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Table, Tag, Space, Typography, Button, Statistic, Row, Col, Divider } from "antd";
import { ArrowLeftOutlined, UserOutlined, TrophyOutlined } from "@ant-design/icons";
import { getQuiz, getSubmissionsByQuizId } from "../../services/storageService";
import type { Quiz, Submission } from "../../types/quiz";

const { Title, Text } = Typography;

// Helper to get quiz ID (handles both id and _id from MongoDB)
function getQuizId(quiz: { id?: string; _id?: string }): string {
  return quiz.id || quiz._id || String(Math.random());
}

export default function QuizSubmissions() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    loadData();
  }, [id, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedQuiz = await getQuiz(id!);
      if (!loadedQuiz) {
        navigate("/");
        return;
      }

      const quizId = getQuizId(loadedQuiz);
      const loadedSubmissions = await getSubmissionsByQuizId(quizId);

      setQuiz(loadedQuiz);
      setSubmissions(loadedSubmissions);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Text>Loading submissions...</Text>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const avgScore = submissions.length > 0
    ? submissions.reduce((sum, sub) => {
        const score = sub.evaluation?.score || 0;
        const maxScore = sub.evaluation?.maxScore || 1;
        return sum + (score / maxScore) * 100;
      }, 0) / submissions.length
    : 0;
  const passingCount = submissions.filter((sub) => {
    const score = sub.evaluation?.score || 0;
    const maxScore = sub.evaluation?.maxScore || 1;
    return (score / maxScore) * 100 >= 60;
  }).length;

  const columns = [
    {
      title: "Student Name",
      dataIndex: "studentName",
      key: "studentName",
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Score",
      key: "score",
      render: (_: unknown, record: Submission) => {
        const score = record.evaluation?.score || 0;
        const maxScore = record.evaluation?.maxScore || 0;
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        return (
          <Space>
            <Text strong>{score} / {maxScore}</Text>
            <Tag color={percentage >= 60 ? "success" : "warning"}>
              {percentage}%
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: Submission) => {
        const score = record.evaluation?.score || 0;
        const maxScore = record.evaluation?.maxScore || 0;
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        return (
          <Tag color={percentage >= 60 ? "success" : "error"}>
            {percentage >= 60 ? "Passed" : "Failed"}
          </Tag>
        );
      },
    },
    {
      title: "Submitted At",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (timestamp: number) => {
        const date = new Date(timestamp);
        return (
          <Text type="secondary">
            {date.toLocaleString()}
          </Text>
        );
      },
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/")}
        style={{ marginBottom: 16 }}
      >
        Back to Dashboard
      </Button>

      <Card>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
              {quiz.title}
            </Title>
            <Text type="secondary" style={{ fontSize: "16px" }}>
              {quiz.description}
            </Text>
          </div>

          <Divider />

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Submissions"
                  value={totalSubmissions}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Average Score"
                  value={avgScore.toFixed(1)}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Passing Rate"
                  value={totalSubmissions > 0 ? ((passingCount / totalSubmissions) * 100).toFixed(1) : 0}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>

          <Divider>Submissions</Divider>

          {submissions.length === 0 ? (
            <Card>
              <Text type="secondary" style={{ textAlign: "center", display: "block" }}>
                No submissions yet for this quiz.
              </Text>
            </Card>
          ) : (
            <Table
              columns={columns}
              dataSource={submissions}
              rowKey={(record) => record.quizId + record.studentName + record.submittedAt}
              pagination={{ pageSize: 10 }}
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
