/**
 * Service for detecting duplicate and similar questions using embeddings.
 */

import crypto from "crypto";
import { pipeline } from "@xenova/transformers";

// Load similarity threshold from environment
const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || "0.85");

// Lazy load the embedding model
let embeddingModel = null;

/**
 * Get or initialize the embedding model.
 * Uses @xenova/transformers for browser/Node.js compatibility.
 *
 * @returns {Promise<Object>} The embedding model pipeline
 */
let modelLoadingPromise = null;

async function getModel() {
  if (!embeddingModel) {
    if (!modelLoadingPromise) {
      modelLoadingPromise = (async () => {
        try {
          // Use the same model as Python version: all-MiniLM-L6-v2
          console.log("Loading embedding model: all-MiniLM-L6-v2 (this may take a moment on first run)...");
          embeddingModel = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
          );
          console.log("Embedding model loaded successfully");
          return embeddingModel;
        } catch (error) {
          modelLoadingPromise = null; // Reset on error
          throw new Error(
            `Failed to load embedding model: ${error.message}. ` +
              "Please ensure @xenova/transformers is properly installed."
          );
        }
      })();
    }
    await modelLoadingPromise;
  }
  return embeddingModel;
}

/**
 * Normalize text for hashing (lowercase, strip whitespace).
 *
 * @param {string} text - Input text
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
  return text.toLowerCase().trim();
}

/**
 * Generate SHA256 hash for exact duplicate detection.
 *
 * @param {string} questionText - Question text
 * @returns {string} SHA256 hash of normalized question text
 */
export function generateHash(questionText) {
  const normalized = normalizeText(questionText);
  return crypto.createHash("sha256").update(normalized, "utf-8").digest("hex");
}

/**
 * Generate embedding vector for similarity detection.
 *
 * @param {string} questionText - Question text
 * @returns {Promise<number[]>} Embedding vector as an array
 */
export async function generateEmbedding(questionText) {
  const model = await getModel();
  const output = await model(questionText, { pooling: "mean", normalize: true });
  // Convert tensor to array
  return Array.from(output.data);
}

/**
 * Calculate cosine similarity between two vectors.
 *
 * @param {number[]} vec1 - First embedding vector
 * @param {number[]} vec2 - Second embedding vector
 * @returns {number} Cosine similarity score between 0 and 1
 */
export function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    return 0.0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0.0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Check if a question with the same hash already exists.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @param {string} questionHash - Hash of the question text
 * @param {string|null} college - Optional college name to filter by
 * @returns {Promise<Object|null>} Existing question if found, null otherwise
 */
export async function checkExactDuplicate(supabase, questionHash, college = null) {
  let query = supabase
    .from("questions")
    .select("*")
    .eq("question_hash", questionHash)
    .eq("status", "Active")
    .limit(1);

  if (college) {
    query = query.eq("college", college);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" - that's okay
    throw error;
  }

  return data || null;
}

/**
 * Find questions with similar embeddings above the threshold.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @param {number[]} embedding - Embedding vector to compare against
 * @param {number} threshold - Similarity threshold (default from env)
 * @param {number|null} excludeId - Optional question ID to exclude
 * @param {string|null} college - Optional college name to filter by
 * @returns {Promise<Array<{question: Object, score: number}>>} List of similar questions with scores
 */
export async function findSimilarQuestions(
  supabase,
  embedding,
  threshold = SIMILARITY_THRESHOLD,
  excludeId = null,
  college = null
) {
  // Get all active questions with embeddings
  let query = supabase
    .from("questions")
    .select("*")
    .eq("status", "Active")
    .not("embedding", "is", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  if (college) {
    query = query.eq("college", college);
  }

  const { data: questions, error } = await query;

  if (error) {
    throw error;
  }

  const similarQuestions = [];

  for (const question of questions || []) {
    if (question.embedding && Array.isArray(question.embedding)) {
      const similarity = cosineSimilarity(embedding, question.embedding);
      if (similarity >= threshold) {
        similarQuestions.push({ question, score: similarity });
      }
    }
  }

  // Sort by similarity score (descending)
  similarQuestions.sort((a, b) => b.score - a.score);

  return similarQuestions;
}

/**
 * Check if a question is duplicate or similar to existing questions.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @param {string} questionText - Question text to check
 * @param {number|null} excludeId - Optional question ID to exclude
 * @param {string|null} college - Optional college name to filter by
 * @returns {Promise<{isDuplicate: boolean, exactMatch: boolean, similarQuestions: Array}>}
 */
export async function checkSimilarity(
  supabase,
  questionText,
  excludeId = null,
  college = null
) {
  // Check for exact duplicate
  const questionHash = generateHash(questionText);
  const exactMatchQuestion = await checkExactDuplicate(supabase, questionHash, college);

  const exactMatch = exactMatchQuestion !== null;

  // Generate embedding for similarity check
  const embedding = await generateEmbedding(questionText);

  // Find similar questions
  const similarQuestions = await findSimilarQuestions(
    supabase,
    embedding,
    SIMILARITY_THRESHOLD,
    excludeId,
    college
  );

  // Consider it a duplicate if exact match or similar questions found
  const isDuplicate = exactMatch || similarQuestions.length > 0;

  // Include exact match in similar questions if found
  if (exactMatch && exactMatchQuestion) {
    // Check if exact match is already in similarQuestions
    const alreadyIncluded = similarQuestions.some(
      (item) => item.question.id === exactMatchQuestion.id
    );
    if (!alreadyIncluded) {
      similarQuestions.unshift({ question: exactMatchQuestion, score: 1.0 });
    }
  }

  return {
    isDuplicate,
    exactMatch,
    similarQuestions: similarQuestions.map((item) => ({
      question: item.question,
      score: item.score,
    })),
  };
}

