// API Configuration
// This will use the environment variable if set, otherwise default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  API_PATH: '/api',
}

export default API_CONFIG


