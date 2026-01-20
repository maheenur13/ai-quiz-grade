import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Tag, Space, Popconfirm, message, Input, Row, Col } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, BarChartOutlined } from "@ant-design/icons";
import { getAllQuizzes, deleteQuiz, getSubmissionsByQuizId } from "../../services/storageService";
import type { Quiz } from "../../types/quiz";

// Helper to get quiz ID (handles both id and _id from MongoDB)
function getQuizId(quiz: { id?: string; _id?: string }): string {
  return quiz.id || quiz._id || String(Math.random());
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchText, setSearchText] = useState("");
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;

    async function fetchQuizzes() {
      try {
        const allQuizzes = await getAllQuizzes();
        const sorted = allQuizzes.sort((a, b) => b.updatedAt - a.updatedAt);
        
        if (!isMounted) return;
        setQuizzes(sorted);

        // Load submission counts for each quiz
        const counts: Record<string, number> = {};
        await Promise.all(
          sorted.map(async (quiz) => {
            try {
              const quizId = getQuizId(quiz);
              const submissions = await getSubmissionsByQuizId(quizId);
              if (isMounted) {
                counts[quizId] = submissions.length;
              }
            } catch (error) {
              console.error(`Error loading submissions for quiz ${quiz.id}:`, error);
              if (isMounted) {
                counts[getQuizId(quiz)] = 0;
              }
            }
          })
        );
        
        if (isMounted) {
          setSubmissionCounts(counts);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading quizzes:", error);
          message.error("Failed to load quizzes");
        }
      }
    }

    void fetchQuizzes();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadQuizzes = useCallback(async () => {
    try {
      const allQuizzes = await getAllQuizzes();
      const sorted = allQuizzes.sort((a, b) => b.updatedAt - a.updatedAt);
      setQuizzes(sorted);

      // Load submission counts for each quiz
      const counts: Record<string, number> = {};
      await Promise.all(
        sorted.map(async (quiz) => {
          try {
            const quizId = getQuizId(quiz);
            const submissions = await getSubmissionsByQuizId(quizId);
            counts[quizId] = submissions.length;
          } catch (error) {
            console.error(`Error loading submissions for quiz ${quiz.id}:`, error);
            counts[getQuizId(quiz)] = 0;
          }
        })
      );
      setSubmissionCounts(counts);
    } catch (error) {
      console.error("Error loading quizzes:", error);
      message.error("Failed to load quizzes");
    }
  }, []);

  // Use useMemo for derived state instead of useEffect
  const filteredQuizzes = useMemo(() => {
    if (searchText.trim() === "") {
      return quizzes;
    }
    return quizzes.filter(
      (q) =>
        q.title.toLowerCase().includes(searchText.toLowerCase()) ||
        q.description.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, quizzes]);

  const handleDelete = async (id: string) => {
    try {
      await deleteQuiz(id);
      message.success("Quiz deleted successfully");
      await loadQuizzes();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      message.error("Failed to delete quiz");
    }
  };

  const handleCopyLink = (link: string) => {
    const fullLink = `${window.location.origin}/quiz/${link}`;
    navigator.clipboard.writeText(fullLink);
    message.success("Link copied to clipboard!");
  };

  return (
    <div>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 700 }}>My Quizzes</h1>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate("/create")} 
            size="large"
            style={{ 
              height: "44px",
              padding: "0 24px",
              fontWeight: 500,
            }}
          >
            Create New Quiz
          </Button>
        </div>

        <Input.Search
          placeholder="Search quizzes..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
          size="large"
        />

        {filteredQuizzes.length === 0 ? (
          <Card>
            <p style={{ textAlign: "center", color: "gray" }}>
              {searchText ? "No quizzes found matching your search." : "No quizzes yet. Create your first quiz!"}
            </p>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredQuizzes.map((quiz) => (
              <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6} key={getQuizId(quiz)}>
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: "18px" }}>{quiz.title}</span>
                  }
                  extra={
                    <Tag 
                      color={quiz.status === "published" ? "success" : "default"}
                      style={{ 
                        fontWeight: 500,
                        padding: "4px 12px",
                        borderRadius: "12px",
                      }}
                    >
                      {quiz.status === "published" ? "Published" : "Draft"}
                    </Tag>
                  }
                  actions={[
                    <Button
                      key="results"
                      type="text"
                      icon={<BarChartOutlined />}
                      onClick={() => navigate(`/submissions/${getQuizId(quiz)}`)}
                      style={{ fontWeight: 500 }}
                    >
                      Results
                    </Button>,
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/edit/${getQuizId(quiz)}`)}
                      style={{ fontWeight: 500 }}
                    >
                      Edit
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="Delete this quiz?"
                      description="This action cannot be undone."
                      onConfirm={() => handleDelete(getQuizId(quiz))}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} style={{ fontWeight: 500 }}>
                        Delete
                      </Button>
                    </Popconfirm>,
                  ]}
                  style={{ 
                    height: "100%",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  hoverable
                >
                  <p style={{ marginBottom: 12, color: "inherit", opacity: 0.8, minHeight: "40px" }}>
                    {quiz.description}
                  </p>
                  <div style={{ marginBottom: 12 }}>
                    <Tag style={{ marginRight: 8, borderRadius: "6px" }}>
                      {quiz.questions.length} questions
                    </Tag>
                    <Tag style={{ marginRight: 8, borderRadius: "6px" }}>
                      {quiz.durationMinutes} min
                    </Tag>
                    {quiz.status === "published" && (
                      <Tag color="blue" style={{ borderRadius: "6px" }}>
                        {submissionCounts[getQuizId(quiz)] || 0} submissions
                      </Tag>
                    )}
                  </div>
                  {quiz.status === "published" && quiz.shareLink && (
                    <Space.Compact style={{ width: "100%" }}>
                      <Input
                        readOnly
                        value={`${window.location.origin}/quiz/${quiz.shareLink}`}
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyLink(quiz.shareLink!)}
                      />
                    </Space.Compact>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </div>
  );
}
