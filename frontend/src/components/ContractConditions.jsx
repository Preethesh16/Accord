function truncate(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export default function ContractConditions({ contract, funded }) {
  const { appId, appAddr, deployTxId, createTxId, conditions, demoMode } = contract;

  return (
    <div className="animate-fade-in border border-accord-green/30 bg-accord-green/5 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-accord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-accord-green font-semibold">Smart Contract Created</span>
        {funded && (
          <span className="text-xs bg-accord-green/20 text-accord-green px-2 py-0.5 rounded-full ml-auto">
            Funded
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-accord-card border border-accord-border rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">App ID</div>
          <div className="font-mono text-white">{appId}</div>
        </div>
        <div className="bg-accord-card border border-accord-border rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Escrow Address</div>
          <div className="font-mono text-white text-xs">{truncate(appAddr)}</div>
        </div>
        <div className="bg-accord-card border border-accord-border rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Buyer</div>
          <div className="font-mono text-white text-xs">{truncate(conditions.buyer)}</div>
        </div>
        <div className="bg-accord-card border border-accord-border rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Seller</div>
          <div className="font-mono text-white text-xs">{truncate(conditions.seller)}</div>
        </div>
        <div className="bg-accord-card border border-accord-border rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Amount</div>
          <div className="font-mono text-accord-green font-semibold">{conditions.amount} ALGO</div>
        </div>
        <div className="bg-accord-card border border-accord-border rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Deadline</div>
          <div className="font-mono text-white text-xs">{new Date(conditions.deadline).toLocaleDateString()}</div>
        </div>
      </div>

      {!demoMode && appId ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {deployTxId && (
            <>
              <a href={`https://testnet.explorer.perawallet.app/tx/${deployTxId}`} target="_blank" rel="noreferrer" className="text-xs text-accord-accent hover:underline">Deploy Tx</a>
              <span className="text-gray-600">|</span>
            </>
          )}
          {createTxId && (
            <>
              <a href={`https://testnet.explorer.perawallet.app/tx/${createTxId}`} target="_blank" rel="noreferrer" className="text-xs text-accord-accent hover:underline">Create Deal Tx</a>
              <span className="text-gray-600">|</span>
            </>
          )}
          {contract.fundPayTxId && (
            <>
              <a href={`https://testnet.explorer.perawallet.app/tx/${contract.fundPayTxId}`} target="_blank" rel="noreferrer" className="text-xs text-accord-green hover:underline">Fund Payment Tx</a>
              <span className="text-gray-600">|</span>
            </>
          )}
          <a href={`https://testnet.explorer.perawallet.app/application/${appId}`} target="_blank" rel="noreferrer" className="text-xs text-accord-accent hover:underline">View Contract</a>
        </div>
      ) : (
        <div className="mt-3 text-xs text-gray-400">Demo Mode: on-chain explorer links unavailable.</div>
      )}
    </div>
  );
}
