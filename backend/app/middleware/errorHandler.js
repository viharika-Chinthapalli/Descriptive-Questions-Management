/**
 * Error handling middleware for Express.
 */

/**
 * Centralized error handler middleware.
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Database errors
  if (err.code === "PGRST301" || err.message?.includes("Tenant or user not found")) {
    return res.status(503).json({
      message: "Database authentication failed. Please check your Supabase connection.",
      error: "DATABASE_AUTH_ERROR",
      hint:
        "Verify your SUPABASE_URL and SUPABASE_ANON_KEY in .env file. " +
        "Get credentials from: Supabase Dashboard → Settings → API",
    });
  }

  if (
    err.message?.includes("could not translate host name") ||
    err.message?.includes("getaddrinfo")
  ) {
    return res.status(503).json({
      message: "Cannot connect to Supabase. Please check if your project is active.",
      error: "DATABASE_CONNECTION_ERROR",
      hint: "Go to https://supabase.com/dashboard and restore your project if it's paused",
    });
  }

  // Validation errors
  if (err.name === "ValidationError" || err.statusCode === 422) {
    return res.status(422).json({
      detail: "Validation error",
      errors: Array.isArray(err.errors) ? err.errors : [{ message: err.message }],
    });
  }

  // Not found errors
  if (err.statusCode === 404 || err.name === "NotFoundError") {
    return res.status(404).json({
      message: err.message || "Resource not found",
      error: "NOT_FOUND",
    });
  }

  // Bad request errors
  if (err.statusCode === 400 || err.name === "BadRequestError") {
    return res.status(400).json({
      message: err.message,
      error: err.code || "BAD_REQUEST",
      ...err.detail,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
    error: err.code || "INTERNAL_SERVER_ERROR",
    ...(process.env.DEBUG === "true" && { stack: err.stack }),
  });
}

