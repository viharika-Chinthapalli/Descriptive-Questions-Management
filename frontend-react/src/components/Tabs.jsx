import './Tabs.css'

function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export default Tabs


