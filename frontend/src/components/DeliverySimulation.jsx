export default function DeliverySimulation({ onSimulate, loading, winner }) {
  return (
    <div className="animate-fade-in border border-accord-border bg-accord-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-2">Delivery Check Simulation</h3>
      <p className="text-sm text-gray-400 mb-1">
        Escrow is funded with <span className="text-accord-green font-mono">{winner?.price} ALGO</span>.
        The smart contract deadline is <span className="text-white font-mono">{winner?.days} days</span>.
      </p>
      <p className="text-sm text-gray-400 mb-5">
        Choose a simulation to test the smart contract conditions:
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSimulate(true)}
          disabled={loading}
          className="flex flex-col items-center gap-2 bg-accord-green/10 border border-accord-green/30 hover:border-accord-green rounded-lg p-4 transition-all disabled:opacity-50"
        >
          <svg className="w-8 h-8 text-accord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-accord-green font-medium text-sm">On-Time Delivery</span>
          <span className="text-xs text-gray-500">Funds released to seller</span>
        </button>

        <button
          onClick={() => onSimulate(false)}
          disabled={loading}
          className="flex flex-col items-center gap-2 bg-accord-red/10 border border-accord-red/30 hover:border-accord-red rounded-lg p-4 transition-all disabled:opacity-50"
        >
          <svg className="w-8 h-8 text-accord-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-accord-red font-medium text-sm">Late Delivery</span>
          <span className="text-xs text-gray-500">Funds kept in escrow / refunded</span>
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-t-transparent border-accord-accent rounded-full animate-spin" />
          Processing delivery simulation...
        </div>
      )}
    </div>
  );
}
