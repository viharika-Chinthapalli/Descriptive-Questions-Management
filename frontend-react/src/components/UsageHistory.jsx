import { useState } from 'react'
import { questionAPI } from '../services/api'
import './UsageHistory.css'

function UsageHistory() {
  const [questionId, setQuestionId] = useState('')
  const [usageHistory, setUsageHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const id = parseInt(questionId)
    if (isNaN(id) || id <= 0) {
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const history = await questionAPI.getUsageHistory(id)
      setUsageHistory(history || [])
    } catch (error) {
      console.error('Error fetching usage history:', error)
      setUsageHistory([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="usage-history">
      <h2>Question Usage History</h2>
      <form onSubmit={handleSubmit} className="usage-form">
        <div className="form-group">
          <label htmlFor="usage-question-id">
            Question ID <span className="required">*</span>
          </label>
          <input
            type="number"
            id="usage-question-id"
            min="1"
            value={questionId}
            onChange={(e) => setQuestionId(e.target.value)}
            required
            placeholder="Enter question ID"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Loading...' : 'Get History'}
        </button>
      </form>

      {searched && (
        <div className="usage-results">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : usageHistory.length === 0 ? (
            <div className="result-message info">
              No usage history found for this question.
            </div>
          ) : (
            <div className="usage-list">
              {usageHistory.map((usage) => (
                <div key={usage.id} className="usage-item">
                  <div className="usage-field">
                    <strong>Exam:</strong> {usage.exam_name}
                  </div>
                  <div className="usage-field">
                    <strong>Type:</strong> {usage.exam_type}
                  </div>
                  <div className="usage-field">
                    <strong>College:</strong> {usage.college}
                  </div>
                  <div className="usage-field">
                    <strong>Academic Year:</strong> {usage.academic_year}
                  </div>
                  <div className="usage-field">
                    <strong>Date Used:</strong>{' '}
                    {new Date(usage.date_used).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UsageHistory


