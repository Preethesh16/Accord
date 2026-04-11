const STEPS = [
  { label: "Connect Wallet", description: "Link your Pera Wallet" },
  { label: "Submit Task", description: "Describe work & set budget" },
  { label: "AI Negotiation", description: "3 sellers compete in 2 rounds" },
  { label: "Winner Selected", description: "Optimizer picks the best deal" },
  { label: "Escrow Funded", description: "ALGO deducted via Pera Wallet" },
  { label: "Delivery Check", description: "Simulate on-time or late" },
  { label: "Deal Resolved", description: "Funds released or refunded" },
];

export default function StatusTimeline({ currentStep }) {
  return (
    <div className="bg-accord-card/30 rounded-2xl p-5 border border-accord-border/50">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 px-2">Deal Progress</h3>
      <div className="space-y-0">
        {STEPS.map((s, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={i} className="flex gap-4 group">
              {/* Line + Dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-[3px] shrink-0 mt-1 transition-colors ${
                    done
                      ? "bg-accord-green border-accord-green shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      : active
                      ? "bg-accord-bg border-accord-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                      : "bg-accord-bg border-accord-border/60"
                  }`}
                />
                {!isLast && (
                  <div
                    className={`w-0.5 h-12 my-1 rounded-full transition-colors ${
                      done ? "bg-accord-green/50" : "bg-accord-border/30"
                    }`}
                  />
                )}
              </div>

              {/* Text */}
              <div className={`pb-6 -mt-0.5 ${done ? "opacity-100" : active ? "opacity-100" : "opacity-60"}`}>
                <div
                  className={`text-sm font-bold tracking-tight transition-colors ${
                    done ? "text-accord-green" : active ? "text-white" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-xs text-gray-500 font-medium leading-relaxed mt-0.5">{s.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
