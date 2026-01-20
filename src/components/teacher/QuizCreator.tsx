import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { generateQuiz } from "../../services/aiService";
import type { Quiz, Question } from "../../types/quiz";

const { TextArea } = Input;

export default function QuizCreator() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { prompt: string }) => {
    if (!values.prompt.trim()) {
      message.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    try {
      const quizData = await generateQuiz(values.prompt);

      // Convert to Quiz format with generated ID
      const quiz: Quiz = {
        id: `quiz_${Date.now()}`,
        title: quizData.title,
        description: quizData.description,
        durationMinutes: quizData.durationMinutes,
        questions: quizData.questions.map((q) => ({
          ...q,
          id: q.id || `q_${Date.now()}_${Math.random()}`,
        })) as Question[],
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Navigate to editor with quiz data
      navigate(`/edit/${quiz.id}`, { state: { quiz } });
      message.success("Quiz generated successfully! You can now edit it.");
    } catch (error) {
      console.error("Error generating quiz:", error);
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to generate quiz. Please check your API key and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/")}
        style={{ marginBottom: 16 }}
      >
        Back to Dashboard
      </Button>

      <Card 
        title={
          <span style={{ fontSize: "24px", fontWeight: 600 }}>Create Quiz with AI</span>
        }
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="prompt"
            label={<span style={{ fontWeight: 500, fontSize: "16px" }}>Describe your quiz</span>}
            rules={[{ required: true, message: "Please enter a prompt" }]}
            help="Example: Create a 5-question multiple-choice quiz about the American Civil War, difficulty: medium, 10 minutes"
          >
            <TextArea
              rows={8}
              placeholder="Enter a natural language description of your quiz. Include topic, difficulty, number of questions, question types, and time limit."
              style={{ fontSize: "15px" }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large" 
              block
              style={{ 
                height: "48px",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              {loading ? (
                <span>
                  <Spin size="small" style={{ marginRight: 8 }} />
                  Generating Quiz...
                </span>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
