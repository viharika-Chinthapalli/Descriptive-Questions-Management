# Question Bank Management System - React Frontend

React + Vite frontend for the Question Bank Management System.

## Features

- **Add Question**: Create new exam questions with validation
- **Check Similarity**: Detect duplicate and similar questions
- **Search Questions**: Search and filter questions by various criteria
- **Usage History**: View when and where questions have been used

## Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on http://localhost:8000

## Installation

1. Navigate to the frontend-react directory:
```bash
cd frontend-react
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000

The Vite dev server is configured to proxy API requests to `http://localhost:8000/api`, so make sure your backend is running.

## Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
frontend-react/
├── src/
│   ├── components/          # React components
│   │   ├── AddQuestion.jsx
│   │   ├── CheckSimilarity.jsx
│   │   ├── SearchQuestions.jsx
│   │   ├── UsageHistory.jsx
│   │   ├── QuestionCard.jsx
│   │   ├── Header.jsx
│   │   └── Tabs.jsx
│   ├── services/            # API service layer
│   │   └── api.js
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## API Integration

The frontend communicates with the backend API through the `api.js` service layer. All API calls are made to `/api/*` endpoints, which are proxied to `http://localhost:8000` during development.

## Technologies

- **React 18**: UI library
- **Vite**: Build tool and dev server
- **Axios**: HTTP client for API calls
- **CSS Modules**: Component-scoped styling

## Browser Support

Modern browsers that support ES6+ features.









