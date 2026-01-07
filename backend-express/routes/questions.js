/**
 * Question API routes
 */

const express = require("express");
const router = express.Router();
const questionService = require("../services/questionService");

/**
 * POST /api/questions
 * Create a new question
 */
router.post("/questions", async (req, res, next) => {
  try {
    // Validate required fields
    const {
      question_text,
      subject,
      difficulty_level,
      marks,
      exam_type,
      college,
    } = req.body;

    if (!question_text || question_text.trim().length < 10) {
      return res.status(422).json({
        message: "question_text must be at least 10 characters long.",
        errors: [
          {
            field: "question_text",
            message: "question_text must be at least 10 characters long.",
            type: "value_error",
          },
        ],
      });
    }

    if (!subject || !difficulty_level || !marks || !exam_type || !college) {
      return res.status(422).json({
        message: "Missing required fields",
        errors: [
          "subject",
          "difficulty_level",
          "marks",
          "exam_type",
          "college",
        ].filter((f) => !req.body[f]),
      });
    }

    // Validate difficulty_level
    const allowedDifficulties = ["Easy", "Medium", "Hard"];
    if (!allowedDifficulties.includes(difficulty_level)) {
      return res.status(422).json({
        message: `Difficulty must be one of: ${allowedDifficulties.join(", ")}`,
      });
    }

    const question = await questionService.createQuestion(req.body);
    res.status(201).json(question);
  } catch (error) {
    if (error instanceof questionService.DuplicateQuestionError) {
      return res.status(400).json(error.detail);
    }
    next(error);
  }
});

/**
 * GET /api/questions
 * Get all questions with optional filters
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

    const filters = {
      skip: parseInt(skip),
      limit: parseInt(limit),
      subject,
      exam_type,
      college,
      status,
      search_text,
    };

    const { questions, total } = await questionService.getAllQuestions(filters);
    const page = Math.floor(filters.skip / filters.limit) + 1;

    res.json({
      questions,
      total,
      page,
      page_size: filters.limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/questions/check-similarity
 * Check if a question is duplicate or similar
 * NOTE: This route must be defined BEFORE /questions/:id to avoid route conflicts
 */
