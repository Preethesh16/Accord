function TxRow({ label, txHash }) {
  if (!txHash) return null;
  const truncated = txHash.length > 30 ? `${txHash.slice(0, 12)}...${txHash.slice(-12)}` : txHash;
  const isSimulated = txHash.startsWith("SIM_");

  return (
    <div className="bg-accord-bg/60 border border-accord-border/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm transition-all hover:border-accord-border">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">{label}</div>
        <div className="text-sm font-mono text-gray-200">{truncated}</div>
      </div>
      {isSimulated ? (
        <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 bg-accord-bg px-2 py-1 rounded-md border border-accord-border/50">Demo Mode</span>
      ) : (
        <a
          href={`https://testnet.explorer.perawallet.app/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-accord-accent hover:text-white transition-colors flex items-center gap-1 sm:ml-auto"
        >
          View Explorer ↗
        </a>
      )}
    </div>
  );
}

export default function EscrowStatus({ status, txHash, verifyTxHash, releaseTxHash, refundTxHash, dealAmount }) {
  const states = {
    funding: { label: "Funding Escrow...", color: "text-accord-yellow", border: "border-accord-yellow/30", bg: "bg-accord-yellow/5" },
    funded: { label: "Escrow Funded & Locked", color: "text-accord-green", border: "border-accord-green/30", bg: "bg-accord-green/5" },
    verifying: { label: "Verifying Delivery...", color: "text-accord-accent", border: "border-accord-accent/30", bg: "bg-accord-accent/5" },
    complete: { label: "Deal Complete — Funds Released", color: "text-accord-green", border: "border-accord-green/30", bg: "bg-accord-green/5" },
    held: { label: "Late Delivery — Funds Held in Escrow", color: "text-accord-red", border: "border-accord-red/30", bg: "bg-accord-red/5" },
    refunded: { label: "Deadline Missed — Funds Refunded", color: "text-accord-yellow", border: "border-accord-yellow/30", bg: "bg-accord-yellow/5" },
  };

  const s = states[status] || states.funding;
  const isSpinning = status === "funding" || status === "verifying";

  return (
    <div className="animate-fade-in mt-6 bg-accord-card/30 backdrop-blur-md border border-accord-border rounded-2xl p-6 shadow-lg shadow-black/10">
      <div className={`flex items-center gap-4 mb-6 p-4 rounded-xl border ${s.border} ${s.bg}`}>
        {isSpinning ? (
          <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${s.color.replace("text-", "border-")}`} />
        ) : status === "refunded" ? (
          <div className="w-8 h-8 rounded-full bg-accord-yellow/20 flex items-center justify-center text-accord-yellow">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : status === "held" ? (
          <div className="w-8 h-8 rounded-full bg-accord-red/20 flex items-center justify-center text-accord-red">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-accord-green/20 flex items-center justify-center text-accord-green">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <span className={`font-bold text-lg tracking-tight ${s.color}`}>{s.label}</span>
      </div>

      <div className="space-y-3">
        <TxRow label="Escrow Fund Transaction" txHash={txHash} />
        {verifyTxHash && <TxRow label="Delivery Verification Transaction" txHash={verifyTxHash} />}
        {releaseTxHash && <TxRow label="Funds Release Transaction" txHash={releaseTxHash} />}
        {refundTxHash && <TxRow label="Funds Refund Transaction" txHash={refundTxHash} />}
      </div>

      {dealAmount && (status === "complete" || status === "refunded" || status === "held") && (
        <div className="mt-6 bg-accord-bg/80 border border-accord-border/50 rounded-xl p-5 text-sm">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Transaction Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Deal Amount</span>
              <span className="font-mono text-white bg-accord-card px-2 py-1 rounded">{dealAmount} ALGO</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Network Fees</span>
              <span className="font-mono text-white bg-accord-card px-2 py-1 rounded">~0.003 ALGO</span>
            </div>
            <div className="flex justify-between items-center border-t border-accord-border/50 mt-3 pt-3">
              <span className="text-gray-200 font-bold">Total Finalized</span>
              <span className={`font-mono font-bold text-lg ${status === "refunded" ? "text-accord-yellow" : status === "held" ? "text-accord-red" : "text-accord-green"}`}>
                {status === "complete" ? `${dealAmount} ALGO` : status === "refunded" ? `${dealAmount} ALGO (Refunded)` : `${dealAmount} ALGO (Held)`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
