const API_BASE = "/api";

// Helper function to escape HTML
function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Tab switching
function showTab(tabName, clickedElement) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remove active class from all buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add("active");

  // Add active class to clicked button
  if (clickedElement) {
    clickedElement.classList.add("active");
  } else if (window.event && window.event.target) {
    window.event.target.classList.add("active");
  }
}

// Add Question
async function addQuestion(event) {
  event.preventDefault();
  const resultDiv = document.getElementById("add-result");
  resultDiv.className = "result-message";
  resultDiv.textContent = "";

  // Get form values
  const questionText = document.getElementById("question-text").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const topic = document.getElementById("topic").value.trim();
  const difficulty = document.getElementById("difficulty").value;
  const marksValue = document.getElementById("marks").value;
  const examType = document.getElementById("exam-type").value;
  const college = document.getElementById("college").value.trim();

  // Basic frontend validation
  if (!questionText || questionText.length < 10) {
    resultDiv.className = "result-message error";
    resultDiv.textContent =
      "Question text must be at least 10 characters long.";
    return;
  }

  if (!subject) {
    resultDiv.className = "result-message error";
    resultDiv.textContent = "Subject is required.";
    return;
  }

  if (!difficulty) {
    resultDiv.className = "result-message error";
    resultDiv.textContent = "Difficulty level is required.";
    return;
  }

  const marks = parseInt(marksValue);
  if (isNaN(marks) || marks <= 0) {
    resultDiv.className = "result-message error";
    resultDiv.textContent = "Marks must be a positive number.";
    return;
  }

  if (!examType) {
    resultDiv.className = "result-message error";
    resultDiv.textContent = "Exam type is required.";
    return;
  }

  if (!college) {
    resultDiv.className = "result-message error";
    resultDiv.textContent = "College is required.";
    return;
  }

  const questionData = {
    question_text: questionText,
    subject: subject,
    topic: topic || null,
    difficulty_level: difficulty,
    marks: marks,
    exam_type: examType,
    college: college,
  };

  // Remove null/empty topic to avoid sending empty string
  if (!questionData.topic) {
    delete questionData.topic;
  }

  try {
    const response = await fetch(`${API_BASE}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questionData),
    });

    if (response.ok) {
      const question = await response.json();
      resultDiv.className = "result-message success";
      resultDiv.textContent = `Question added successfully! ID: ${question.id}`;
      document.getElementById("add-question-form").reset();
    } else {
      const error = await response.json();
      let errorMessage = "Failed to add question";

      // Handle structured error detail from backend
      if (error.detail) {
        // detail can be string, array, or object
        if (typeof error.detail === "string") {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
          errorMessage = error.detail
            .map((e) => {
              const field = e.loc ? e.loc.join(".") : "unknown";
              return `${field}: ${e.msg}`;
            })
            .join("\n");
        } else if (typeof error.detail === "object") {
          // Prefer explicit message and code if present
          if (error.detail.message) {
            errorMessage = error.detail.message;
            if (error.detail.code) {
              errorMessage = `[${error.detail.code}] ${errorMessage}`;
            }
            // If similar question info exists, append IDs
            if (error.detail.similar_question_ids) {
              errorMessage += ` (Similar IDs: ${error.detail.similar_question_ids.join(
                ", "
              )})`;
            }
          } else {
            // Fallback stringify
            errorMessage = JSON.stringify(error.detail);
          }
        }
      } else if (error.errors && Array.isArray(error.errors)) {
        // Pydantic-style errors (legacy)
        const errorDetails = error.errors
          .map((e) => {
            const field = e.field.replace("body.", "").replace("question.", "");
            return `${field}: ${e.message}`;
          })
          .join("\n");
        errorMessage = `Validation errors:\n${errorDetails}`;
      }

      resultDiv.className = "result-message error";
      resultDiv.textContent = errorMessage;
    }
  } catch (error) {
    resultDiv.className = "result-message error";
    resultDiv.textContent = `Error: ${error.message}`;
  }
}

// Check Similarity
async function checkSimilarity(event) {
  event.preventDefault();
  const resultDiv = document.getElementById("similarity-result");
  const listDiv = document.getElementById("similar-questions-list");
  resultDiv.className = "result-message";
  resultDiv.textContent = "";
  listDiv.innerHTML = "";

  const questionText = document.getElementById("check-question-text").value;

  try {
    const response = await fetch(
      `${API_BASE}/questions/check-similarity?question_text=${encodeURIComponent(
        questionText
      )}`,
      { method: "GET" }
    );

    if (response.ok) {
      const result = await response.json();

      if (result.is_duplicate) {
        resultDiv.className = "result-message error";
        if (result.exact_match) {
          resultDiv.textContent =
            "⚠️ Exact duplicate found! This question already exists.";
        } else {
          resultDiv.textContent = `⚠️ Similar questions found (${result.similar_questions.length} matches above threshold)!`;
        }
      } else {
        resultDiv.className = "result-message success";
        resultDiv.textContent =
          "✓ No duplicates found. This question is unique.";
      }

      // Display similar questions
      if (result.similar_questions.length > 0) {
        result.similar_questions.forEach((q, index) => {
          const score = result.similarity_scores[index];
          const card = createQuestionCard(q, score);
          listDiv.appendChild(card);
        });
      }
    } else {
      const error = await response.json();
      resultDiv.className = "result-message error";
      resultDiv.textContent = `Error: ${
        error.detail || "Failed to check similarity"
      }`;
    }
  } catch (error) {
    resultDiv.className = "result-message error";
    resultDiv.textContent = `Error: ${error.message}`;
  }
}

// Search Questions
async function searchQuestions(event) {
  event.preventDefault();
  const resultsDiv = document.getElementById("search-results");
  resultsDiv.innerHTML = '<div class="loading">Searching...</div>';

  const params = new URLSearchParams();
  if (document.getElementById("search-text").value) {
    params.append("search_text", document.getElementById("search-text").value);
  }
  if (document.getElementById("search-subject").value) {
    params.append("subject", document.getElementById("search-subject").value);
  }
  if (document.getElementById("search-exam-type").value) {
    params.append(
      "exam_type",
      document.getElementById("search-exam-type").value
    );
  }
  if (document.getElementById("search-college").value) {
    params.append("college", document.getElementById("search-college").value);
  }
  params.append("limit", "50");

  try {
    const response = await fetch(`${API_BASE}/questions?${params.toString()}`);

    if (response.ok) {
      const data = await response.json();
      resultsDiv.innerHTML = "";

      if (data.questions.length === 0) {
        resultsDiv.innerHTML =
          '<div class="result-message info">No questions found.</div>';
      } else {
        resultsDiv.innerHTML = `<p style="margin-bottom: 15px; color: #666;">Found ${data.total} question(s)</p>`;
        data.questions.forEach((q) => {
          const card = createQuestionCard(q);
          resultsDiv.appendChild(card);
        });
      }
    } else {
      const error = await response.json();
      resultsDiv.innerHTML = `<div class="result-message error">Error: ${
        error.detail || "Search failed"
      }</div>`;
    }
  } catch (error) {
    resultsDiv.innerHTML = `<div class="result-message error">Error: ${error.message}</div>`;
  }
}

// Get Usage History
async function getUsageHistory(event) {
  event.preventDefault();
  const resultsDiv = document.getElementById("usage-results");
  resultsDiv.innerHTML = '<div class="loading">Loading...</div>';

  const questionId = document.getElementById("usage-question-id").value;

  try {
    const response = await fetch(`${API_BASE}/questions/${questionId}/usage`);

    if (response.ok) {
      const usageHistory = await response.json();
      resultsDiv.innerHTML = "";

      if (usageHistory.length === 0) {
        resultsDiv.innerHTML =
          '<div class="result-message info">No usage history found for this question.</div>';
      } else {
        usageHistory.forEach((usage) => {
          const item = document.createElement("div");
          item.className = "usage-item";
          item.innerHTML = `
                        <strong>Exam:</strong> ${usage.exam_name}<br>
                        <strong>Type:</strong> ${usage.exam_type}<br>
                        <strong>College:</strong> ${usage.college}<br>
                        <strong>Academic Year:</strong> ${
                          usage.academic_year
                        }<br>
                        <strong>Date Used:</strong> ${new Date(
                          usage.date_used
                        ).toLocaleString()}
                    `;
          resultsDiv.appendChild(item);
        });
      }
    } else {
      const error = await response.json();
      resultsDiv.innerHTML = `<div class="result-message error">Error: ${
        error.detail || "Failed to get usage history"
      }</div>`;
    }
  } catch (error) {
    resultsDiv.innerHTML = `<div class="result-message error">Error: ${error.message}</div>`;
  }
}

// Helper function to create question card
function createQuestionCard(question, similarityScore = null) {
  const card = document.createElement("div");
  card.className = "question-card";

  let similarityBadge = "";
  if (similarityScore !== null) {
    const badgeClass =
      similarityScore === 1.0 ? "badge-exact" : "badge-similar";
    const badgeText =
      similarityScore === 1.0
        ? "Exact Match"
        : `${Math.round(similarityScore * 100)}% Similar`;
    similarityBadge = `<span class="similarity-badge ${badgeClass}">${badgeText}</span>`;
  }

  card.innerHTML = `
        <div class="question-text">${escapeHtml(
          question.question_text
        )}${similarityBadge}</div>
        <div class="question-meta">
            <div class="meta-item">
                <span class="meta-label">ID:</span> ${escapeHtml(
                  String(question.id)
                )}
            </div>
            <div class="meta-item">
                <span class="meta-label">Subject:</span> ${escapeHtml(
                  question.subject
                )}
            </div>
            <div class="meta-item">
                <span class="meta-label">Topic:</span> ${escapeHtml(
                  question.topic || "N/A"
                )}
            </div>
            <div class="meta-item">
                <span class="meta-label">Difficulty:</span> ${escapeHtml(
                  question.difficulty_level
                )}
            </div>
            <div class="meta-item">
                <span class="meta-label">Marks:</span> ${escapeHtml(
                  String(question.marks)
                )}
            </div>
            <div class="meta-item">
                <span class="meta-label">Exam Type:</span> ${escapeHtml(
                  question.exam_type
                )}
            </div>
            <div class="meta-item">
                <span class="meta-label">College:</span> ${escapeHtml(
                  question.college
                )}
            </div>
            <div class="meta-item">
                <span class="meta-label">Used:</span> ${escapeHtml(
                  String(question.usage_count)
                )} time(s)
            </div>
            <div class="meta-item">
                <span class="meta-label">Status:</span> ${escapeHtml(
                  question.status
                )}
            </div>
        </div>
    `;

  return card;
}
