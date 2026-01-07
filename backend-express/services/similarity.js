/**
 * Similarity detection service
 * Uses string similarity algorithms for duplicate detection
 */

const crypto = require('crypto');
const stringSimilarity = require('string-similarity');

const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.85');

/**
 * Normalize text for hashing (lowercase, strip whitespace)
 */
function normalizeText(text) {
  return text.toLowerCase().trim();
}

/**
 * Generate SHA256 hash for exact duplicate detection
 */
function generateHash(questionText) {
  const normalized = normalizeText(questionText);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * Check for exact duplicate using hash
 * Returns all exact matches if college is not specified, or matches in specific college if college is provided
 */
function checkExactDuplicate(questions, questionHash, college = null) {
  const filtered = questions.filter(
    q => q && 
        q.question_hash === questionHash && 
        q.status === 'Active' &&
        q.id && 
        typeof q.id === 'number' && 
        !isNaN(q.id) && 
        q.id > 0
  );
  
  if (college) {
    // If college is specified, return matches in that college only
    return filtered.find(q => q.college === college) || null;
  }
  
  // If no college specified, return first match (or all matches can be handled by caller)
  return filtered.length > 0 ? filtered[0] : null;
}

/**
 * Get all exact duplicates (for similarity check when college filter is not applied)
 */
function getAllExactDuplicates(questions, questionHash, college = null) {
  const filtered = questions.filter(
    q => q && 
        q.question_hash === questionHash && 
        q.status === 'Active' &&
        q.id && 
        typeof q.id === 'number' && 
        !isNaN(q.id) && 
        q.id > 0
  );
  
  if (college) {
    return filtered.filter(q => q.college === college);
  }
  
  return filtered;
}

/**
 * Find similar questions using string similarity
 */
function findSimilarQuestions(questions, questionText, excludeId = null, college = null) {
  const filtered = questions.filter(q => {
    // Validate question object has required fields
    if (!q || !q.id || typeof q.id !== 'number' || isNaN(q.id) || q.id <= 0) return false;
    if (q.status !== 'Active') return false;
    if (excludeId && q.id === excludeId) return false;
    if (college && q.college !== college) return false;
    return true;
  });
  
  const similar = [];
  
  for (const question of filtered) {
    const similarity = stringSimilarity.compareTwoStrings(
      normalizeText(questionText),
      normalizeText(question.question_text)
    );
    
    if (similarity >= SIMILARITY_THRESHOLD) {
      similar.push({ question, similarity });
    }
  }
  
  // Sort by similarity (descending)
  similar.sort((a, b) => b.similarity - a.similarity);
  
  return similar.map(item => [item.question, item.similarity]);
}

/**
 * Check if a question is duplicate or similar
 */
function checkSimilarity(questions, questionText, excludeId = null, college = null) {
  // Ensure questions is an array
  if (!Array.isArray(questions)) {
    return {
      isDuplicate: false,
      exactMatch: false,
      similarQuestions: []
    };
  }
  
  const questionHash = generateHash(questionText);
  
  // Get all exact matches (not just one)
  const exactMatches = getAllExactDuplicates(questions, questionHash, college);
  const exactMatchFound = exactMatches.length > 0;
  
  // For backward compatibility, also get single exact match
  const exactMatch = exactMatches.length > 0 ? exactMatches[0] : null;
  
  // Find similar questions (excluding exact matches to avoid duplicates)
  const similarQuestions = findSimilarQuestions(questions, questionText, excludeId, college);
  
  // Ensure similarQuestions is always an array
  const similarQuestionsArray = Array.isArray(similarQuestions) ? similarQuestions : [];
  
  // Include all exact matches in similar questions if found
  // Add them at the beginning with 1.0 similarity score
  if (exactMatchFound && exactMatches.length > 0) {
    for (const exactQ of exactMatches) {
      // Skip if this exact match should be excluded
      if (excludeId && exactQ.id === excludeId) {
        continue;
      }
      
      // Check if already included in similar questions
      const alreadyIncluded = similarQuestionsArray.some(([q]) => q && q.id === exactQ.id);
      if (!alreadyIncluded) {
        similarQuestionsArray.unshift([exactQ, 1.0]);
      }
    }
  }
  
  const isDuplicate = exactMatchFound || similarQuestionsArray.length > 0;
  
  return {
    isDuplicate,
    exactMatch: exactMatchFound,
    similarQuestions: similarQuestionsArray
  };
}

module.exports = {
  generateHash,
  checkExactDuplicate,
  getAllExactDuplicates,
  findSimilarQuestions,
  checkSimilarity,
  normalizeText
};

