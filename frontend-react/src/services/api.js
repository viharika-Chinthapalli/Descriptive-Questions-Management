import axios from "axios";
import { API_CONFIG } from "../config";

// Use the configured API base URL
const API_BASE = API_CONFIG.API_PATH;

const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_BASE}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      console.error("[API] Response error:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error("[API] No response received:", {
        url: error.config?.url,
        message: error.message,
      });
    } else {
      // Error in request setup
      console.error("[API] Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Question API
export const questionAPI = {
  // Create a new question
  create: async (questionData) => {
    const response = await api.post("/questions", questionData);
    return response.data;
  },

  // Get a question by ID
  getById: async (questionId) => {
    // Ensure questionId is converted to integer for path parameter
    const id =
      typeof questionId === "string" ? parseInt(questionId, 10) : questionId;
    if (isNaN(id)) {
      throw new Error(
        `Invalid question ID: ${questionId}. Must be a valid integer.`
      );
    }
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  // Get all questions with filters
  getAll: async (params = {}) => {
    const response = await api.get("/questions", { params });
    return response.data;
  },

  // Update a question
  update: async (questionId, updateData) => {
    // Ensure questionId is converted to integer for path parameter
    const id =
      typeof questionId === "string" ? parseInt(questionId, 10) : questionId;
    if (isNaN(id)) {
      throw new Error(
        `Invalid question ID: ${questionId}. Must be a valid integer.`
      );
    }
    const response = await api.put(`/questions/${id}`, updateData);
    return response.data;
  },

  // Delete (archive) a question
  delete: async (questionId) => {
    // Ensure questionId is converted to integer for path parameter
    const id =
      typeof questionId === "string" ? parseInt(questionId, 10) : questionId;
    if (isNaN(id)) {
      throw new Error(
        `Invalid question ID: ${questionId}. Must be a valid integer.`
      );
    }
    await api.delete(`/questions/${id}`);
  },

  // Check similarity
  checkSimilarity: async (questionText, excludeId = null) => {
    const params = { question_text: questionText };
    if (excludeId !== null && excludeId !== undefined) {
      // Ensure excludeId is converted to integer if provided
      const id =
        typeof excludeId === "string" ? parseInt(excludeId, 10) : excludeId;
      if (!isNaN(id)) {
        params.exclude_id = id;
      }
    }
    const response = await api.get("/questions/check-similarity", { params });
    return response.data;
  },

  // Record question usage by question text (PRIMARY method for Question Usage History)
  recordUsageByQuestionText: async (questionText, usageData) => {
    // Validate questionText is a string and not empty
    if (
      !questionText ||
      typeof questionText !== "string" ||
      questionText.trim().length < 10
    ) {
      throw new Error(
        "Question text must be a non-empty string with at least 10 characters."
      );
    }
    // Include question_text in the request body
    const requestBody = {
      question_text: questionText.trim(),
      ...usageData,
    };
    const response = await api.post("/questions/usage-by-text", requestBody);
    return response.data;
  },

  // Get usage count and history by question text (PRIMARY method for Question Usage History)
  getUsageByQuestionText: async (questionText) => {
    // Validate questionText is a string and not empty
    if (
      !questionText ||
      typeof questionText !== "string" ||
      questionText.trim().length < 10
    ) {
      throw new Error(
        "Question text must be a non-empty string with at least 10 characters."
      );
    }
    // Use POST to avoid URL length limits and encoding issues with special characters
    const response = await api.post("/questions/usage-by-text/search", {
      question_text: questionText.trim(),
    });
    return response.data;
  },
};

export default api;
