export default function DealSummary({ winner, onFund, funded, funding, spendableBalance }) {
  return (
    <div className="animate-fade-in relative overflow-hidden bg-gradient-to-b from-accord-card to-accord-bg border border-accord-accent/30 rounded-2xl shadow-xl shadow-accord-accent/5">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accord-accent/50 via-accord-accent to-accord-accent/50"></div>
      
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-accord-accent/20 flex items-center justify-center text-accord-accent">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">Optimal Deal Selected</span>
          <span className="ml-auto text-[11px] uppercase tracking-wider font-semibold bg-accord-accent/10 border border-accord-accent/20 text-accord-accent px-3 py-1.5 rounded-full">
            {winner.confidence}% match
          </span>
        </div>

        {/* Winner Card */}
        <div className="bg-accord-bg/60 border border-accord-border/80 rounded-xl p-5 mb-5 shadow-inner">
          <div className="flex items-center gap-4 mb-5 border-b border-accord-border/50 pb-5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatar}
            </div>
            <div>
              <div className="text-lg font-bold text-white mb-0.5">{winner.seller}</div>
              <div className="text-xs font-semibold text-accord-accent tracking-wide uppercase">Winning Agent</div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-mono text-2xl font-bold text-accord-green">{winner.price} <span className="text-sm">ALGO</span></div>
              <div className="text-xs text-gray-400 font-medium">{winner.days} days delivery</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="bg-accord-card/50 rounded-lg p-3 border border-accord-border/30">
              <div className="text-xs text-gray-400 mb-1 font-medium">Reputation Score</div>
              <div className="font-mono font-bold text-white text-lg">{winner.score}</div>
            </div>
            <div className="bg-accord-green/5 rounded-lg p-3 border border-accord-green/10">
              <div className="text-xs text-accord-green/80 mb-1 font-medium">Est. Savings</div>
              <div className="font-mono font-bold text-accord-green text-lg">{winner.savings}</div>
            </div>
            <div className="bg-accord-card/50 rounded-lg p-3 border border-accord-border/30">
              <div className="text-xs text-gray-400 mb-1 font-medium">Delivery Time</div>
              <div className="font-mono font-bold text-white text-lg">{winner.days}d</div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-accord-accent/5 border border-accord-accent/10 rounded-xl p-4 mb-6">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-accord-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-300 leading-relaxed">{winner.explanation}</p>
          </div>
        </div>

        {!funded && (
          <div className="space-y-4">
            {spendableBalance !== null && (
              <div className="flex justify-between items-center text-sm px-1">
                <span className="text-gray-400">Available Wallet Balance</span>
                <span className="font-mono font-medium text-white">{spendableBalance} ALGO</span>
              </div>
            )}
            <button
              onClick={onFund}
              disabled={funding}
              className="w-full relative flex items-center justify-center gap-2 bg-accord-green hover:bg-accord-green/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-accord-green/20 hover:shadow-accord-green/40 hover:-translate-y-0.5"
            >
              {funding ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Funding Escrow...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Lock {winner.price} ALGO in Escrow</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
