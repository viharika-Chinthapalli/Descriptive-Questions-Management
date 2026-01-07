/**
 * JSON file storage service
 * Handles reading and writing to the data.json file
 */

const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/data.json");

/**
 * Initialize data file if it doesn't exist
 */
async function initializeDataFile() {
  try {
    const dataDir = path.dirname(DATA_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    try {
      await fs.access(DATA_FILE);
      // File exists, verify it's valid JSON
      const content = await fs.readFile(DATA_FILE, "utf8");
      JSON.parse(content);
    } catch (err) {
      // File doesn't exist or invalid JSON, create with default structure
      const defaultData = {
        questions: [],
        usageHistory: [],
        nextQuestionId: 1,
        nextUsageId: 1,
      };
      await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
  } catch (error) {
    console.error("Error initializing data file:", error);
    throw error;
  }
}

/**
 * Read data from JSON file
 */
async function readData() {
  try {
    await initializeDataFile();
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading data file:", error);
    throw new Error("Failed to read data file");
  }
}

/**
 * Write data to JSON file
 */
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data file:", error);
    throw new Error("Failed to write data file");
  }
}

/**
 * Get all questions
 */
async function getAllQuestions() {
  const data = await readData();
  return data.questions || [];
}

/**
 * Get question by ID
 */
async function getQuestionById(id) {
  const data = await readData();
  return data.questions.find((q) => q.id === id) || null;
}

/**
 * Add a new question
 */
async function addQuestion(question) {
  const data = await readData();
  const newQuestion = {
    ...question,
    id: data.nextQuestionId++,
    created_date: new Date().toISOString(),
    usage_count: question.usage_count || 0,
    last_used_date: question.last_used_date || null,
    status: question.status || "Active",
  };
  data.questions.push(newQuestion);
  await writeData(data);
  return newQuestion;
}

/**
 * Update a question
 */
async function updateQuestion(id, updates) {
  const data = await readData();
  const index = data.questions.findIndex((q) => q.id === id);
  if (index === -1) {
    return null;
  }
  data.questions[index] = {
    ...data.questions[index],
    ...updates,
  };
  await writeData(data);
  return data.questions[index];
}

/**
 * Delete a question
 */
async function deleteQuestion(id) {
  const data = await readData();
  const index = data.questions.findIndex((q) => q.id === id);
  if (index === -1) {
    return false;
  }
  data.questions.splice(index, 1);
  // Also delete related usage history
  data.usageHistory = data.usageHistory.filter((u) => u.question_id !== id);
  await writeData(data);
  return true;
}

/**
 * Get all usage history
 */
async function getAllUsageHistory() {
  const data = await readData();
  return data.usageHistory || [];
}

/**
 * Add usage record
 * Tracks unique colleges per question - count is based on unique colleges, not total records
 */
