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

export default function EscrowStatus({ status, txHash, verifyTxHash, releaseTxHash }) {
  const states = {
    funding: { label: "Funding Escrow...", color: "text-accord-yellow", spin: true },
    verifying: { label: "Verifying Delivery...", color: "text-accord-accent", spin: true },
    complete: { label: "Deal Complete", color: "text-accord-green", spin: false },
  };

  const s = states[status];

  return (
    <div className="animate-fade-in border border-accord-border bg-accord-card rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        {s.spin ? (
          <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${s.color.replace("text-", "border-")}`} />
        ) : (
          <svg className="w-5 h-5 text-accord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className={`font-medium ${s.color}`}>{s.label}</span>
      </div>

      <div className="space-y-2">
        <TxRow label="Escrow Fund Transaction" txHash={txHash} />
        <TxRow label="Verify Transaction" txHash={verifyTxHash} />
        <TxRow label="Release Transaction" txHash={releaseTxHash} />
      </div>
    </div>
  );
}
