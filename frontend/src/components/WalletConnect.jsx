export default function WalletConnect({ address, onConnect, onDisconnect }) {
  const truncate = (addr) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <button
      onClick={address ? onDisconnect : onConnect}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        address
          ? "bg-accord-card border border-accord-border hover:border-accord-red text-gray-300 hover:text-accord-red"
          : "bg-accord-accent hover:bg-accord-accent/80 text-white pulse-glow"
      }`}
    >
      {address ? truncate(address) : "Connect Wallet"}
    </button>
  );
}
