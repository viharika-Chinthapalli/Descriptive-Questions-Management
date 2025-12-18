/**
 * Express.js route handlers for question management API.
 */

import express from "express";
import {
  createQuestion,
  getQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  recordQuestionUsageByText,
  getUsageByQuestionText,
  checkQuestionDuplicate,
  DuplicateQuestionError,
} from "../services/questionService.js";
import {
  validateQuestionCreate,
  validateQuestionUpdate,
  validateQuestionId,
  validateQuestionUsageByText,
  validateUsageByTextRequest,
  validateSimilarityCheck,
} from "../middleware/validation.js";
import { getSupabaseClient } from "../database.js";

const router = express.Router();

/**
 * Handle database errors and provide user-friendly messages.
 *
 * @param {Error} error - Database error
 * @param {import('express').Response} res - Express response object
 * @returns {import('express').Response} Error response
 */
function handleDatabaseError(error, res) {
  const errorMsg = error.message || String(error);

  if (
    errorMsg.includes("Tenant or user not found") ||
    errorMsg.includes("authentication failed")
  ) {
    return res.status(503).json({
      message: "Database authentication failed. Please check your Supabase connection string.",
      error: "DATABASE_AUTH_ERROR",
      hint:
        "Verify your SUPABASE_URL and SUPABASE_ANON_KEY in .env file. " +
        "Get credentials from: Supabase Dashboard → Settings → API",
    });
  }

  if (
    errorMsg.includes("could not translate host name") ||
    errorMsg.includes("getaddrinfo")
  ) {
    return res.status(503).json({
      message: "Cannot connect to Supabase. Please check if your project is active.",
      error: "DATABASE_CONNECTION_ERROR",
      hint: "Go to https://supabase.com/dashboard and restore your project if it's paused",
    });
  }

  return res.status(503).json({
    message: "Database error occurred. Please check your Supabase configuration.",
    error: "DATABASE_ERROR",
    hint: "See SUPABASE_SETUP.md for setup instructions",
  });
}

/**
 * POST /api/questions
 * Create a new question.
 */
router.post("/questions", validateQuestionCreate, async (req, res, next) => {
  try {
    const question = await createQuestion(req.body);
    res.status(201).json(question);
  } catch (error) {
    if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
      return handleDatabaseError(error, res);
    }
    if (error instanceof DuplicateQuestionError) {
      return res.status(400).json({
        message: error.message,
        ...error.toDetail(),
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
        code: "VALIDATION_ERROR",
      });
    }
    next(error);
  }
});

/**
 * GET /api/questions
 * Get all questions with optional filters and pagination.
 */
router.get("/questions", async (req, res, next) => {
  try {
    const {
      skip = 0,
      limit = 100,
      subject,
      exam_type,
      college,
      status,
      search_text,
    } = req.query;

    const result = await getAllQuestions({
      skip: parseInt(skip, 10),
      limit: parseInt(limit, 10),
      subject,
      exam_type,
      college,
      status,
      search_text,
    });

    const page = Math.floor(parseInt(skip, 10) / parseInt(limit, 10)) + 1;

    res.json({
      questions: result.questions,
      total: result.total,
      page: page,
      page_size: parseInt(limit, 10),
    });
  } catch (error) {
    if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
      return handleDatabaseError(error, res);
    }
    next(error);
  }
});

/**
 * POST /api/questions/usage-by-text/search
 * Get usage count and history for a question by its text (PRIMARY endpoint).
 */
router.post(
  "/questions/usage-by-text/search",
  validateUsageByTextRequest,
  async (req, res, next) => {
    try {
      const questionText = req.body.question_text.trim();

      if (!questionText || questionText.length < 10) {
        return res.status(422).json({
          message: "question_text must be at least 10 characters long.",
          hint: "Please provide the full question text.",
          errors: [
            {
              field: "question_text",
              message: "question_text must be at least 10 characters long.",
              type: "value_error",
            },
          ],
        });
      }

      const result = await getUsageByQuestionText(questionText);

      res.json({
        usage_count: result.usage_count,
        question_text: result.question_text,
        matching_questions_count: result.matching_questions_count,
        usage_history: result.usage_history,
        questions: result.questions,
      });
    } catch (error) {
      if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
        return handleDatabaseError(error, res);
      }
      console.error("Unexpected error in get_usage_by_question_text:", error);
      res.status(500).json({
        message: "An unexpected error occurred while fetching usage data.",
        error: "INTERNAL_SERVER_ERROR",
        hint: "Please check the server logs for more details.",
      });
    }
  }
);