async function addUsageRecord(usage) {
  const data = await readData();
  
  console.log('[addUsageRecord] Called with:', {
    question_id: usage.question_id,
    college: usage.college,
    exam_type: usage.exam_type
  });
  
  // Find the question
  const question = data.questions.find((q) => q.id === usage.question_id);
  if (!question) {
    console.error('[addUsageRecord] Question not found:', usage.question_id);
    throw new Error(`Question with ID ${usage.question_id} not found`);
  }

  console.log('[addUsageRecord] Found question:', {
    id: question.id,
    college: question.college,
    current_usage_count: question.usage_count
  });

  // Check if this college has already used this question
  const existingUsageForCollege = data.usageHistory.find(
    (u) => u.question_id === usage.question_id && u.college === usage.college
  );

  // Only create usage record if this college hasn't used it before
  let newUsage = null;
  if (!existingUsageForCollege) {
    newUsage = {
      ...usage,
      id: data.nextUsageId++,
      date_used: new Date().toISOString(),
    };
    data.usageHistory.push(newUsage);
    console.log('[addUsageRecord] Created new usage record:', {
      id: newUsage.id,
      question_id: newUsage.question_id,
      college: newUsage.college,
      date_used: newUsage.date_used
    });
  } else {
    // College already used this question, just update the date
    existingUsageForCollege.date_used = new Date().toISOString();
    newUsage = existingUsageForCollege;
    console.log('[addUsageRecord] Updated existing usage record:', {
      id: newUsage.id,
      question_id: newUsage.question_id,
      college: newUsage.college
    });
  }

  // Each question's usage_count should be 1 (used once in its specific college)
  // The total usage count across all colleges is calculated in getUsageByQuestionText
  question.usage_count = 1;
  question.last_used_date = newUsage.date_used;
  
  // Note: We don't update other matching questions' counts here
  // Each question maintains its own usage_count (typically 1 per college)
  // The total count across all colleges is calculated in getUsageByQuestionText

  console.log('[addUsageRecord] Before writing data:', {
    usageHistoryCount: data.usageHistory.length,
    newUsageId: newUsage.id,
    questionUsageCount: question.usage_count,
    questionId: question.id,
    college: question.college
  });

  await writeData(data);
  
  // Verify the data was written correctly
  const verifyData = await readData();
  const verifyUsage = verifyData.usageHistory.find(u => u.id === newUsage.id);
  if (!verifyUsage) {
    console.error('[addUsageRecord] CRITICAL: Usage record was not saved!', {
      expectedId: newUsage.id,
      usageHistoryCount: verifyData.usageHistory.length
    });
    throw new Error('Usage record was not saved to data.json');
  }
  
  console.log('[addUsageRecord] Data written and verified successfully:', {
    usageId: verifyUsage.id,
    questionId: verifyUsage.question_id,
    college: verifyUsage.college
  });
  
  return newUsage;
}

/**
 * Get usage history by question ID
 */
async function getUsageByQuestionId(questionId) {
  const data = await readData();
  return data.usageHistory.filter((u) => u.question_id === questionId);
}

/**
 * Get usage history by question text (finds all matching questions)
 * Returns TOTAL usage count as number of unique colleges (e.g., 2 colleges = count 2)
 * Each individual question's usage_count is 1 (used once in its specific college)
 * If questions exist but have no usage records, creates them automatically
 */
