import { useState } from "react";
import { questionAPI } from "../services/api";
import "./UsageHistory.css";

function UsageHistory() {
  const [questionText, setQuestionText] = useState("");
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert("Please enter a question text.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const data = await questionAPI.getUsageByQuestionText(
        questionText.trim()
      );
      console.log('[UsageHistory] Received data:', {
        usage_count: data.usage_count,
        usage_history_length: data.usage_history?.length || 0,
        matching_questions_count: data.matching_questions_count
      });
      setUsageData(data);
    } catch (error) {
      console.error("Error fetching usage data:", error);
      setUsageData(null);
      // Show user-friendly error message
      if (error.response?.status === 503) {
        const errorData = error.response.data;
        const message =
          errorData?.detail?.message ||
          (typeof errorData?.detail === "string" ? errorData.detail : null) ||
          "Database connection error. Please check Supabase configuration.";
        alert(message);
      } else if (error.response?.status === 500) {
        const errorData = error.response.data;
        const message =
          errorData?.detail?.message ||
          (typeof errorData?.detail === "string" ? errorData.detail : null) ||
          "Server error occurred. Please check the backend logs.";
        alert(message);
      } else if (error.response?.status === 422) {
        const errorData = error.response.data;
        // Try to extract a clearer validation message from backend
        // Check multiple possible error formats
        let backendMessage = null;
        if (errorData?.errors?.[0]?.message) {
          backendMessage = errorData.errors[0].message;
        } else if (errorData?.detail?.errors?.[0]?.message) {
          backendMessage = errorData.detail.errors[0].message;
        } else if (errorData?.detail?.message) {
          backendMessage = errorData.detail.message;
        } else if (typeof errorData?.detail === "string") {
          backendMessage = errorData.detail;
        } else {
          backendMessage =
            "Invalid question text. Please enter at least 10 characters.";
        }
        const helpText =
          errorData?.help || errorData?.detail?.hint
            ? `\n\n${errorData.help || errorData.detail.hint || ""}`
            : "";
        alert(backendMessage + helpText);
      } else if (error.response?.status === 404) {
        const errorData = error.response.data;
        const message =
          errorData?.detail?.message ||
          (typeof errorData?.detail === "string" ? errorData.detail : null) ||
          "Endpoint not found (404). Please make sure:\n1. The backend server is running on http://localhost:8000\n2. The route /api/questions/usage-by-text/search exists\n3. Check the browser console for more details";
        alert(message);
      } else if (!error.response) {
        alert(
          "Cannot connect to server. Please make sure the backend is running on http://localhost:8000."
        );
      } else {
        const errorData = error.response.data;
        const message =
          errorData?.detail?.message ||
          (typeof errorData?.detail === "string" ? errorData.detail : null) ||
          "Failed to fetch usage data. Please try again.";
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="usage-history">
      <h2>Question Usage History</h2>
      <p style={{ marginBottom: "20px", color: "#666", fontSize: "14px" }}>
        Usage is automatically tracked when questions are added. Search for a question to view its usage count and history.
      </p>

      {/* Search usage history by question text */}
      <form onSubmit={handleSubmit} className="usage-form">
        <div className="form-group">
          <label htmlFor="usage-question-text">
            Question Text <span className="required">*</span>
          </label>
          <textarea
            id="usage-question-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            minLength={10}
            placeholder="Enter the question text (minimum 10 characters)"
            rows={4}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Loading..." : "Search Usage History"}
        </button>
      </form>

      {/* Display usage count and history */}
      {searched && (
        <div className="usage-results">
          <h3>Usage Information</h3>
          {loading ? (
            <p>Loading usage data...</p>
          ) : !usageData || usageData.usage_count === 0 ? (
            <p className="no-history">No usage found for this question text.</p>
          ) : (
            <>
              <div
                className="usage-summary"
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "5px",
                }}
              >
                <div className="usage-field">
                  <strong>Question Text:</strong>{" "}
                  <span style={{ fontStyle: "italic" }}>
                    {usageData.question_text || questionText}
                  </span>
                </div>
                <div className="usage-field">
                  <strong>Total Usage Count:</strong> {usageData.usage_count}
                </div>
                <div className="usage-field">
                  <strong>Matching Questions:</strong>{" "}
                  {usageData.matching_questions_count || 0} question(s) found
                </div>
                {usageData.questions && usageData.questions.length > 0 && (
                  <div className="usage-field" style={{ marginTop: "10px" }}>
                    <strong>Colleges:</strong>{" "}
                    {usageData.questions.map((q) => q.college).join(", ")}
                  </div>
                )}
              </div>

              {usageData.usage_history &&
                usageData.usage_history.length > 0 ? (
                  <div>
                    <h4>Usage History</h4>
                    <div className="usage-list">
                      {usageData.usage_history.map((usage) => (
                        <div key={usage.id} className="usage-item">
                          <div className="usage-field">
                            <strong>Question Text:</strong>{" "}
                            <span style={{ fontStyle: "italic" }}>
                              {usage.question_text ||
                                usageData.question_text ||
                                questionText}
                            </span>
                          </div>
                          <div className="usage-field">
                            <strong>Exam Type:</strong> {usage.exam_type || "N/A"}
                          </div>
                          <div className="usage-field">
                            <strong>Academic Year:</strong>{" "}
                            {usage.academic_year || "N/A"}
                          </div>
                          <div className="usage-field">
                            <strong>College:</strong> {usage.college || "N/A"}
                          </div>
                          <div className="usage-field">
                            <strong>Date Used:</strong>{" "}
                            {usage.date_used
                              ? new Date(usage.date_used).toLocaleString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : usageData.usage_count > 0 ? (
                  <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "5px", border: "1px solid #ffc107" }}>
                    <p style={{ margin: 0, color: "#856404" }}>
                      <strong>Note:</strong> Usage count is {usageData.usage_count}, but detailed history is being loaded. 
                      Please refresh or search again to see the full history.
                    </p>
                  </div>
                ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UsageHistory;
