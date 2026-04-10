export default function DealSummary({ winner, onFund, funded }) {
  return (
    <div className="animate-fade-in border border-accord-accent/30 bg-accord-accent/5 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accord-accent text-lg font-semibold">Optimizer Result</span>
        <span className="text-xs bg-accord-accent/20 text-accord-accent px-2 py-0.5 rounded-full">
          {winner.confidence}% confidence
        </span>
      </div>

      {/* Winner Card */}
      <div className="bg-accord-card border border-accord-border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: winner.color }}
          >
            {winner.avatar}
          </div>
          <div>
            <div className="font-medium">{winner.seller}</div>
            <div className="text-xs text-gray-400">Winner</div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono font-semibold text-accord-green">{winner.price} ALGO</div>
            <div className="text-xs text-gray-400">{winner.days} days</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-accord-bg rounded-lg p-2">
            <div className="text-gray-400">Score</div>
            <div className="font-mono font-semibold text-white">{winner.score}</div>
          </div>
          <div className="bg-accord-bg rounded-lg p-2">
            <div className="text-gray-400">Savings</div>
            <div className="font-mono font-semibold text-accord-green">{winner.savings}</div>
          </div>
          <div className="bg-accord-bg rounded-lg p-2">
            <div className="text-gray-400">Delivery</div>
            <div className="font-mono font-semibold text-white">{winner.days}d</div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-400 mb-4">{winner.explanation}</p>

      {/* Fund Button */}
      {!funded && (
        <button
          onClick={onFund}
          className="w-full bg-accord-green hover:bg-accord-green/80 text-white font-medium py-3 rounded-lg transition-all"
        >
          Fund Escrow — {winner.price} ALGO
        </button>
      )}
    </div>
  );
}
