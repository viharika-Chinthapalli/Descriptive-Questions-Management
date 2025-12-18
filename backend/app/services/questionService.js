/**
 * Service for question CRUD operations.
 */

import {
  generateHash,
  generateEmbedding,
  checkSimilarity,
} from "./similarityService.js";
import { getSupabaseClient } from "../database.js";

/**
 * Custom error class for duplicate questions.
 */
export class DuplicateQuestionError extends Error {
  constructor(message, detail = {}) {
    super(message);
    this.name = "DuplicateQuestionError";
    this.detail = { message, ...detail };
    this.statusCode = 400;
  }

  toDetail() {
    return this.detail;
  }
}

/**
 * Create a new question in the database.
 *
 * Duplicate Detection Rules:
 * 1. Same question, same college → Raises error: "Question already exists"
 * 2. Same question, different college → Allows creation, sets usage_count to
 *    the total number of times this question has been added across all colleges
 *
 * @param {Object} questionData - Question data
 * @returns {Promise<Object>} Created question object
 * @throws {DuplicateQuestionError} If duplicate question found in the same college
 */
export async function createQuestion(questionData) {
  const supabase = getSupabaseClient();

  // Check for existing exact matches (any college)
  const questionHash = generateHash(questionData.question_text);
  const { data: existingExactAll, error: fetchError } = await supabase
    .from("questions")
    .select("*")
    .eq("question_hash", questionHash)
    .eq("status", "Active");

  if (fetchError) {
    throw fetchError;
  }

  // If an exact duplicate exists in the same college, raise an error
  const existingSameCollege = existingExactAll?.find(
    (q) => q.college === questionData.college
  );

  if (existingSameCollege) {
    throw new DuplicateQuestionError("Question already exists", {
      code: "DUPLICATE_QUESTION_SAME_COLLEGE",
      message: "Question already exists",
      college: questionData.college,
      existing_question_id: existingSameCollege.id,
    });
  }

  // If exact matches exist in other colleges, synchronize usage_count across all
  if (existingExactAll && existingExactAll.length > 0) {
    const newTotalUsage = existingExactAll.length + 1;
    // Update all existing matches to the new total usage count
    const updatePromises = existingExactAll.map((q) =>
      supabase
        .from("questions")
        .update({ usage_count: newTotalUsage })
        .eq("id", q.id)
    );
    await Promise.all(updatePromises);
  } else {
    // Check for similar questions within the same college (only if no exact duplicate exists)
    const similarityResult = await checkSimilarity(
      supabase,
      questionData.question_text,
      null,
      questionData.college
    );

    if (similarityResult.isDuplicate) {
      const similarCount = similarityResult.similarQuestions.length;
      const similarIds = similarityResult.similarQuestions
        .slice(0, 5)
        .map((item) => item.question.id);

      throw new DuplicateQuestionError(
        `Similar question(s) found in college '${questionData.college}'. ` +
          "Please review existing questions or modify your question text.",
        {
          code: "SIMILAR_QUESTION",
          college: questionData.college,
          similar_count: similarCount,
          similar_question_ids: similarIds,
        }
      );
    }
  }

  // Generate hash and embedding
  const embedding = await generateEmbedding(questionData.question_text);

  // Set usage_count:
  // - If this is the first time the question is added anywhere: 1
  // - If it already exists in other colleges: total number of occurrences
  const usageCount =
    existingExactAll && existingExactAll.length > 0
      ? existingExactAll.length + 1
      : 1;

  const newQuestion = {
    question_text: questionData.question_text,
    question_hash: questionHash,
    subject: questionData.subject,
    topic: questionData.topic || null,
    difficulty_level: questionData.difficulty_level,
    marks: questionData.marks,
    exam_type: questionData.exam_type,
    college: questionData.college,
    embedding: embedding,
    status: "Active",
    usage_count: usageCount,
  };

  const { data, error } = await supabase
    .from("questions")
    .insert([newQuestion])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get a question by ID.
 *
 * @param {number} questionId - Question ID
 * @returns {Promise<Object|null>} Question if found, null otherwise
 */
export async function getQuestion(questionId) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw error;
  }

  return data;
}

/**
 * Get all questions with optional filters.
 *
 * @param {Object} filters - Filter options
 * @param {number} filters.skip - Number of records to skip
 * @param {number} filters.limit - Maximum number of records to return
 * @param {string} [filters.subject] - Filter by subject
 * @param {string} [filters.exam_type] - Filter by exam type
 * @param {string} [filters.college] - Filter by college
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.search_text] - Search in question text
 * @returns {Promise<{questions: Array, total: number}>} List of questions and total count
 */
