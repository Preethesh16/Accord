function truncate(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

export default function ContractConditions({ contract, funded }) {
  const { appId, appAddr, deployTxId, createTxId, conditions, demoMode } = contract;

  return (
    <div className="animate-fade-in mt-6 bg-accord-bg/40 border border-accord-border/60 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-accord-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accord-card border border-accord-border flex items-center justify-center">
            <svg className="w-4 h-4 text-accord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white font-bold tracking-tight">On-Chain Smart Contract</span>
        </div>
        {funded && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accord-green/10 border border-accord-green/20 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-accord-green animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-bold text-accord-green">Funded Locked</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-6">
        <div className="bg-accord-card/40 border border-accord-border/40 rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">App ID</div>
          <div className="font-mono text-white text-sm bg-accord-bg/50 px-2 py-1 rounded inline-block border border-accord-border/30">{appId}</div>
        </div>
        <div className="bg-accord-card/40 border border-accord-border/40 rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Escrow Address</div>
          <div className="font-mono text-white text-sm truncate" title={appAddr}>{truncate(appAddr)}</div>
        </div>
        <div className="bg-accord-card/40 border border-accord-border/40 rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Buyer</div>
          <div className="font-mono text-white text-sm truncate">{truncate(conditions.buyer)}</div>
        </div>
        <div className="bg-accord-card/40 border border-accord-border/40 rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Seller</div>
          <div className="font-mono text-white text-sm truncate">{truncate(conditions.seller)}</div>
        </div>
        <div className="bg-accord-card/40 border border-accord-border/40 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-accord-green/50"></div>
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Amount</div>
          <div className="font-mono text-accord-green font-bold text-lg">{conditions.amount} <span className="text-xs">ALGO</span></div>
        </div>
        <div className="bg-accord-card/40 border border-accord-border/40 rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Deadline</div>
          <div className="font-mono text-white text-sm">{new Date(conditions.deadline).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
      </div>

      {!demoMode && appId ? (
        <div className="flex flex-wrap items-center gap-2 bg-accord-card bd border border-accord-border rounded-xl p-3">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-2">Explorer Links</span>
          <div className="h-4 w-px bg-accord-border mx-1"></div>
          {deployTxId && (
            <a href={`https://testnet.explorer.perawallet.app/tx/${deployTxId}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accord-accent hover:text-white transition-colors px-2 py-1 bg-accord-bg rounded hover:bg-accord-accent/20">Deploy Tx ↗</a>
          )}
          {createTxId && (
            <a href={`https://testnet.explorer.perawallet.app/tx/${createTxId}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accord-accent hover:text-white transition-colors px-2 py-1 bg-accord-bg rounded hover:bg-accord-accent/20">Create Deal Tx ↗</a>
          )}
          {contract.fundPayTxId && (
            <a href={`https://testnet.explorer.perawallet.app/tx/${contract.fundPayTxId}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accord-green hover:text-white transition-colors px-2 py-1 bg-accord-green/10 rounded hover:bg-accord-green/30 border border-accord-green/20">Fund Payment Tx ↗</a>
          )}
          <a href={`https://testnet.explorer.perawallet.app/application/${appId}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accord-accent hover:text-white transition-colors px-2 py-1 bg-accord-bg rounded hover:bg-accord-accent/20 ml-auto">View Contract ↗</a>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-accord-yellow bg-accord-yellow/10 border border-accord-yellow/20 px-4 py-3 rounded-xl font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Demo Mode: On-chain explorer links are unavailable.
        </div>
      )}
    </div>
  );
}
