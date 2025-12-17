import axios from 'axios'
import { API_CONFIG } from '../config'

// Use the configured API base URL
const API_BASE = API_CONFIG.API_PATH

const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_BASE}`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Question API
export const questionAPI = {
  // Create a new question
  create: async (questionData) => {
    const response = await api.post('/questions', questionData)
    return response.data
  },

  // Get a question by ID
  getById: async (questionId) => {
    const response = await api.get(`/questions/${questionId}`)
    return response.data
  },

  // Get all questions with filters
  getAll: async (params = {}) => {
    const response = await api.get('/questions', { params })
    return response.data
  },

  // Update a question
  update: async (questionId, updateData) => {
    const response = await api.put(`/questions/${questionId}`, updateData)
    return response.data
  },

  // Delete (archive) a question
  delete: async (questionId) => {
    await api.delete(`/questions/${questionId}`)
  },

  // Check similarity
  checkSimilarity: async (questionText, excludeId = null) => {
    const params = { question_text: questionText }
    if (excludeId) {
      params.exclude_id = excludeId
    }
    const response = await api.get('/questions/check-similarity', { params })
    return response.data
  },

  // Record question usage
  recordUsage: async (questionId, usageData) => {
    const response = await api.post(`/questions/${questionId}/usage`, usageData)
    return response.data
  },

  // Get usage history
  getUsageHistory: async (questionId) => {
    const response = await api.get(`/questions/${questionId}/usage`)
    return response.data
  },
}

export default api