async function getUsageByQuestionText(questionText) {
  const data = await readData();
  const questionHash = require("./similarity").generateHash(questionText);

  // Find all questions with matching hash
  const matchingQuestions = data.questions.filter(
    (q) => q.question_hash === questionHash && q.status === "Active"
  );

  if (matchingQuestions.length === 0) {
    return {
      usage_count: 0,
      question_text: questionText,
      matching_questions_count: 0,
      usage_history: [],
      questions: [],
      unique_colleges: [],
    };
  }

  const questionIds = matchingQuestions.map((q) => q.id);
  let usageHistory = data.usageHistory.filter((u) =>
    questionIds.includes(u.question_id)
  );

  // If questions exist but have no usage records, create them automatically
  // This handles questions created before automatic usage tracking was implemented
  let needsUpdate = false;
  console.log('[getUsageByQuestionText] Checking for missing usage records:', {
    matchingQuestionsCount: matchingQuestions.length,
    existingUsageHistoryCount: usageHistory.length
  });
  
  for (const question of matchingQuestions) {
    const hasUsageRecord = usageHistory.some(
      (u) => u.question_id === question.id && u.college === question.college
    );

    console.log('[getUsageByQuestionText] Question check:', {
      question_id: question.id,
      college: question.college,
      hasUsageRecord: hasUsageRecord
    });

    if (!hasUsageRecord && question.college) {
      console.log('[getUsageByQuestionText] Creating missing usage record for question:', question.id);
      // Create usage record for this question
      const newUsage = {
        id: data.nextUsageId++,
        question_id: question.id,
        exam_name: null,
        exam_type: question.exam_type || null,
        academic_year: question.academic_year || null, // Use academic_year from question
        college: question.college,
        date_used: question.created_date || new Date().toISOString(),
      };
      data.usageHistory.push(newUsage);
      usageHistory.push(newUsage);
      needsUpdate = true;
      console.log('[getUsageByQuestionText] Created usage record:', {
        id: newUsage.id,
        question_id: newUsage.question_id,
        college: newUsage.college
      });
    }
  }

  // If we created usage records, update the usage counts for each question individually
  if (needsUpdate) {
    // Update each question's usage_count to be 1 (used once in its specific college)
    for (const question of matchingQuestions) {
      const questionIndex = data.questions.findIndex((q) => q.id === question.id);
      if (questionIndex !== -1) {
        // Each question's usage_count should be 1 (used once in its specific college)
        // The total usage count across all colleges is calculated below
        data.questions[questionIndex].usage_count = 1;
        
        if (!data.questions[questionIndex].last_used_date) {
          data.questions[questionIndex].last_used_date =
            question.created_date || new Date().toISOString();
        }
      }
    }

    await writeData(data);
  }

  // After potential updates, reload usage history to ensure we have the latest data
  // This is important if we just created usage records
  if (needsUpdate) {
    console.log('[getUsageByQuestionText] Reloading data after creating usage records');
    // Reload data to get the updated usageHistory
    const updatedData = await readData();
    usageHistory = updatedData.usageHistory.filter((u) =>
      questionIds.includes(u.question_id)
    );
    console.log('[getUsageByQuestionText] After reload:', {
      usageHistoryCount: usageHistory.length,
      questionIds: questionIds
    });
  }

  // Map usage history with question text
  const mappedUsageHistory = usageHistory
    .map((u) => ({
      ...u,
      question_text:
        matchingQuestions.find((q) => q.id === u.question_id)?.question_text ||
        questionText,
    }))
    .sort((a, b) => new Date(b.date_used) - new Date(a.date_used));

  // Count unique colleges across all matching questions
  // This is the TOTAL usage count (e.g., 2 colleges = count 2)
  // Each individual question's usage_count is 1 (used once in its specific college)
  // Use colleges from usage history if available, otherwise from questions themselves
  let uniqueColleges;
  let usageCount;

  if (mappedUsageHistory.length > 0) {
    // If we have usage history, count unique colleges from usage records
    const collegesFromUsage = mappedUsageHistory.map((u) => u.college).filter((c) => c);
    uniqueColleges = new Set(collegesFromUsage);
    usageCount = uniqueColleges.size;
  } else {
    // If no usage history, count unique colleges from the questions themselves
    // This handles the case where questions exist but usage records haven't been created yet
    const collegesFromQuestions = matchingQuestions.map((q) => q.college).filter((c) => c);
    uniqueColleges = new Set(collegesFromQuestions);
    usageCount = uniqueColleges.size;
  }

  // Ensure usage_count is at least the number of matching questions with colleges
  // This is a safeguard to ensure we always show a count if questions exist
  if (usageCount === 0 && matchingQuestions.length > 0) {
    const collegesFromQuestions = matchingQuestions.map((q) => q.college).filter((c) => c);
    if (collegesFromQuestions.length > 0) {
      uniqueColleges = new Set(collegesFromQuestions);
      usageCount = uniqueColleges.size;
    }
  }

  // Debug logging
  console.log('[getUsageByQuestionText] Response:', {
    questionText: questionText.substring(0, 50),
    matchingQuestionsCount: matchingQuestions.length,
    usageHistoryCount: mappedUsageHistory.length,
    uniqueCollegesCount: usageCount,
    uniqueColleges: Array.from(uniqueColleges),
    needsUpdate: needsUpdate,
    usageHistorySample: mappedUsageHistory.length > 0 ? mappedUsageHistory[0] : 'empty'
  });

  const response = {
    usage_count: usageCount,
    question_text: questionText,
    matching_questions_count: matchingQuestions.length,
    usage_history: mappedUsageHistory,
    questions: matchingQuestions,
    unique_colleges: Array.from(uniqueColleges),
  };

  console.log('[getUsageByQuestionText] Final response structure:', {
    usage_count: response.usage_count,
    usage_history_length: response.usage_history.length,
    questions_count: response.questions.length
  });

  return response;
}

module.exports = {
  getAllQuestions,
  getQuestionById,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAllUsageHistory,
  addUsageRecord,
  getUsageByQuestionId,
  getUsageByQuestionText,
  readData, // Export for fallback usage
  writeData, // Export for fallback usage
};
