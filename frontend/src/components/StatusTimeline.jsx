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
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Deal Progress</h3>
      <div className="space-y-1">
        {STEPS.map((s, i) => {
          const done = i < currentStep;
          const active = i === currentStep;

          return (
            <div key={i} className="flex gap-3">
              {/* Line + Dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                    done
                      ? "bg-accord-green border-accord-green"
                      : active
                      ? "bg-accord-accent border-accord-accent pulse-glow"
                      : "bg-transparent border-accord-border"
                  }`}
                />
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-10 ${
                      done ? "bg-accord-green" : "bg-accord-border"
                    }`}
                  />
                )}
              </div>

              {/* Text */}
              <div className="pb-6">
                <div
                  className={`text-sm font-medium ${
                    done ? "text-accord-green" : active ? "text-white" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-xs text-gray-500">{s.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
