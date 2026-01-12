import { useState } from "react";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import AddQuestion from "./components/AddQuestion";
import CheckSimilarity from "./components/CheckSimilarity";
import SearchQuestions from "./components/SearchQuestions";
import UsageHistory from "./components/UsageHistory";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("add");

  const tabs = [
    { id: "add", label: "Add Question" },
    { id: "check", label: "Check Similarity" },
    { id: "search", label: "Search Questions" },
    { id: "usage", label: "Usage History" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "add":
        return <AddQuestion />;
      case "check":
        return <CheckSimilarity />;
      case "search":
        return <SearchQuestions />;
      case "usage":
        return <UsageHistory />;
      default:
        return <AddQuestion />;
    }
  };

  return (
    <div className="app-container">
      <Header />
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="tab-content-wrapper">{renderTabContent()}</div>
    </div>
  );
}

export default App;





