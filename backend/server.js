/**
 * Express.js application entry point.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initDb } from "./app/database.js";
import routes from "./app/api/routes.js";
import { errorHandler } from "./app/middleware/errorHandler.js";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });
dotenv.config();

// Create Express app
const app = express();

// Configure CORS
const FRONTEND_URL = process.env.FRONTEND_URL || "";
const corsOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

if (FRONTEND_URL) {
  corsOrigins.push(FRONTEND_URL);
  if (FRONTEND_URL.endsWith("/")) {
    corsOrigins.push(FRONTEND_URL.slice(0, -1));
  } else {
    corsOrigins.push(FRONTEND_URL + "/");
  }
  console.log(`Added production frontend URL to CORS: ${FRONTEND_URL}`);
}

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
    exposedHeaders: ["*"],
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Question Bank Management System API",
    version: "1.0.0",
    docs: "API endpoints available at /api",
    frontend: "React frontend runs separately on http://localhost:3000 (see frontend-react folder)",
  });
});

// API routes
app.use("/api", routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";

async function startServer() {
  try {
    // Initialize database connection
    await initDb();
    console.log("Database initialized successfully");

    // Start server
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`API available at http://${HOST}:${PORT}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    if (error.message.includes("DATABASE_URL")) {
      console.error(
        "\nPlease set DATABASE_URL in your .env file.\n" +
          "Get your connection string from: Supabase Dashboard → Settings → Database"
      );
    }
    process.exit(1);
  }
}

startServer();

export default app;