/**
 * POST /api/questions/usage-by-text
 * Record question usage using question text (PRIMARY endpoint).
 */
router.post(
  "/questions/usage-by-text",
  validateQuestionUsageByText,
  async (req, res, next) => {
    try {
      const questionText = req.body.question_text.trim();

      if (!questionText || questionText.length < 10) {
        return res.status(422).json({
          message: "question_text must be at least 10 characters long.",
          hint: "Please provide the full question text (not a numeric ID).",
        });
      }

      const usageData = {
        exam_name: req.body.exam_name,
        exam_type: req.body.exam_type,
        academic_year: req.body.academic_year,
        college: req.body.college,
      };

      const usageRecord = await recordQuestionUsageByText(questionText, usageData);

      // Enrich response with question_text
      res.status(201).json({
        id: usageRecord.id,
        question_id: usageRecord.question_id,
        question_text: questionText,
        exam_name: usageRecord.exam_name,
        exam_type: usageRecord.exam_type,
        academic_year: usageRecord.academic_year,
        college: usageRecord.college,
        date_used: usageRecord.date_used,
      });
    } catch (error) {
      if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
        return handleDatabaseError(error, res);
      }
      if (error.message?.includes("not found")) {
        return res.status(404).json({
          message: error.message,
          error: "QUESTION_NOT_FOUND",
          hint: "No question found matching the provided text. Please check the question text.",
        });
      }
      next(error);
    }
  }
);

/**
 * GET /api/questions/usage-by-text
 * GET endpoint for usage by question text (legacy support).
 */
router.get("/questions/usage-by-text", async (req, res, next) => {
  try {
    const questionText = decodeURIComponent(req.query.question_text || "").trim();

    if (!questionText || questionText.length < 10) {
      return res.status(422).json({
        message: "question_text must be at least 10 characters long.",
        hint: "Please provide the full question text.",
      });
    }

    const result = await getUsageByQuestionText(questionText);

    res.json({
      usage_count: result.usage_count,
      question_text: result.question_text,
      matching_questions_count: result.matching_questions_count,
      usage_history: result.usage_history,
      questions: result.questions,
    });
  } catch (error) {
    if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
      return handleDatabaseError(error, res);
    }
    console.error("Error in get_usage_by_question_text_get:", error);
    res.status(500).json({
      message: "An unexpected error occurred.",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});

/**
 * GET /api/questions/check-similarity
 * Check if a question is duplicate or similar to existing questions.
 */
router.get("/questions/check-similarity", validateSimilarityCheck, async (req, res, next) => {
  try {
    const { question_text, exclude_id, college } = req.query;

    const result = await checkQuestionDuplicate(
      question_text,
      exclude_id ? parseInt(exclude_id, 10) : null,
      college || null
    );

    res.json({
      is_duplicate: result.isDuplicate,
      exact_match: result.exactMatch,
      similar_questions: result.similarQuestions.map((item) => item.question),
      similarity_scores: result.similarQuestions.map((item) => item.score),
    });
  } catch (error) {
    if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
      return handleDatabaseError(error, res);
    }
    next(error);
  }
});

/**
 * GET /api/questions/:question_id
 * Get a question by ID.
 */
router.get("/questions/:question_id", validateQuestionId, async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.question_id, 10);
    const question = await getQuestion(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
      return handleDatabaseError(error, res);
    }
    next(error);
  }
});

/**
 * PUT /api/questions/:question_id
 * Update a question.
 */
router.put(
  "/questions/:question_id",
  validateQuestionId,
  validateQuestionUpdate,
  async (req, res, next) => {
    try {
      const questionId = parseInt(req.params.question_id, 10);
      const question = await updateQuestion(questionId, req.body);

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
        return handleDatabaseError(error, res);
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/questions/:question_id
 * Permanently delete a question from the database.
 */
router.delete("/questions/:question_id", validateQuestionId, async (req, res, next) => {
  try {
    const questionId = parseInt(req.params.question_id, 10);
    const success = await deleteQuestion(questionId);

    if (!success) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({
      message: "Question permanently deleted successfully",
      question_id: questionId,
    });
  } catch (error) {
    if (error.code?.startsWith("PGRST") || error.message?.includes("database")) {
      return handleDatabaseError(error, res);
    }
    next(error);
  }
});

export default router;

