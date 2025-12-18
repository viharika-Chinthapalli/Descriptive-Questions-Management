// API Configuration
// In development, use relative URLs to leverage Vite proxy
// In production, use full URL or environment variable
const isDevelopment = import.meta.env.DEV

// Use empty string in development to leverage Vite proxy
// In production, use environment variable or default to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isDevelopment ? '' : 'http://localhost:8000')

export const API_CONFIG = {
  BASE_URL: API_BASE_URL, // Empty string in dev uses Vite proxy, full URL in production
  API_PATH: '/api',
}

// Log configuration in development
if (isDevelopment) {
  console.log('[API Config] Using Vite proxy for API requests to /api')
  console.log('[API Config] Backend should be running on http://localhost:8000')
}

export default API_CONFIG


