import { useState } from "react";
import { questionAPI } from "../services/api";
import QuestionCard from "./QuestionCard";
import "./SearchQuestions.css";

function SearchQuestions() {
  const [filters, setFilters] = useState({
    search_text: "",
    subject: "",
    exam_type: "",
    college: "",
  });
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params = {
        limit: 50,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v.trim() !== "")
        ),
      };

      const data = await questionAPI.getAll(params);
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Search error:", error);
      setQuestions([]);
      setTotal(0);
      // Show user-friendly error message
      if (error.response?.status === 500) {
        alert(
          "Database connection error. Please check if Supabase is configured correctly."
        );
      } else if (error.response?.data?.detail) {
        alert(`Error: ${error.response.data.detail}`);
      } else if (error.message) {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-questions">
      <h2>Search Questions</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="search_text">Search Text</label>
            <input
              type="text"
              id="search_text"
              name="search_text"
              value={filters.search_text}
              onChange={handleChange}
              placeholder="Search in question text..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={filters.subject}
              onChange={handleChange}
              placeholder="Filter by subject..."
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="exam_type">Exam Type</label>
            <input
              type="text"
              id="exam_type"
              name="exam_type"
              value={filters.exam_type}
              onChange={handleChange}
              placeholder="Filter by exam type..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="college">College</label>
            <input
              type="text"
              id="college"
              name="college"
              value={filters.college}
              onChange={handleChange}
              placeholder="Filter by college..."
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {searched && (
        <div className="search-results">
          {loading ? (
            <div className="loading">Searching...</div>
          ) : questions.length === 0 ? (
            <div className="result-message info">No questions found.</div>
          ) : (
            <>
              <p className="results-count">Found {total} question(s)</p>
              <div className="questions-list">
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchQuestions;
