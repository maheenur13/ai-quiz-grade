import express from "express";
import Submission from "../models/Submission.js";
import type { ISubmission } from "../models/Submission.js";

const router = express.Router();

// Get all submissions
router.get("/", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Get submissions by quiz ID
router.get("/quiz/:quizId", async (req, res) => {
  try {
    const submissions = await Submission.find({ quizId: req.params.quizId }).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Create submission
router.post("/", async (req, res) => {
  try {
    const submissionData = req.body;
    console.log("Received submission data:", JSON.stringify(submissionData, null, 2));
    
    // Validate required fields
    if (!submissionData.quizId || !submissionData.studentName || !submissionData.answers) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["quizId", "studentName", "answers"]
      });
    }

    // Ensure submittedAt is set
    if (!submissionData.submittedAt) {
      submissionData.submittedAt = Date.now();
    }

    // Ensure evaluation results have string questionIds and valid structure
    if (submissionData.evaluation) {
      if (!submissionData.evaluation.score || typeof submissionData.evaluation.score !== "number") {
        return res.status(400).json({ 
          error: "Invalid evaluation: score must be a number"
        });
      }
      if (!submissionData.evaluation.maxScore || typeof submissionData.evaluation.maxScore !== "number") {
        return res.status(400).json({ 
          error: "Invalid evaluation: maxScore must be a number"
        });
      }
      if (submissionData.evaluation.results && Array.isArray(submissionData.evaluation.results)) {
        submissionData.evaluation.results = submissionData.evaluation.results.map((result: any) => ({
          questionId: String(result.questionId || ""),
          isCorrect: Boolean(result.isCorrect),
          feedback: String(result.feedback || result.feedbackText || ""),
        }));
      }
    }

    // Ensure answers have string questionIds
    if (submissionData.answers && Array.isArray(submissionData.answers)) {
      submissionData.answers = submissionData.answers.map((answer: any) => ({
        questionId: String(answer.questionId || ""),
        answer: answer.answer,
      }));
    }

    const submission = new Submission(submissionData);
    const validationError = submission.validateSync();
    if (validationError) {
      console.error("Validation error:", validationError);
      const errorDetails: Record<string, string> = {};
      if (validationError.errors) {
        Object.keys(validationError.errors).forEach((key) => {
          errorDetails[key] = validationError.errors[key].message;
        });
      }
      return res.status(400).json({ 
        error: "Validation failed",
        details: validationError.message,
        errors: errorDetails
      });
    }

    await submission.save();
    console.log("Submission saved successfully:", submission._id);
    res.json(submission);
  } catch (error: any) {
    console.error("Error saving submission:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      errors: error.errors
    });
    res.status(500).json({ 
      error: "Failed to save submission",
      details: error.message,
      name: error.name
    });
  }
});

export default router;
