/**
 * Express.js server for Question Bank Management System
 * Uses JSON file storage instead of database
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

const questionRoutes = require('./routes/questions');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API routes
app.use('/api', questionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error details:', {
    message: err.message,
    status: err.status || err.statusCode,
    url: req.url,
    method: req.method,
    query: req.query
  });
  
  // Determine status code
  let status = err.status || err.statusCode || 500;
  
  // Handle URI-related errors as 400 Bad Request
  if (err.message && (err.message.includes('URI') || err.message.includes('malformed'))) {
    status = 400;
  }
  
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      url: req.url,
      method: req.method
    })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;

