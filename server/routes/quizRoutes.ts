import express from "express";
import Quiz from "../models/Quiz.js";
import type { IQuiz } from "../models/Quiz.js";

const router = express.Router();

// Get all quizzes
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ updatedAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

// Get quiz by ID
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ id: req.params.id });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// Get quiz by share link
router.get("/link/:link", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ shareLink: req.params.link, status: "published" });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found or not published" });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// Create or update quiz
router.post("/", async (req, res) => {
  try {
    const quizData: IQuiz = req.body;
    quizData.updatedAt = Date.now();

    const quiz = await Quiz.findOneAndUpdate(
      { id: quizData.id },
      quizData,
      { upsert: true, new: true }
    );

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: "Failed to save quiz" });
  }
});

// Delete quiz
router.delete("/:id", async (req, res) => {
  try {
    const result = await Quiz.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

export default router;