export async function getAllQuestions(filters = {}) {
  const supabase = getSupabaseClient();
  const {
    skip = 0,
    limit = 100,
    subject,
    exam_type,
    college,
    status,
    search_text,
  } = filters;

  let query = supabase.from("questions").select("*", { count: "exact" });

  // Apply filters
  if (subject) {
    query = query.ilike("subject", `%${subject}%`);
  }
  if (exam_type) {
    query = query.eq("exam_type", exam_type);
  }
  if (college) {
    query = query.ilike("college", `%${college}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (search_text) {
    query = query.ilike("question_text", `%${search_text}%`);
  }

  // Apply pagination
  query = query.order("created_date", { ascending: false }).range(skip, skip + limit - 1);

  const { data: questions, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    questions: questions || [],
    total: count || 0,
  };
}

/**
 * Update a question.
 *
 * @param {number} questionId - Question ID
 * @param {Object} updateData - Updated question data
 * @returns {Promise<Object|null>} Updated question if found, null otherwise
 */
export async function updateQuestion(questionId, updateData) {
  const supabase = getSupabaseClient();

  // Get existing question
  const existingQuestion = await getQuestion(questionId);
  if (!existingQuestion) {
    return null;
  }

  // If question text is updated, regenerate hash and embedding
  const updateFields = { ...updateData };
  if (updateData.question_text) {
    updateFields.question_hash = generateHash(updateData.question_text);
    updateFields.embedding = await generateEmbedding(updateData.question_text);
  }

  const { data, error } = await supabase
    .from("questions")
    .update(updateFields)
    .eq("id", questionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Permanently delete a question from the database.
 *
 * @param {number} questionId - Question ID
 * @returns {Promise<boolean>} True if question was found and deleted, False otherwise
 */
export async function deleteQuestion(questionId) {
  const supabase = getSupabaseClient();

  // Check if question exists
  const existingQuestion = await getQuestion(questionId);
  if (!existingQuestion) {
    return false;
  }

  // Delete related usage history first (cascade)
  await supabase.from("question_usage").delete().eq("question_id", questionId);

  // Delete the question
  const { error } = await supabase.from("questions").delete().eq("id", questionId);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Record that a question has been used in an exam.
 *
 * @param {number} questionId - Question ID
 * @param {Object} usageData - Usage information
 * @returns {Promise<Object>} Created usage record
 */
export async function recordQuestionUsage(questionId, usageData) {
  const supabase = getSupabaseClient();

  // Get question and verify it exists
  const question = await getQuestion(questionId);
  if (!question) {
    throw new Error(`Question with ID ${questionId} not found`);
  }

  // Create usage record
  const usageRecord = {
    question_id: questionId,
    exam_name: usageData.exam_name,
    exam_type: usageData.exam_type,
    academic_year: usageData.academic_year,
    college: usageData.college,
  };

  const { data: usage, error: usageError } = await supabase
    .from("question_usage")
    .insert([usageRecord])
    .select()
    .single();

  if (usageError) {
    throw usageError;
  }

  // Update question usage statistics
  const { error: updateError } = await supabase
    .from("questions")
    .update({
      usage_count: question.usage_count + 1,
      last_used_date: new Date().toISOString(),
    })
    .eq("id", questionId);

  if (updateError) {
    throw updateError;
  }

  return usage;
}

/**
 * Record question usage using question text instead of explicit question ID.
 *
 * @param {string} questionText - Question text to match
 * @param {Object} usageData - Usage information
 * @returns {Promise<Object>} Created usage record
 * @throws {Error} If no matching question is found for the given text
 */
export async function recordQuestionUsageByText(questionText, usageData) {
  const supabase = getSupabaseClient();

  // Find matching questions using hash
  const questionHash = generateHash(questionText);
  const { data: matchingQuestions, error: fetchError } = await supabase
    .from("questions")
    .select("*")
    .eq("question_hash", questionHash)
    .eq("status", "Active");

  if (fetchError) {
    throw fetchError;
  }

  if (!matchingQuestions || matchingQuestions.length === 0) {
    throw new Error("Question not found for the given text");
  }

  // Record usage for the first matching question
  const primaryQuestion = matchingQuestions[0];
  return await recordQuestionUsage(primaryQuestion.id, usageData);
}

/**
 * Get usage count and history for a question by its text.
 * Finds all questions with the same text (across all colleges) and aggregates their usage.
 *
 * @param {string} questionText - Question text to search for
 * @returns {Promise<Object>} Usage information including count, history, and matching questions
 */
export async function getUsageByQuestionText(questionText) {
  const supabase = getSupabaseClient();

  // Generate hash to find exact matches
  const questionHash = generateHash(questionText);

  // Find all questions with the same hash (same question text, any college)
  const { data: matchingQuestions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("question_hash", questionHash)
    .eq("status", "Active");

  if (questionsError) {
    throw questionsError;
  }

  if (!matchingQuestions || matchingQuestions.length === 0) {
    return {
      usage_count: 0,
      question_text: questionText,
      matching_questions_count: 0,
      usage_history: [],
      questions: [],
    };
  }

  // Get all question IDs for querying usage history
  const questionIds = matchingQuestions.map((q) => q.id);

  // Get combined usage history from all matching questions
  const { data: allUsageHistory, error: usageError } = await supabase
    .from("question_usage")
    .select("*")
    .in("question_id", questionIds)
    .order("date_used", { ascending: false });

  if (usageError) {
    throw usageError;
  }

  // Enrich usage history with question_text
  const enrichedUsageHistory = (allUsageHistory || []).map((usage) => {
    const usageQuestion = matchingQuestions.find((q) => q.id === usage.question_id);
    return {
      id: usage.id,
      question_id: usage.question_id,
      question_text: usageQuestion?.question_text || questionText,
      exam_name: usage.exam_name,
      exam_type: usage.exam_type,
      academic_year: usage.academic_year,
      college: usage.college,
      date_used: usage.date_used,
    };
  });

  // Get usage count (should be the same for all matching questions due to synchronization)
  const usageCount = matchingQuestions[0]?.usage_count || 0;

  return {
    usage_count: usageCount,
    question_text: questionText,
    matching_questions_count: matchingQuestions.length,
    usage_history: enrichedUsageHistory,
    questions: matchingQuestions,
  };
}

/**
 * Check if a question is duplicate or similar to existing questions.
 *
 * @param {string} questionText - Question text to check
 * @param {number|null} excludeId - Optional question ID to exclude
 * @param {string|null} college - Optional college name to filter by
 * @returns {Promise<{isDuplicate: boolean, exactMatch: boolean, similarQuestions: Array}>}
 */
export async function checkQuestionDuplicate(questionText, excludeId = null, college = null) {
  const supabase = getSupabaseClient();
  return await checkSimilarity(supabase, questionText, excludeId, college);
}

