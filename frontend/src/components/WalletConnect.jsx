export default function WalletConnect({ address, balance, onConnect, onDisconnect }) {
  const truncate = (addr) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (!address) {
    return (
      <button
        onClick={onConnect}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-accord-accent hover:bg-accord-accent/90 text-white shadow-lg shadow-accord-accent/20 hover:shadow-accord-accent/40 hover:-translate-y-0.5"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
      {balance !== null && (
        <div className="bg-accord-bg/50 backdrop-blur-sm border border-accord-border rounded-xl px-4 py-2 text-sm flex items-center gap-2 hidden sm:flex">
          <div className="w-1.5 h-1.5 rounded-full bg-accord-green animate-pulse" />
          <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">Balance</span>
          <span className="font-mono font-bold text-white">{balance} <span className="text-accord-green text-xs">ALGO</span></span>
        </div>
      )}
      <button
        onClick={onDisconnect}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-accord-card border border-accord-border hover:border-accord-red hover:bg-accord-red/10 text-gray-300 hover:text-accord-red shadow-sm"
        title="Disconnect Wallet"
      >
        <span className="font-mono text-sm group-hover:hidden">{truncate(address)}</span>
        <span className="font-semibold text-sm hidden group-hover:inline">Disconnect</span>
      </button>
    </div>
  );
}
