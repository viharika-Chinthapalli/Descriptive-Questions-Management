import { useState } from 'react'
import { questionAPI } from '../services/api'
import QuestionCard from './QuestionCard'
import './CheckSimilarity.css'

function CheckSimilarity() {
  const [questionText, setQuestionText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!questionText.trim() || questionText.trim().length < 10) {
      setResult({
        type: 'error',
        message: 'Question text must be at least 10 characters long.',
        similarQuestions: [],
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const data = await questionAPI.checkSimilarity(questionText)
      setResult({
        type: data.is_duplicate ? 'error' : 'success',
        message: data.is_duplicate
          ? data.exact_match
            ? '⚠️ Exact duplicate found! This question already exists.'
            : `⚠️ Similar questions found (${data.similar_questions.length} matches above threshold)!`
          : '✓ No duplicates found. This question is unique.',
        similarQuestions: data.similar_questions || [],
        similarityScores: data.similarity_scores || [],
        exactMatch: data.exact_match,
      })
    } catch (error) {
      setResult({
        type: 'error',
        message:
          error.response?.data?.detail || 'Failed to check similarity',
        similarQuestions: [],
      })
    } finally {
      setLoading(false)
    }
  }

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
          {loading ? 'Checking...' : 'Check Similarity'}
        </button>
      </form>

      {result && (
        <>
          <div className={`result-message ${result.type}`}>{result.message}</div>
          {result.similarQuestions && result.similarQuestions.length > 0 && (
            <div className="similar-questions-list">
              <h3>Similar Questions:</h3>
              {result.similarQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  similarityScore={result.similarityScores[index]}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CheckSimilarity


