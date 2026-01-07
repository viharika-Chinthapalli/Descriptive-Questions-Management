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
 */
async function addUsageRecord(usage) {
  const data = await readData();
  const newUsage = {
    ...usage,
    id: data.nextUsageId++,
    date_used: new Date().toISOString(),
  };
  data.usageHistory.push(newUsage);

  // Update question usage count
  const question = data.questions.find((q) => q.id === usage.question_id);
  if (question) {
    question.usage_count = (question.usage_count || 0) + 1;
    question.last_used_date = newUsage.date_used;
  }

  await writeData(data);
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
    };
  }

  const questionIds = matchingQuestions.map((q) => q.id);
  const usageHistory = data.usageHistory
    .filter((u) => questionIds.includes(u.question_id))
    .map((u) => ({
      ...u,
      question_text:
        matchingQuestions.find((q) => q.id === u.question_id)?.question_text ||
        questionText,
    }))
    .sort((a, b) => new Date(b.date_used) - new Date(a.date_used));

  // Usage count should be the total number of usage records, not the question's usage_count field
  // This ensures accuracy even if usage_count gets out of sync
  const usageCount = usageHistory.length;

  return {
    usage_count: usageCount,
    question_text: questionText,
    matching_questions_count: matchingQuestions.length,
    usage_history: usageHistory,
    questions: matchingQuestions,
  };
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
};
