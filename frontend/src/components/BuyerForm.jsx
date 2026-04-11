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
    <div className="max-w-xl mx-auto animate-fade-in bg-accord-card/50 backdrop-blur-xl border border-accord-border/50 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Create a Deal</h2>
        <p className="text-gray-400 text-sm">Describe your requirements and let AI agents compete to offer you the best terms.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Task Description</label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g., Build a REST API with authentication and CRUD endpoints..."
            className="w-full bg-accord-bg/80 border border-accord-border/80 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-accord-accent/50 focus:border-accord-accent transition-all resize-none h-32 shadow-inner"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Budget Limit (ALGO)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-mono">
                $
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="10"
                min="1"
                step="0.1"
                className="w-full bg-accord-bg/80 border border-accord-border/80 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-accord-accent/50 focus:border-accord-accent transition-all shadow-inner font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
            <div className="relative">
              <input
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="7"
                min="1"
                className="w-full bg-accord-bg/80 border border-accord-border/80 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-accord-accent/50 focus:border-accord-accent transition-all shadow-inner font-mono pr-12"
              />
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 text-sm">
                days
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!task || !budget || !deadline || loading}
          className="w-full relative flex items-center justify-center gap-2 bg-accord-accent hover:bg-accord-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-accord-accent/20 hover:shadow-accord-accent/40 mt-4 group"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Initiating Negotiation...</span>
            </>
          ) : (
            <>
              <span>Start AI Negotiation</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
