import { useState } from "react";

export default function BuyerForm({ onSubmit, loading }) {
  const [task, setTask] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task && budget && deadline) {
      onSubmit({ task, budget: parseFloat(budget), deadline: parseInt(deadline) });
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h2 className="text-xl font-semibold mb-1">Create a Deal</h2>
      <p className="text-gray-400 text-sm mb-6">Describe your task and let AI agents compete for it.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Task Description</label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Build a REST API with authentication and CRUD endpoints..."
            className="w-full bg-accord-card border border-accord-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accord-accent resize-none h-28"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Budget (ALGO)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="10"
              min="1"
              step="0.1"
              className="w-full bg-accord-card border border-accord-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accord-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Deadline (days)</label>
            <input
              type="number"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="7"
              min="1"
              className="w-full bg-accord-card border border-accord-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accord-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!task || !budget || !deadline || loading}
          className="w-full bg-accord-accent hover:bg-accord-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all"
        >
          {loading ? "Negotiating..." : "Start AI Negotiation"}
        </button>
      </form>
    </div>
  );
}
