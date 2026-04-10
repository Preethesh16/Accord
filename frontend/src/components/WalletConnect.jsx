export default function WalletConnect({ address, balance, onConnect, onDisconnect }) {
  const truncate = (addr) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (!address) {
    return (
      <button
        onClick={onConnect}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-accord-accent hover:bg-accord-accent/80 text-white pulse-glow"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {balance !== null && (
        <div className="bg-accord-card border border-accord-border rounded-lg px-3 py-1.5 text-sm">
          <span className="text-gray-400 text-xs mr-1">Balance</span>
          <span className="font-mono font-semibold text-accord-green">{balance} ALGO</span>
        </div>
      )}
      <button
        onClick={onDisconnect}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-accord-card border border-accord-border hover:border-accord-red text-gray-300 hover:text-accord-red"
      >
        {truncate(address)}
      </button>
    </div>
  );
}
