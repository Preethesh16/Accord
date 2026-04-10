function TxRow({ label, txHash }) {
  if (!txHash) return null;
  const truncated = txHash.length > 20 ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}` : txHash;
  const isSimulated = txHash.startsWith("SIM_");

  return (
    <div className="bg-accord-bg rounded-lg p-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-mono text-white">{truncated}</div>
      </div>
      {isSimulated ? (
        <span className="text-xs text-gray-400">Demo Mode</span>
      ) : (
        <a
          href={`https://testnet.explorer.perawallet.app/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-accord-accent hover:underline"
        >
          View on Explorer
        </a>
      )}
    </div>
  );
}

export default function EscrowStatus({ status, txHash, verifyTxHash, releaseTxHash, refundTxHash, dealAmount }) {
  const states = {
    funding: { label: "Funding Escrow...", color: "text-accord-yellow", spin: true },
    funded: { label: "Escrow Funded", color: "text-accord-accent", spin: false },
    verifying: { label: "Verifying Delivery...", color: "text-accord-accent", spin: true },
    complete: { label: "Deal Complete — Funds Released", color: "text-accord-green", spin: false },
    held: { label: "Late Delivery — Funds Kept in Escrow", color: "text-accord-red", spin: false },
    refunded: { label: "Deadline Missed — Funds Kept in Escrow", color: "text-accord-red", spin: false },
  };

  const s = states[status] || states.funding;

  return (
    <div className="animate-fade-in border border-accord-border bg-accord-card rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        {s.spin ? (
          <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${s.color.replace("text-", "border-")}`} />
        ) : status === "refunded" ? (
          <svg className="w-5 h-5 text-accord-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-accord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className={`font-medium ${s.color}`}>{s.label}</span>
      </div>

      <div className="space-y-2">
        <TxRow label="Escrow Fund Transaction" txHash={txHash} />
        {verifyTxHash && <TxRow label="Verify Transaction" txHash={verifyTxHash} />}
        {releaseTxHash && <TxRow label="Release Transaction" txHash={releaseTxHash} />}
        {refundTxHash && <TxRow label="Refund Transaction" txHash={refundTxHash} />}
      </div>

      {dealAmount && (status === "complete" || status === "refunded" || status === "held") && (
        <div className="mt-3 bg-accord-bg rounded-lg p-3 text-sm">
          <div className="text-xs text-gray-400 mb-1">Transaction Cost</div>
          <div className="flex justify-between">
            <span className="text-gray-300">Deal Amount</span>
            <span className="font-mono text-white">{dealAmount} ALGO</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Network Fees</span>
            <span className="font-mono text-white">~0.003 ALGO</span>
          </div>
          <div className="flex justify-between border-t border-accord-border mt-1 pt-1">
            <span className="text-gray-300 font-medium">Total Deducted</span>
            <span className="font-mono font-semibold text-accord-green">
              {status === "complete" ? `${dealAmount} ALGO` : `${dealAmount} ALGO (still in escrow)`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
