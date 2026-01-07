import { useState } from 'react'
import { questionAPI } from '../services/api'
import './AddQuestion.css'

function AddQuestion() {
  const [formData, setFormData] = useState({
    question_text: '',
    subject: '',
    unit_name: '',
    difficulty_level: '',
    marks: '',
    exam_type: '',
    college: '',
    academic_year: '',
  })
  const [result, setResult] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.question_text || formData.question_text.trim().length < 10) {
      return 'Question text must be at least 10 characters long.'
    }
    if (!formData.subject.trim()) {
      return 'Subject is required.'
    }
    if (!formData.difficulty_level) {
      return 'Difficulty level is required.'
    }
    const marks = parseInt(formData.marks)
    if (isNaN(marks) || marks <= 0) {
      return 'Marks must be a positive number.'
    }
    if (!formData.exam_type) {
      return 'Exam type is required.'
    }
    if (!formData.college.trim()) {
      return 'College is required.'
    }
    if (!formData.academic_year.trim()) {
      return 'Academic Year is required.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setResult({ type: '', message: '' })

    const validationError = validateForm()
    if (validationError) {
      setResult({ type: 'error', message: validationError })
      return
    }

    setLoading(true)
    try {
      const questionData = {
        question_text: formData.question_text.trim(),
        subject: formData.subject.trim(),
        unit_name: formData.unit_name.trim() || null,
        difficulty_level: formData.difficulty_level,
        marks: parseInt(formData.marks),
        exam_type: formData.exam_type,
        college: formData.college.trim(),
        academic_year: formData.academic_year.trim() || null,
      }

      // Remove null fields
      if (!questionData.unit_name) {
        delete questionData.unit_name
      }
      if (!questionData.academic_year) {
        delete questionData.academic_year
      }

      const question = await questionAPI.create(questionData)
      setResult({
        type: 'success',
        message: `Question added successfully! ID: ${question.id}`,
      })
      // Reset form
      setFormData({
        question_text: '',
        subject: '',
        unit_name: '',
        difficulty_level: '',
        marks: '',
        exam_type: '',
        college: '',
        academic_year: '',
      })
    } catch (error) {
      let errorMessage = 'Failed to add question'
      
      // Handle network errors
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please check your connection and try again.'
        } else if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:8000'
        } else {
          errorMessage = `Network error: ${error.message}`
        }
      } else if (error.response?.status === 400) {
        // Bad request - duplicate question or validation error
        const errorData = error.response.data
        if (errorData?.message) {
          errorMessage = errorData.message
          // Add additional context for duplicate questions
          if (errorData.code === 'DUPLICATE_QUESTION_SAME_COLLEGE') {
            const collegeName = errorData.college || 'this college'
            const questionId = errorData.existing_question_id
            errorMessage = `Question already exists in ${collegeName}.`
            if (questionId) {
              errorMessage += ` (Existing Question ID: ${questionId})`
            }
            errorMessage += `\n\nTip: Use "Check Similarity" to view the existing question.`
          } else if (errorData.code === 'SIMILAR_QUESTION') {
            errorMessage = errorData.message || `Similar question(s) found in ${errorData.college || 'this college'}. Please review existing questions or modify your question text.`
            if (errorData.similar_count) {
              errorMessage += ` (${errorData.similar_count} similar question(s) found)`
            }
            if (errorData.similar_question_ids && errorData.similar_question_ids.length > 0) {
              errorMessage += `\n\nSimilar Question IDs: ${errorData.similar_question_ids.join(', ')}`
            }
          }
        } else if (errorData?.detail?.message) {
          errorMessage = errorData.detail.message
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } else if (error.response?.status === 503) {
        // Service unavailable - database connection error
        const errorData = error.response.data
        if (errorData?.detail?.message) {
          errorMessage = errorData.detail.message
          if (errorData.detail.hint) {
            errorMessage += `\n\nHint: ${errorData.detail.hint}`
          }
        } else {
          errorMessage = 'Database connection error. Please check Supabase configuration.'
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please check the backend logs.'
      } else if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorDetails = errorData.errors
            .map((e) => {
              const field = e.field?.replace('body.', '').replace('question.', '') || 'field'
              return `${field}: ${e.message || e}`
            })
            .join('\n')
          errorMessage = `Validation errors:\n${errorDetails}`
        } else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map((e) => {
                const field = e.loc ? e.loc.join('.') : 'unknown'
                return `${field}: ${e.msg}`
              })
              .join('\n')
          } else if (errorData.detail.message) {
            errorMessage = errorData.detail.message
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setResult({ type: 'error', message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-question">
      <h2>Add New Question</h2>
      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label htmlFor="question_text">
            Question Text <span className="required">*</span>
          </label>
          <textarea
            id="question_text"
            name="question_text"
            rows="5"
            value={formData.question_text}
            onChange={handleChange}
            required
            minLength={10}
            placeholder="Enter the question text (minimum 10 characters)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="subject">
              Subject <span className="required">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="e.g., Web Development"
            />
          </div>
          <div className="form-group">
            <label htmlFor="unit_name">Unit Name</label>
            <input
              type="text"
              id="unit_name"
              name="unit_name"
              value={formData.unit_name}
              onChange={handleChange}
              placeholder="e.g., UNIT_Bootstrap_Grid_System"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="difficulty_level">
              Difficulty Level <span className="required">*</span>
            </label>
            <select
              id="difficulty_level"
              name="difficulty_level"
              value={formData.difficulty_level}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="marks">
              Marks <span className="required">*</span>
            </label>
            <input
              type="number"
              id="marks"
              name="marks"
              value={formData.marks}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g., 10"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="exam_type">
              Exam Type <span className="required">*</span>
            </label>
            <input
              type="text"
              id="exam_type"
              name="exam_type"
              value={formData.exam_type}
              onChange={handleChange}
              required
              placeholder="e.g., Mid, End-Sem, Practical, Internal, External"
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
              value={formData.college}
              onChange={handleChange}
              required
              placeholder="e.g., ABC University"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="academic_year">
              Academic Year <span className="required">*</span>
            </label>
            <input
              type="text"
              id="academic_year"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              required
              placeholder="e.g., 2025"
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add Question'}
        </button>
      </form>

      {result.message && (
        <div className={`result-message ${result.type}`}>
          {result.message.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AddQuestion