router.get("/questions/check-similarity", async (req, res, next) => {
  try {
    // Debug logging
    console.log("[check-similarity] Request received:", {
      method: req.method,
      url: req.url,
      query: req.query,
      queryKeys: Object.keys(req.query || {}),
      rawQuery: req.url.split("?")[1],
    });

    const { question_text, exclude_id, college } = req.query;

    // Validate question_text exists
    if (!question_text) {
      console.error(
        "[check-similarity] Missing question_text parameter. Query:",
        req.query
      );
      return res.status(400).json({
        message: "question_text parameter is required.",
        hint: "Please provide a question_text query parameter.",
        received_query: req.query,
        query_keys: Object.keys(req.query || {}),
      });
    }

    // URL decode the question text if needed - handle encoding errors gracefully
    let decodedQuestionText = question_text;
    if (question_text) {
      try {
        // Try decoding - if it's already decoded, this will work fine
        decodedQuestionText = decodeURIComponent(question_text);
      } catch (decodeError) {
        // If decoding fails, the text might already be decoded or have encoding issues
        // Try using the original text, but replace + with spaces (common URL encoding issue)
        console.warn(
          "Failed to decode question_text, attempting to fix:",
          decodeError.message
        );
        decodedQuestionText = question_text.replace(/\+/g, " ");
      }
    }

    // Trim and validate length
    const trimmedText = decodedQuestionText ? decodedQuestionText.trim() : "";
    if (!trimmedText || trimmedText.length < 10) {
      return res.status(422).json({
        message: "question_text must be at least 10 characters long.",
        received_length: trimmedText.length,
        hint: "Please provide a question text with at least 10 characters.",
      });
    }

    // Parse and validate exclude_id - handle empty strings, null strings, etc.
    let excludeId = null;
    if (
      exclude_id &&
      exclude_id !== "" &&
      exclude_id !== "null" &&
      exclude_id !== "undefined"
    ) {
      const parsed = parseInt(exclude_id, 10);
      if (!isNaN(parsed) && parsed > 0) {
        excludeId = parsed;
      } else {
        // Don't return error for invalid exclude_id - just ignore it and log
        console.warn(
          `Invalid exclude_id provided: "${exclude_id}", ignoring it`
        );
        excludeId = null;
      }
    }

    try {
      const result = await questionService.checkQuestionDuplicate(
        trimmedText,
        excludeId,
        college
      );

      // Extract questions and scores from tuples
      // Handle case where similarQuestions might be empty or undefined
      const similarQuestions = result.similarQuestions || [];

      // Validate result structure
      if (!Array.isArray(similarQuestions)) {
        console.error(
          "Invalid similarQuestions format:",
          typeof similarQuestions,
          similarQuestions
        );
        return res.status(500).json({
          message: "Error processing similarity results",
          error: "Invalid data format returned from similarity service",
        });
      }

      // Debug logging (remove in production)
      if (similarQuestions.length > 0) {
        console.log(
          "Similar questions structure:",
          JSON.stringify(similarQuestions[0], null, 2)
        );
        console.log("Total similar questions found:", similarQuestions.length);
      }

      const questions = similarQuestions
        .map((item, index) => {
          try {
            // Handle tuple format [question, score]
            let q, score;
            if (Array.isArray(item)) {
              [q, score] = item;
            } else if (item && typeof item === "object" && item.question) {
              // Handle object format {question, similarity}
              q = item.question;
              score = item.similarity;
            } else {
              console.warn(`Invalid question format at index ${index}:`, item);
              return null;
            }

            // Ensure question object is valid and has all required fields
            if (!q || typeof q !== "object") {
              console.warn(`Invalid question object at index ${index}:`, q);
              return null;
            }

            // Validate and normalize ID - be very lenient, use positive fallback IDs
            let questionId = q.id;

            // If ID is missing, use a high positive number as fallback
            if (questionId === undefined || questionId === null) {
              console.warn(
                `Question missing ID at index ${index}, using fallback. Question:`,
                q.question_text?.substring(0, 50)
              );
              questionId = 999999 + index; // Use high positive number
            } else {
              // Convert string IDs to numbers if needed
              if (typeof questionId === "string") {
                const parsed = parseInt(questionId, 10);
                if (!isNaN(parsed) && parsed > 0) {
                  questionId = parsed;
                } else {
                  questionId = 999999 + index; // Fallback if parse fails
                }
              }

              // If ID is still invalid, use fallback instead of rejecting
              if (
                typeof questionId !== "number" ||
                isNaN(questionId) ||
                questionId <= 0
              ) {
                console.warn(
                  `Question has invalid ID at index ${index}, using fallback. ID value: ${q.id}, parsed: ${questionId}`
                );
                questionId = 999999 + index;
              }
            }

            // Validate question_text exists - this is the only truly required field
            if (!q.question_text || typeof q.question_text !== "string") {
              console.warn(
                `Question missing question_text at index ${index}:`,
                q
              );
              return null;
            }

            // Return a clean question object with all fields - provide defaults for missing fields
            const questionObj = {
              id: questionId, // Always a valid positive number
              question_text: q.question_text,
              question_hash: q.question_hash || null,
              subject: q.subject || "Unknown",
              topic: q.topic || null,
              difficulty_level: q.difficulty_level || "Medium",
              marks: q.marks || 0,
              exam_type: q.exam_type || "Unknown",
              college: q.college || "Unknown",
              created_date: q.created_date || new Date().toISOString(),
              usage_count: q.usage_count || 0,
              last_used_date: q.last_used_date || null,
              status: q.status || "Active",
            };

            return questionObj;
          } catch (err) {
            console.error(`Error processing question at index ${index}:`, err);
            return null; // Skip this question but continue with others
          }
        })
        .filter((q) => q !== null); // Remove any null entries

      // Map scores to match the filtered questions array
      // Extract scores for all items first
      const allScores = similarQuestions.map((item) => {
        if (Array.isArray(item)) {
          return item[1]; // Get score from tuple [question, score]
        } else if (
          item &&
          typeof item === "object" &&
          item.similarity !== undefined
        ) {
          return item.similarity;
        }
        return null;
      });

      // Build scores array matching only valid questions (same filtering logic as questions)
      const scores = [];
      for (let i = 0; i < similarQuestions.length; i++) {
        const item = similarQuestions[i];
        let q;
        if (Array.isArray(item)) {
          [q] = item;
        } else if (item && typeof item === "object" && item.question) {
          q = item.question;
        } else {
          continue; // Skip invalid items
        }

        // Same validation as in the questions map function - be lenient
        if (!q || typeof q !== "object") continue;
        if (!q.question_text || typeof q.question_text !== "string") continue;

        // Check if question would be included (same logic as questions array)
        let questionId = q.id;
        let isValid = true;
        if (questionId === undefined || questionId === null) {
          isValid = true; // Will use fallback ID
        } else {
          if (typeof questionId === "string") {
            questionId = parseInt(questionId, 10);
          }
          if (
            typeof questionId !== "number" ||
            isNaN(questionId) ||
            questionId <= 0
          ) {
            isValid = true; // Will use fallback ID
          }
        }

        // This question is valid, add its score
        if (isValid) {
          scores.push(allScores[i]);
        }
      }

      // Ensure arrays match
      if (questions.length !== scores.length) {
        console.warn(
          `Warning: ${questions.length} questions but ${scores.length} scores. Trimming to match.`
        );
        // Trim scores to match questions length
        scores.splice(questions.length);
      }

      // Log final response structure for debugging
      console.log(
        `Returning ${questions.length} similar questions with IDs:`,
        questions.map((q) => (q ? q.id : "null"))
      );
      console.log(`Matching ${scores.length} similarity scores`);

      // Final validation before sending response
      if (!Array.isArray(questions)) {
        console.error("Questions is not an array:", questions);
        return res.status(500).json({
          message: "Error processing similarity results",
          error: "Invalid questions array format",
        });
      }

      // Log what we're about to return for debugging
      console.log("Final questions array length:", questions.length);
      console.log("Final scores array length:", scores.length);
      if (questions.length > 0) {
        console.log(
          "First question ID:",
          questions[0]?.id,
          "Type:",
          typeof questions[0]?.id
        );
      }

      // Ensure questions array is always returned, even if empty
      // Don't fail on ID validation - questions with fallback IDs are still valid
      const response = {
        is_duplicate: result.isDuplicate || false,
        exact_match: result.exactMatch || false,
        similar_questions: questions || [],
        similarity_scores: scores || [],
      };

      console.log("Sending response:", {
        is_duplicate: response.is_duplicate,
        exact_match: response.exact_match,
        similar_questions_count: response.similar_questions.length,
        similarity_scores_count: response.similarity_scores.length,
      });

      res.json(response);
    } catch (serviceError) {
      console.error("Error in checkQuestionDuplicate:", serviceError);
      console.error("Error stack:", serviceError.stack);
      return res.status(500).json({
        message: "Error checking similarity",
        error: serviceError.message,
        ...(process.env.NODE_ENV === "development" && {
          stack: serviceError.stack,
        }),
      });
    }
  } catch (error) {
    console.error("Error in check-similarity route:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });

    // If it's a URI-related error, return a more helpful message
    if (error.message && error.message.includes("URI")) {
      return res.status(400).json({
        message: "Invalid question text encoding.",
        error: "The question text contains invalid characters or encoding.",
        hint: "Please ensure the question text is properly formatted.",
      });
    }

    // For other errors, pass to error handler
    next(error);
  }
});

/**
 * GET /api/questions/:id
 * Get question by ID
 */
router.get("/questions/:id", async (req, res, next) => {
  try {
    // Debug logging to identify route matching issues
    console.log("[GET /questions/:id] Route matched:", {
      method: req.method,
      url: req.url,
      params: req.params,
      id_param: req.params.id,
    });

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      console.error("[GET /questions/:id] Invalid ID received:", req.params.id);
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const question = await questionService.getQuestion(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/questions/:id
 * Update a question
 */
router.put("/questions/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    // Validate difficulty_level if provided
    if (req.body.difficulty_level) {
      const allowedDifficulties = ["Easy", "Medium", "Hard"];
      if (!allowedDifficulties.includes(req.body.difficulty_level)) {
        return res.status(422).json({
          message: `Difficulty must be one of: ${allowedDifficulties.join(
            ", "
          )}`,
        });
      }
    }

    // Validate status if provided
    if (req.body.status) {
      const allowedStatuses = ["Active", "Blocked", "Archived"];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(422).json({
          message: `Status must be one of: ${allowedStatuses.join(", ")}`,
        });
      }
    }

    const question = await questionService.updateQuestion(id, req.body);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/questions/:id
 * Delete a question
 */
router.delete("/questions/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const success = await questionService.deleteQuestion(id);
    if (!success) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({
      message: "Question permanently deleted successfully",
      question_id: id,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/questions/usage-by-text
 * Record question usage by question text
 */
router.post("/questions/usage-by-text", async (req, res, next) => {
  try {
    const { question_text, exam_name, exam_type, academic_year, college } =
      req.body;

    if (!question_text || question_text.trim().length < 10) {
      return res.status(422).json({
        message: "question_text must be at least 10 characters long.",
        hint: "Please provide the full question text (not a numeric ID).",
      });
    }

    if (!exam_name || !exam_type || !academic_year || !college) {
      return res.status(422).json({
        message:
          "Missing required fields: exam_name, exam_type, academic_year, college",
      });
    }

    const usage = await questionService.recordQuestionUsageByText(
      question_text,
      {
        exam_name,
        exam_type,
        academic_year,
        college,
      }
    );

    // Enrich response with question_text
    const usageResponse = {
      ...usage,
      question_text: question_text.trim(),
    };

    res.status(201).json(usageResponse);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: error.message,
        error: "QUESTION_NOT_FOUND",
        hint: "No question found matching the provided text. Please check the question text.",
      });
    }
    next(error);
  }
});

/**
 * POST /api/questions/usage-by-text/search
 * Get usage count and history by question text
 */
router.post("/questions/usage-by-text/search", async (req, res, next) => {
  try {
    const { question_text } = req.body;

    if (
      !question_text ||
      typeof question_text !== "string" ||
      question_text.trim().length < 10
    ) {
      return res.status(422).json({
        message:
          "question_text must be a non-empty string with at least 10 characters.",
        hint: "For Question Usage History, provide the question text (not a numeric ID).",
        errors: [
          {
            field: "question_text",
            message:
              "question_text must be a non-empty string with at least 10 characters.",
            type: "value_error",
          },
        ],
      });
    }

    const result = await questionService.getUsageByQuestionText(
      question_text.trim()
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/questions/usage-by-text
 * Get usage by question text (legacy GET endpoint)
 */
router.get("/questions/usage-by-text", async (req, res, next) => {
  try {
    const question_text = decodeURIComponent(
      req.query.question_text || ""
    ).trim();

    if (!question_text || question_text.length < 10) {
      return res.status(422).json({
        message: "question_text must be at least 10 characters long.",
        hint: "Please provide the full question text.",
      });
    }

    const result = await questionService.getUsageByQuestionText(question_text);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Log route registration order for debugging
console.log("[Routes] Registered routes in order:");
console.log("  1. POST /questions");
console.log("  2. GET /questions");
console.log(
  "  3. GET /questions/check-similarity (specific route - must be before :id)"
);
console.log("  4. GET /questions/:id (parameterized route)");
console.log("  5. PUT /questions/:id");
console.log("  6. DELETE /questions/:id");
console.log("  7. POST /questions/usage-by-text");
console.log("  8. POST /questions/usage-by-text/search");
console.log("  9. GET /questions/usage-by-text");

module.exports = router;
