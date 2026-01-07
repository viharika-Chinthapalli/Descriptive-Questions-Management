import { useState } from "react";
import { questionAPI } from "../services/api";
import QuestionCard from "./QuestionCard";
import "./CheckSimilarity.css";

function CheckSimilarity() {
  const [questionText, setQuestionText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || questionText.trim().length < 10) {
      setResult({
        type: "error",
        message: "Question text must be at least 10 characters long.",
        similarQuestions: [],
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Trim the question text before sending to API
      const trimmedQuestionText = questionText.trim();
      const data = await questionAPI.checkSimilarity(trimmedQuestionText);
      // Show duplicates as warning/info, not error - they're just information
      setResult({
        type: data.is_duplicate ? "warning" : "success",
        message: data.is_duplicate
          ? data.exact_match
            ? "⚠️ Exact duplicate found! This question already exists in the database."
            : `⚠️ Similar questions found (${data.similar_questions.length} match${data.similar_questions.length > 1 ? 'es' : ''} above threshold)!`
          : "✓ No duplicates found. This question is unique.",
        similarQuestions: data.similar_questions || [],
        similarityScores: data.similarity_scores || [],
        exactMatch: data.exact_match,
      });
    } catch (error) {
      let errorMessage = "Failed to check similarity";
      console.error("Similarity check error:", error);

      if (!error.response) {
        if (
          error.message?.includes("Network Error") ||
          error.message?.includes("Failed to fetch")
        ) {
          errorMessage =
            "Cannot connect to server. Please make sure the backend is running on http://localhost:8000";
        } else {
          errorMessage = `Network error: ${error.message}`;
        }
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        errorMessage = errorData?.message || errorData?.hint || "Invalid request. Please check your input.";
        // If it's an exclude_id error, we can still proceed - just log it
        if (errorData?.hint?.includes('exclude_id')) {
          console.warn('exclude_id validation error, but continuing:', errorData);
          // Try again without exclude_id
          try {
            const retryData = await questionAPI.checkSimilarity(questionText);
            setResult({
              type: retryData.is_duplicate ? "warning" : "success",
              message: retryData.is_duplicate
                ? retryData.exact_match
                  ? "⚠️ Exact duplicate found! This question already exists in the database."
                  : `⚠️ Similar questions found (${retryData.similar_questions.length} match${retryData.similar_questions.length > 1 ? 'es' : ''} above threshold)!`
                : "✓ No duplicates found. This question is unique.",
              similarQuestions: retryData.similar_questions || [],
              similarityScores: retryData.similarity_scores || [],
              exactMatch: retryData.exact_match,
            });
            return; // Exit early on successful retry
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
            // Fall through to show original error
          }
        }
      } else if (error.response?.status === 422) {
        const errorData = error.response.data;
        errorMessage = errorData?.message || "Invalid question text. Please enter at least 10 characters.";
      } else if (error.response?.status === 500) {
        const errorData = error.response.data;
        errorMessage = errorData?.message || errorData?.error || "Server error occurred. Please check the backend logs.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : error.response.data.detail?.message || "Unknown error";
      }

      setResult({
        type: "error",
        message: errorMessage,
        similarQuestions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="check-similarity">
      <h2>Check Question Similarity</h2>
      <form onSubmit={handleSubmit} className="similarity-form">
        <div className="form-group">
          <label htmlFor="check-question-text">
            Question Text <span className="required">*</span>
          </label>
          <textarea
            id="check-question-text"
            rows="5"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            minLength={10}
            placeholder="Enter the question text to check for duplicates"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Checking..." : "Check Similarity"}
        </button>
      </form>

      {result && (
        <>
          <div className={`result-message ${result.type}`}>
            {result.message}
          </div>
          {result.similarQuestions && result.similarQuestions.length > 0 && (
            <div className="similar-questions-list">
              <h3>Similar Questions:</h3>
              {result.similarQuestions.map((question, index) => {
                // Be lenient - show question even if ID is missing or invalid
                if (!question || !question.question_text) {
                  console.warn('Invalid question object:', question);
                  return null;
                }
                // Use index as key if ID is missing or invalid
                const questionKey = (question.id && typeof question.id === 'number' && question.id > 0) 
                  ? question.id 
                  : `question-${index}`;
                return (
                  <QuestionCard
                    key={questionKey}
                    question={question}
                    similarityScore={result.similarityScores && result.similarityScores[index]}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CheckSimilarity;
