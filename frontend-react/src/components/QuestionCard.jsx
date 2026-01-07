import './QuestionCard.css'

function QuestionCard({ question, similarityScore = null }) {
  // Validate question object - be lenient, show what we can
  if (!question) {
    return <div className="question-card error">Invalid question data</div>;
  }
  
  // Ensure ID is displayed even if it's a fallback (negative)
  const displayId = question.id !== undefined && question.id !== null 
    ? String(question.id) 
    : 'N/A';

  const escapeHtml = (text) => {
    if (text == null) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const similarityBadge =
    similarityScore !== null ? (
      <span
        className={`similarity-badge ${
          similarityScore === 1.0 ? 'badge-exact' : 'badge-similar'
        }`}
      >
        {similarityScore === 1.0
          ? 'Exact Match'
          : `${Math.round(similarityScore * 100)}% Similar`}
      </span>
    ) : null

  return (
    <div className="question-card">
      <div className="question-text">
        <span dangerouslySetInnerHTML={{ __html: escapeHtml(question.question_text) }} />
        {similarityBadge}
      </div>
      <div className="question-meta">
        <div className="meta-item">
          <span className="meta-label">ID:</span>{' '}
          {escapeHtml(displayId)}
        </div>
        <div className="meta-item">
          <span className="meta-label">Subject:</span>{' '}
          {escapeHtml(question.subject)}
        </div>
        <div className="meta-item">
          <span className="meta-label">Topic:</span>{' '}
          {escapeHtml(question.topic || 'N/A')}
        </div>
        <div className="meta-item">
          <span className="meta-label">Difficulty:</span>{' '}
          {escapeHtml(question.difficulty_level)}
        </div>
        <div className="meta-item">
          <span className="meta-label">Marks:</span>{' '}
          {escapeHtml(String(question.marks))}
        </div>
        <div className="meta-item">
          <span className="meta-label">Exam Type:</span>{' '}
          {escapeHtml(question.exam_type)}
        </div>
        <div className="meta-item">
          <span className="meta-label">College:</span>{' '}
          {escapeHtml(question.college)}
        </div>
        <div className="meta-item">
          <span className="meta-label">Used:</span>{' '}
          {escapeHtml(String(question.usage_count))} time(s)
        </div>
        <div className="meta-item">
          <span className="meta-label">Status:</span>{' '}
          {escapeHtml(question.status)}
        </div>
      </div>
    </div>
  )
}

export default QuestionCard







