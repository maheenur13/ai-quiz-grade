import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Input, Button, Form, Typography, message } from "antd";
import { getQuizByLink } from "../../services/storageService";

const { Title, Text } = Typography;

export default function NameEntry() {
  const navigate = useNavigate();
  const { link } = useParams<{ link: string }>();
  const [form] = Form.useForm();
  const [quizTitle, setQuizTitle] = useState("");

  useEffect(() => {
    if (!link) {
      message.error("Invalid quiz link");
      navigate("/");
      return;
    }

    getQuizByLink(link).then((quiz) => {
      if (!quiz) {
        message.error("Quiz not found or not published");
        navigate("/");
        return;
      }

      setQuizTitle(quiz.title);

      // Generate default participant number
      const participantNumber = Math.floor(Math.random() * 1000) + 1;
      const generatedName = `Participant ${participantNumber}`;
      form.setFieldsValue({ name: generatedName });
    }).catch((error) => {
      console.error("Error loading quiz:", error);
      message.error("Failed to load quiz");
      navigate("/");
    });
  }, [link, navigate, form]);

  const handleSubmit = (values: { name: string }) => {
    if (!values.name.trim()) {
      message.error("Please enter your name");
      return;
    }

    // Store name in sessionStorage for this quiz session
    sessionStorage.setItem(`quiz_${link}_name`, values.name.trim());
    navigate(`/take/${link}`);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <Card 
        style={{ 
          maxWidth: 500, 
          width: "100%",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Title level={2} style={{ textAlign: "center", marginBottom: 8, fontWeight: 700 }}>
          {quizTitle || "Quiz"}
        </Title>
        <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 32, fontSize: "16px" }}>
          Enter your display name to begin
        </Text>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 500, fontSize: "16px" }}>Your Name</span>}
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input 
              size="large" 
              placeholder="Enter your display name"
              style={{ fontSize: "15px" }}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              style={{ 
                height: "48px",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Start Quiz
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
