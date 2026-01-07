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
  
  // If exact matches exist in other colleges, we'll update their counts
  // after recording usage for the new question
  if (existingExactAll.length > 0) {
    // Check if this college already has this question
    const existingInThisCollege = existingExactAll.find(
      q => q.college === questionData.college
    );
    if (existingInThisCollege) {
      // This should not happen due to earlier check, but just in case
      throw new DuplicateQuestionError('Question already exists', {
        code: 'DUPLICATE_QUESTION_SAME_COLLEGE',
        college: questionData.college,
        existing_question_id: existingInThisCollege.id
      });
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
  
  // Create question with initial usage_count of 0 (will be updated to 1 when usage is recorded)
  const newQuestion = await storage.addQuestion({
    question_text: questionData.question_text,
    question_hash: questionHash,
    subject: questionData.subject,
    unit_name: questionData.unit_name || questionData.topic || null, // Support both unit_name and topic for backward compatibility
    topic: questionData.topic || questionData.unit_name || null, // Keep topic for backward compatibility
    academic_year: questionData.academic_year || null,
    difficulty_level: questionData.difficulty_level,
    marks: questionData.marks,
    exam_type: questionData.exam_type,
    college: questionData.college,
    usage_count: 0, // Will be updated to 1 when usage is recorded
    status: 'Active'
  });
  
  // Automatically record usage when question is added
  // This will set the question's usage_count to 1 (used once in its specific college)
  // The total usage count across all colleges is calculated in getUsageByQuestionText
  // Usage is recorded with the college from the question data
  let usageRecord = null;
  
  // Verify question was saved before creating usage record
  const verifyQuestion = await storage.getQuestionById(newQuestion.id);
  if (!verifyQuestion) {
    console.error('[createQuestion] CRITICAL: Question not found after creation:', newQuestion.id);
    throw new Error('Question was not saved properly');
  }
  
  try {
    console.log('[createQuestion] Recording usage for new question:', {
      question_id: newQuestion.id,
      college: questionData.college,
      exam_type: questionData.exam_type,
      academic_year: questionData.academic_year
    });
    
    usageRecord = await storage.addUsageRecord({
      question_id: newQuestion.id,
      exam_name: null, // Not used when question is added
      exam_type: questionData.exam_type || null,
      academic_year: questionData.academic_year || null, // Use academic_year from question
      college: questionData.college
    });
    
    console.log('[createQuestion] Usage record created successfully:', {
      id: usageRecord.id,
      question_id: usageRecord.question_id,
      college: usageRecord.college,
      academic_year: usageRecord.academic_year
    });
    
    // Verify the usage record was actually created and saved
    const verifyData = await storage.readData();
    const verifyUsage = verifyData.usageHistory.find(
      u => u.question_id === newQuestion.id && u.college === questionData.college
    );
    if (!verifyUsage) {
      throw new Error('Usage record was not saved to data.json');
    }
    console.log('[createQuestion] Verified usage record exists in data:', verifyUsage.id);
  } catch (error) {
    console.error('[createQuestion] ERROR: Failed to create usage record:', error);
    console.error('[createQuestion] Error details:', {
      message: error.message,
      stack: error.stack,
      question_id: newQuestion.id
    });
    
    // Fallback: Create usage record directly
    try {
      console.log('[createQuestion] Attempting fallback: creating usage record directly');
      const data = await storage.readData();
      
      // Verify question exists
      const question = data.questions.find(q => q.id === newQuestion.id);
      if (!question) {
        throw new Error(`Question ${newQuestion.id} not found in data`);
      }
      
      // Check if usage record already exists
      const existingUsage = data.usageHistory.find(
        u => u.question_id === newQuestion.id && u.college === questionData.college
      );
      
      if (!existingUsage) {
        const fallbackUsage = {
          id: data.nextUsageId++,
          question_id: newQuestion.id,
          exam_name: null,
          exam_type: questionData.exam_type || null,
          academic_year: questionData.academic_year || null,
          college: questionData.college,
          date_used: newQuestion.created_date || new Date().toISOString()
        };
        
        data.usageHistory.push(fallbackUsage);
        
        // Update question usage_count to 1 (used once in its specific college)
        question.usage_count = 1;
        question.last_used_date = fallbackUsage.date_used;
        
        await storage.writeData(data);
        
        // Verify it was saved
        const verifyData = await storage.readData();
        const verifyUsage = verifyData.usageHistory.find(
          u => u.id === fallbackUsage.id
        );
        if (!verifyUsage) {
          throw new Error('Fallback usage record was not saved');
        }
        
        console.log('[createQuestion] Fallback: Usage record created and verified:', fallbackUsage.id);
        usageRecord = fallbackUsage;
      } else {
        console.log('[createQuestion] Fallback: Usage record already exists');
        usageRecord = existingUsage;
      }
    } catch (fallbackError) {
      console.error('[createQuestion] CRITICAL: Fallback also failed:', fallbackError);
      console.error('[createQuestion] Fallback error:', fallbackError.message);
      console.error('[createQuestion] Fallback stack:', fallbackError.stack);
      // Question is created, but usage record failed - will be auto-created on search via getUsageByQuestionText
      // Don't throw - let the question be created, usage will be auto-created when searched
    }
  }
  
  // Reload the question to get updated usage_count
  const updatedQuestion = await storage.getQuestionById(newQuestion.id);
  
  console.log('[createQuestion] Final question:', {
    id: updatedQuestion.id,
    usage_count: updatedQuestion.usage_count,
    college: updatedQuestion.college,
    hasUsageRecord: usageRecord !== null
  });
  
  return updatedQuestion;
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

