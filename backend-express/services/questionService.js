/**
 * Question service - handles business logic for questions
 */

const storage = require('./storage');
const similarity = require('./similarity');

class DuplicateQuestionError extends Error {
  constructor(message, detail = {}) {
    super(message);
    this.detail = { message, ...detail };
  }
}

/**
 * Create a new question
 */
async function createQuestion(questionData) {
  const questions = await storage.getAllQuestions();
  const questionHash = similarity.generateHash(questionData.question_text);
  
  // Check for existing exact matches (any college)
  const existingExactAll = questions.filter(
    q => q.question_hash === questionHash && q.status === 'Active'
  );
  
  // If exact duplicate exists in same college, raise error
  const existingSameCollege = existingExactAll.find(q => q.college === questionData.college);
  if (existingSameCollege) {
    throw new DuplicateQuestionError('Question already exists', {
      code: 'DUPLICATE_QUESTION_SAME_COLLEGE',
      college: questionData.college,
      existing_question_id: existingSameCollege.id
    });
  }
  
  // If exact matches exist in other colleges, synchronize usage_count
  if (existingExactAll.length > 0) {
    const newTotalUsage = existingExactAll.length + 1;
    for (const q of existingExactAll) {
      await storage.updateQuestion(q.id, { usage_count: newTotalUsage });
    }
  } else {
    // Check for similar questions within the same college
    const { isDuplicate, similarQuestions } = similarity.checkSimilarity(
      questions,
      questionData.question_text,
      null,
      questionData.college
    );
    
    if (isDuplicate && similarQuestions.length > 0) {
      const similarCount = similarQuestions.length;
      const similarIds = similarQuestions.slice(0, 5).map(([q]) => q.id);
      throw new DuplicateQuestionError(
        `Similar question(s) found in college '${questionData.college}'. Please review existing questions or modify your question text.`,
        {
          code: 'SIMILAR_QUESTION',
          college: questionData.college,
          similar_count: similarCount,
          similar_question_ids: similarIds
        }
      );
    }
  }
  
  // Set usage_count
  const usageCount = existingExactAll.length > 0 ? existingExactAll.length + 1 : 1;
  
  // Create question
  const newQuestion = await storage.addQuestion({
    question_text: questionData.question_text,
    question_hash: questionHash,
    subject: questionData.subject,
    topic: questionData.topic,
    difficulty_level: questionData.difficulty_level,
    marks: questionData.marks,
    exam_type: questionData.exam_type,
    college: questionData.college,
    usage_count: usageCount,
    status: 'Active'
  });
  
  return newQuestion;
}

/**
 * Get question by ID
 */
async function getQuestion(id) {
  return await storage.getQuestionById(id);
}

/**
 * Get all questions with filters
 */
async function getAllQuestions(filters = {}) {
  let questions = await storage.getAllQuestions();
  
  // Apply filters - only filter if value is provided and not empty
  if (filters.subject && filters.subject.trim()) {
    const subjectLower = filters.subject.trim().toLowerCase();
    questions = questions.filter(q => q.subject && q.subject.toLowerCase().includes(subjectLower));
  }
  if (filters.exam_type && filters.exam_type.trim()) {
    questions = questions.filter(q => q.exam_type === filters.exam_type.trim());
  }
  if (filters.college && filters.college.trim()) {
    const collegeLower = filters.college.trim().toLowerCase();
    questions = questions.filter(q => q.college && q.college.toLowerCase().includes(collegeLower));
  }
  if (filters.status && filters.status.trim()) {
    questions = questions.filter(q => q.status === filters.status.trim());
  }
  if (filters.search_text && filters.search_text.trim()) {
    const searchLower = filters.search_text.trim().toLowerCase();
    questions = questions.filter(q => 
      q.question_text && q.question_text.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by created_date (descending)
  questions.sort((a, b) => {
    const dateA = new Date(a.created_date || 0);
    const dateB = new Date(b.created_date || 0);
    return dateB - dateA;
  });
  
  // Apply pagination
  const skip = parseInt(filters.skip) || 0;
  const limit = parseInt(filters.limit) || 100;
  const total = questions.length;
  const paginatedQuestions = questions.slice(skip, skip + limit);
  
  return {
    questions: paginatedQuestions,
    total
  };
}

/**
 * Update a question
 */
async function updateQuestion(id, updates) {
  const question = await storage.getQuestionById(id);
  if (!question) {
    return null;
  }
  
  const updateData = { ...updates };
  
  // If question text is updated, regenerate hash
  if (updates.question_text) {
    updateData.question_hash = similarity.generateHash(updates.question_text);
  }
  
  return await storage.updateQuestion(id, updateData);
}

/**
 * Delete a question
 */
async function deleteQuestion(id) {
  return await storage.deleteQuestion(id);
}

/**
 * Check question duplicate/similarity
 */
async function checkQuestionDuplicate(questionText, excludeId = null, college = null) {
  try {
    const questions = await storage.getAllQuestions();
    
    if (!questions || questions.length === 0) {
      return {
        isDuplicate: false,
        exactMatch: false,
        similarQuestions: []
      };
    }
    
    const result = similarity.checkSimilarity(
      questions,
      questionText,
      excludeId,
      college
    );
    
    return {
      isDuplicate: result.isDuplicate,
      exactMatch: result.exactMatch,
      similarQuestions: result.similarQuestions || []
    };
  } catch (error) {
    console.error('Error in checkQuestionDuplicate:', error);
    throw error;
  }
}

/**
 * Record question usage by question ID
 */
async function recordQuestionUsage(questionId, usageData) {
  const question = await storage.getQuestionById(questionId);
  if (!question) {
    throw new Error(`Question with ID ${questionId} not found`);
  }
  
  const usage = await storage.addUsageRecord({
    question_id: questionId,
    exam_name: usageData.exam_name,
    exam_type: usageData.exam_type,
    academic_year: usageData.academic_year,
    college: usageData.college
  });
  
  return usage;
}

/**
 * Record question usage by question text
 */
async function recordQuestionUsageByText(questionText, usageData) {
  const questions = await storage.getAllQuestions();
  const questionHash = similarity.generateHash(questionText);
  
  const matchingQuestions = questions.filter(
    q => q.question_hash === questionHash && q.status === 'Active'
  );
  
  if (matchingQuestions.length === 0) {
    throw new Error('Question not found for the given text');
  }
  
  // Record usage for the first matching question
  return await recordQuestionUsage(matchingQuestions[0].id, usageData);
}

/**
 * Get usage by question text
 */
async function getUsageByQuestionText(questionText) {
  return await storage.getUsageByQuestionText(questionText);
}

module.exports = {
  createQuestion,
  getQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  checkQuestionDuplicate,
  recordQuestionUsage,
  recordQuestionUsageByText,
  getUsageByQuestionText,
  DuplicateQuestionError
};

