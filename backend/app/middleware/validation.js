/**
 * Validation middleware using express-validator.
 */

import { body, query, param, validationResult } from "express-validator";

/**
 * Middleware to check validation results.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => {
      let message = error.msg;
      const field = error.path || error.param;

      // Provide user-friendly messages for common validation errors
      if (field === "question_id" && error.msg.includes("int")) {
        message = `Invalid question ID. The question_id must be a numeric value (integer), but received: '${error.value}'. Question IDs are numeric identifiers, not text.`;
      } else if (error.msg.includes("int")) {
        message = `Invalid integer value for ${field}. Expected a number but received: ${error.value}.`;
      } else if (error.msg.includes("string")) {
        message = `Invalid value for ${field}. Expected text/string but received: ${error.value}.`;
      } else if (error.msg.includes("required") || error.msg.includes("missing")) {
        message = `Missing required parameter: ${field}. Please provide a value for this parameter.`;
      } else if (field === "question_text" && error.msg.includes("length")) {
        message = `Question text must be at least 10 characters long. Received: ${error.value?.length || 0} characters.`;
      }

      return {
        field: field,
        message: message,
        type: error.type || "validation_error",
        input: error.value,
      };
    });

    return res.status(422).json({
      detail: "Validation error",
      errors: formattedErrors,
      help: "For Question Usage History, use text-based endpoints: /api/questions/usage-by-text",
    });
  }
  next();
}

// Question validation rules
export const validateQuestionCreate = [
  body("question_text")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Question text must be at least 10 characters long"),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("difficulty_level")
    .isIn(["Easy", "Medium", "Hard"])
    .withMessage("Difficulty must be one of: Easy, Medium, Hard"),
  body("marks").isInt({ gt: 0 }).withMessage("Marks must be a positive integer"),
  body("exam_type").trim().notEmpty().withMessage("Exam type is required"),
  body("college").trim().notEmpty().withMessage("College is required"),
  body("topic").optional().trim(),
  validate,
];

export const validateQuestionUpdate = [
  body("question_text")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Question text must be at least 10 characters long"),
  body("subject").optional().trim().notEmpty(),
  body("difficulty_level")
    .optional()
    .isIn(["Easy", "Medium", "Hard"])
    .withMessage("Difficulty must be one of: Easy, Medium, Hard"),
  body("marks").optional().isInt({ gt: 0 }),
  body("exam_type").optional().trim().notEmpty(),
  body("college").optional().trim().notEmpty(),
  body("status")
    .optional()
    .isIn(["Active", "Blocked", "Archived"])
    .withMessage("Status must be one of: Active, Blocked, Archived"),
  validate,
];

export const validateQuestionUsage = [
  body("exam_name").trim().notEmpty().withMessage("Exam name is required"),
  body("exam_type").trim().notEmpty().withMessage("Exam type is required"),
  body("academic_year").trim().notEmpty().withMessage("Academic year is required"),
  body("college").trim().notEmpty().withMessage("College is required"),
  validate,
];

export const validateQuestionUsageByText = [
  body("question_text")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Question text must be at least 10 characters long"),
  body("exam_name").trim().notEmpty().withMessage("Exam name is required"),
  body("exam_type").trim().notEmpty().withMessage("Exam type is required"),
  body("academic_year").trim().notEmpty().withMessage("Academic year is required"),
  body("college").trim().notEmpty().withMessage("College is required"),
  validate,
];

export const validateQuestionId = [
  param("question_id").isInt().withMessage("Question ID must be an integer"),
  validate,
];

export const validateSimilarityCheck = [
  query("question_text")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Question text must be at least 10 characters long"),
  query("exclude_id").optional().isInt(),
  query("college").optional().trim(),
  validate,
];

export const validateUsageByTextRequest = [
  body("question_text")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Question text must be at least 10 characters long"),
  validate,
];

