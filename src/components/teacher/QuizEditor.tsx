import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Select,
  InputNumber,
  message,
  Divider,
  Popconfirm,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  RocketOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { getQuiz, saveQuiz } from "../../services/storageService";
import { generateQuizLink } from "../../utils/linkGenerator";
import type { Quiz, Question, QuestionType } from "../../types/quiz";

const { TextArea } = Input;

export default function QuizEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [form] = Form.useForm();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      message.error("Quiz ID is missing");
      navigate("/");
      return;
    }

    // Check if quiz was passed from navigation state (from QuizCreator)
    const stateQuiz = location.state?.quiz as Quiz | undefined;
    if (stateQuiz && stateQuiz.id === id) {
      setQuiz(stateQuiz);
      form.setFieldsValue({
        title: stateQuiz.title,
        description: stateQuiz.description,
        durationMinutes: stateQuiz.durationMinutes,
        questions: stateQuiz.questions,
      });
    } else {
      // Load from storage
      getQuiz(id).then((loadedQuiz) => {
        if (!loadedQuiz) {
          message.error("Quiz not found");
          navigate("/");
          return;
        }
        setQuiz(loadedQuiz);
        form.setFieldsValue({
          title: loadedQuiz.title,
          description: loadedQuiz.description,
          durationMinutes: loadedQuiz.durationMinutes,
          questions: loadedQuiz.questions,
        });
      }).catch((error) => {
        console.error("Error loading quiz:", error);
        message.error("Failed to load quiz");
        navigate("/");
      });
    }
  }, [id, navigate, location.state, form]);

  const handleSave = async (status: "draft" | "published") => {
    if (!quiz) return;

    try {
      const values = await form.validateFields();
      setLoading(true);
      try {
        // Process correct answers - convert to proper format
        const processedQuestions = values.questions.map((q: Question) => {
          // Get correctAnswer and handle potential number type from InputNumber
          const rawAnswer = q.correctAnswer;
          let correctAnswer: string | string[] | null;
          
          if (q.type === "single") {
            // InputNumber returns number, but we need string
            if (typeof rawAnswer === "number") {
              correctAnswer = String(rawAnswer);
            } else if (rawAnswer === null || rawAnswer === undefined) {
              correctAnswer = null;
            } else {
              correctAnswer = String(rawAnswer);
            }
          } else if (q.type === "multiple") {
            if (typeof rawAnswer === "string") {
              // Parse comma-separated string to array
              correctAnswer = rawAnswer.split(",").map((s) => s.trim()).filter(Boolean);
            } else if (Array.isArray(rawAnswer)) {
              correctAnswer = rawAnswer;
            } else {
              correctAnswer = [];
            }
          } else {
            // written type
            correctAnswer = rawAnswer === null || rawAnswer === undefined ? null : String(rawAnswer);
          }
          
          return {
            ...q,
            correctAnswer,
          };
        });

        const updatedQuiz: Quiz = {
          ...quiz,
          title: values.title,
          description: values.description,
          durationMinutes: values.durationMinutes,
          questions: processedQuestions,
          status,
          updatedAt: Date.now(),
        };

        if (status === "published" && !updatedQuiz.shareLink) {
          updatedQuiz.shareLink = generateQuizLink();
        }

        // If unpublishing, keep the shareLink but change status to draft
        if (status === "draft" && quiz.status === "published") {
          // Keep shareLink but status becomes draft
          // ShareLink is preserved so it can be republished later
        }

        const savedQuiz = await saveQuiz(updatedQuiz);
        setQuiz(savedQuiz);
        message.success(
          status === "published" 
            ? "Quiz published successfully!" 
            : quiz.status === "published" 
            ? "Quiz unpublished successfully!" 
            : "Quiz saved successfully!"
        );
        
        if (status === "published") {
          navigate("/");
        }
      } catch (error) {
        message.error("Failed to save quiz");
        console.error(error);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Validation error:", error);
      message.error("Please fix the errors in the form");
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const questions = form.getFieldValue("questions") || [];
    const newQuestion: Question = {
      id: `q_${Date.now()}_${Math.random()}`,
      type: "single",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: null,
    };
    form.setFieldsValue({
      questions: [...questions, newQuestion],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    const questions = form.getFieldValue("questions") || [];
    form.setFieldsValue({
      questions: questions.filter((_: Question, i: number) => i !== index),
    });
  };

  const handleQuestionTypeChange = (index: number, type: QuestionType) => {
    const questions = form.getFieldValue("questions") || [];
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      type,
      options: type === "written" ? null : updated[index].options || ["", "", "", ""],
      correctAnswer: null,
    };
    form.setFieldsValue({ questions: updated });
  };

  if (!quiz) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading quiz...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/")}
        style={{ marginBottom: 16 }}
      >
        Back to Dashboard
      </Button>

      <Card
        title={<span style={{ fontSize: "24px", fontWeight: 600 }}>Edit Quiz</span>}
        extra={
          <Space>
            <Button
              icon={<SaveOutlined />}
              onClick={() => handleSave("draft")}
              loading={loading}
              size="large"
              style={{ fontWeight: 500 }}
            >
              {quiz.status === "published" ? "Save Changes" : "Save Draft"}
            </Button>
            {quiz.status === "published" ? (
              <Popconfirm
                title="Unpublish this quiz?"
                description="The quiz will no longer be accessible via the share link. You can republish it later."
                onConfirm={() => handleSave("draft")}
                okText="Yes, Unpublish"
                cancelText="Cancel"
              >
                <Button
                  icon={<StopOutlined />}
                  loading={loading}
                  size="large"
                  style={{ fontWeight: 500 }}
                >
                  Unpublish
                </Button>
              </Popconfirm>
            ) : (
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={() => handleSave("published")}
                loading={loading}
                size="large"
                style={{ fontWeight: 500 }}
              >
                Publish
              </Button>
            )}
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input size="large" placeholder="Quiz title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter a description" }]}
          >
            <TextArea rows={3} placeholder="Quiz description" />
          </Form.Item>

          <Form.Item
            name="durationMinutes"
            label="Duration (minutes)"
            rules={[{ required: true, message: "Please enter duration" }]}
          >
            <InputNumber min={1} max={300} style={{ width: "100%" }} />
          </Form.Item>

          <Divider>Questions</Divider>

          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => {
                  const questionType = form.getFieldValue(["questions", index, "type"]) || "single";
                  return (
                    <Card
                      key={field.key}
                      title={<span style={{ fontWeight: 600 }}>Question {index + 1}</span>}
                      extra={
                        <Popconfirm
                          title="Remove this question?"
                          onConfirm={() => {
                            remove(field.name);
                            handleRemoveQuestion(index);
                          }}
                        >
                          <Button danger icon={<DeleteOutlined />} type="text" style={{ fontWeight: 500 }}>
                            Remove
                          </Button>
                        </Popconfirm>
                      }
                      style={{ marginBottom: 16 }}
                    >
                      <Space orientation="vertical" style={{ width: "100%" }} size="middle">
                        <Form.Item
                          name={[field.name, "type"]}
                          label="Question Type"
                          rules={[{ required: true }]}
                        >
                          <Select
                            onChange={(value) => handleQuestionTypeChange(index, value)}
                            options={[
                              { label: "Single Choice", value: "single" },
                              { label: "Multiple Choice", value: "multiple" },
                              { label: "Written Answer", value: "written" },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item
                          name={[field.name, "question"]}
                          label="Question"
                          rules={[{ required: true, message: "Please enter the question" }]}
                        >
                          <TextArea rows={2} placeholder="Enter your question" />
                        </Form.Item>

                        {(questionType === "single" || questionType === "multiple") && (
                          <>
                            <Form.Item
                              name={[field.name, "options"]}
                              label="Options"
                              rules={[
                                { required: true, message: "Please provide options" },
                                {
                                  validator: (_, value) => {
                                    if (!value || value.length < 2) {
                                      return Promise.reject("At least 2 options required");
                                    }
                                    if (value.some((opt: string) => !opt.trim())) {
                                      return Promise.reject("All options must be filled");
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                            >
                              <Form.List name={[field.name, "options"]}>
                                {(optionFields, { add: addOption, remove: removeOption }) => (
                                  <>
                                    {optionFields.map((optionField) => (
                                      <Form.Item
                                        key={optionField.key}
                                        name={optionField.name}
                                        style={{ marginBottom: 8 }}
                                      >
                                        <Input
                                          placeholder={`Option ${optionField.name + 1}`}
                                          suffix={
                                            optionFields.length > 2 ? (
                                              <Button
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeOption(optionField.name)}
                                              />
                                            ) : null
                                          }
                                        />
                                      </Form.Item>
                                    ))}
                                    <Button
                                      type="dashed"
                                      onClick={() => addOption("")}
                                      icon={<PlusOutlined />}
                                      style={{ width: "100%" }}
                                    >
                                      Add Option
                                    </Button>
                                  </>
                                )}
                              </Form.List>
                            </Form.Item>

                            <Form.Item
                              name={[field.name, "correctAnswer"]}
                              label={
                                questionType === "single"
                                  ? "Correct Answer (select option index, 0-based)"
                                  : "Correct Answers (comma-separated indices, 0-based)"
                              }
                              rules={[{ required: true, message: "Please specify correct answer(s)" }]}
                              help={
                                questionType === "single"
                                  ? "Enter the index of the correct option (0, 1, 2, etc.)"
                                  : "Enter comma-separated indices (e.g., 0,2,3)"
                              }
                            >
                              {questionType === "single" ? (
                                <InputNumber
                                  min={0}
                                  placeholder="0"
                                  style={{ width: "100%" }}
                                />
                              ) : (
                                <Input placeholder="0,1,2" />
                              )}
                            </Form.Item>
                          </>
                        )}

                        {questionType === "written" && (
                          <Form.Item
                            name={[field.name, "correctAnswer"]}
                            label="Expected Answer (for reference)"
                            help="This will be used by AI for evaluation"
                          >
                            <TextArea rows={2} placeholder="Expected answer or key points" />
                          </Form.Item>
                        )}
                      </Space>
                    </Card>
                  );
                })}

                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                    handleAddQuestion();
                  }}
                  icon={<PlusOutlined />}
                  block
                  style={{ marginTop: 16 }}
                >
                  Add Question
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Card>
    </div>
  );
}
