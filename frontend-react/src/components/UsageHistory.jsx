import { useState } from "react";
import { questionAPI } from "../services/api";
import "./UsageHistory.css";

function UsageHistory() {
  const [questionText, setQuestionText] = useState("");
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [usageForm, setUsageForm] = useState({
    exam_name: "",
    exam_type: "",
    academic_year: "",
    college: "",
  });
  const [recording, setRecording] = useState(false);

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

  const handleUsageChange = (e) => {
    const { name, value } = e.target;
    setUsageForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecordUsage = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || questionText.trim().length < 10) {
      alert("Please enter a valid question text before recording usage.");
      return;
    }

    if (
      !usageForm.exam_name.trim() ||
      !usageForm.exam_type.trim() ||
      !usageForm.academic_year.trim() ||
      !usageForm.college.trim()
    ) {
      alert(
        "Please fill all usage fields (Exam, Type, Academic Year, College)."
      );
      return;
    }

    setRecording(true);
    try {
      await questionAPI.recordUsageByQuestionText(questionText.trim(), {
        exam_name: usageForm.exam_name.trim(),
        exam_type: usageForm.exam_type.trim(),
        academic_year: usageForm.academic_year.trim(),
        college: usageForm.college.trim(),
      });

      // Clear form
      setUsageForm({
        exam_name: "",
        exam_type: "",
        academic_year: "",
        college: "",
      });

      // Refresh usage data after recording
      const data = await questionAPI.getUsageByQuestionText(
        questionText.trim()
      );
      setUsageData(data);
      setSearched(true);
      alert("Usage recorded successfully.");
    } catch (error) {
      console.error("Error recording usage:", error);
      if (error.response?.status === 404) {
        const errorData = error.response.data;
        const errorMessage =
          errorData?.detail?.message ||
          (typeof errorData?.detail === "string"
            ? errorData.detail
            : "Question not found for the given text. Please check the question.");
        alert(errorMessage);
      } else if (error.response?.status === 422) {
        const errorData = error.response.data;
        const backendMessage =
          errorData?.errors?.[0]?.message ||
          errorData?.detail ||
          "Validation error. Please check your input.";
        const helpText = errorData?.help ? `\n\n${errorData.help}` : "";
        alert(backendMessage + helpText);
      } else if (error.response?.status === 503) {
        const errorData = error.response.data;
        alert(
          errorData?.detail?.message ||
            "Database connection error. Please check Supabase configuration."
        );
      } else if (!error.response) {
        alert(
          "Cannot connect to server. Please make sure the backend is running."
        );
      } else {
        alert("Failed to record usage. Please try again.");
      }
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="usage-history">
      <h2>Question Usage History</h2>

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
          {loading ? "Loading..." : "Get Usage Count & History"}
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
                usageData.usage_history.length > 0 && (
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
                            <strong>Exam Name:</strong> {usage.exam_name}
                          </div>
                          <div className="usage-field">
                            <strong>Exam Type:</strong> {usage.exam_type}
                          </div>
                          <div className="usage-field">
                            <strong>Academic Year:</strong>{" "}
                            {usage.academic_year}
                          </div>
                          <div className="usage-field">
                            <strong>College:</strong> {usage.college}
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
                )}
            </>
          )}
        </div>
      )}

      {/* Record new usage for a question */}
      <div className="usage-record-section">
        <h3>Record Question Usage</h3>
        <form onSubmit={handleRecordUsage} className="usage-form record-form">
          <div className="form-group">
            <label htmlFor="exam_name">
              Exam Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="exam_name"
              name="exam_name"
              value={usageForm.exam_name}
              onChange={handleUsageChange}
              placeholder="e.g., Final Exam 2024"
            />
          </div>
          <div className="form-group">
            <label htmlFor="exam_type">
              Exam Type <span className="required">*</span>
            </label>
            <input
              type="text"
              id="exam_type"
              name="exam_type"
              value={usageForm.exam_type}
              onChange={handleUsageChange}
              placeholder="e.g., Mid, End-Sem, Practical"
            />
          </div>
          <div className="form-group">
            <label htmlFor="academic_year">
              Academic Year <span className="required">*</span>
            </label>
            <input
              type="text"
              id="academic_year"
              name="academic_year"
              value={usageForm.academic_year}
              onChange={handleUsageChange}
              placeholder="e.g., 2023-24"
            />
          </div>
          <div className="form-group">
            <label htmlFor="college">
              College <span className="required">*</span>
            </label>
            <input
              type="text"
              id="college"
              name="college"
              value={usageForm.college}
              onChange={handleUsageChange}
              placeholder="e.g., ABC University"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={recording}
          >
            {recording ? "Recording..." : "Record Usage"}
          </button>
        </form>
      </div>

      
    </div>
  );
}

export default UsageHistory;
