import { useState, useEffect } from "react";
import { BACKEND_URL } from "../config/constants";

export default function DeliverySimulation({ winner, contract, onResult }) {
  const [phase, setPhase] = useState("typing"); // typing, seller, evaluating, verdict
  const [sellerMessage, setSellerMessage] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [reasoning, setReasoning] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function runDelivery() {
      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/deliver`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: contract?.appId || null,
            task: winner?.task || "the assigned task",
            sellerName: winner?.seller,
            price: winner?.price,
            days: winner?.days,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Delivery evaluation failed");
        }

        const data = await res.json();
        if (cancelled) return;

        setSellerMessage(data.sellerMessage);
        setPhase("seller");

        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        setPhase("evaluating");

        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        setVerdict(data.verdict);
        setReasoning(data.reasoning);
        setPhase("verdict");

        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        onResult({
          verdict: data.verdict,
          verifyTxId: data.verifyTxId,
          releaseTxId: data.releaseTxId,
          refundTxId: data.refundTxId,
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    runDelivery();
    return () => { cancelled = true; };
  }, [contract?.appId, winner?.task, winner?.seller, winner?.price, winner?.days, onResult]);

  if (error) {
    return (
      <div className="animate-fade-in border border-accord-red/30 bg-accord-red/5 rounded-2xl p-6 mt-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-accord-red/20 flex items-center justify-center text-accord-red">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-accord-red font-bold text-lg">Evaluation Failed</div>
        </div>
        <p className="text-sm text-gray-300 ml-11">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mt-6 bg-accord-card/40 backdrop-blur-md border border-accord-border/80 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <svg className="w-32 h-32 text-accord-accent" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/>
        </svg>
      </div>
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accord-accent/20 flex items-center justify-center text-accord-accent">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white mb-0.5">Delivery Verification</h3>
          <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Autonomous Oracle Check</p>
        </div>
      </div>

      <div className="relative pl-6 border-l-2 border-accord-border/50 ml-4 space-y-8">
        {/* Seller typing / message */}
        <div className="relative">
          <div className="absolute -left-[35px] top-1 w-5 h-5 bg-accord-card border-2 border-accord-border rounded-full z-10" />
          
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
              style={{ backgroundColor: winner?.color || "#6366f1" }}
            >
              {winner?.avatar || "S"}
            </div>
            <span className="text-sm font-bold">{winner?.seller}</span>
            <span className="text-[11px] uppercase font-semibold tracking-wider text-gray-500 bg-accord-bg px-2 py-0.5 rounded-md border border-accord-border/40">Delivery Update</span>
          </div>

          {phase === "typing" ? (
            <div className="bg-accord-bg/60 border border-accord-border/40 shadow-sm rounded-xl rounded-tl-sm p-4 w-28 ml-11">
              <div className="flex items-center justify-center gap-1.5 h-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          ) : (
            <div className="bg-accord-bg/60 border border-accord-border/40 shadow-sm rounded-xl rounded-tl-sm p-4 ml-11 text-sm text-gray-200 leading-relaxed max-w-lg">
              {sellerMessage}
            </div>
          )}
        </div>

        {/* Oracle evaluation */}
        {(phase === "evaluating" || phase === "verdict") && (
          <div className="relative animate-fade-in">
            <div className={`absolute -left-[35px] top-1 w-5 h-5 bg-accord-card border-2 rounded-full z-10 ${phase === "verdict" ? (verdict === "on_time" ? "border-accord-green" : "border-accord-red") : "border-accord-accent"}`} />
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-accord-accent flex items-center justify-center text-sm font-bold text-white shadow">
                O
              </div>
              <span className="text-sm font-bold text-white">Delivery Oracle</span>
              <span className="text-[11px] uppercase font-semibold tracking-wider text-accord-accent bg-accord-accent/10 px-2 py-0.5 rounded-md border border-accord-accent/20">AI Verification</span>
            </div>

            {phase === "evaluating" ? (
              <div className="bg-accord-accent/5 border border-accord-accent/20 rounded-xl rounded-tl-sm p-4 ml-11 flex items-center gap-3 w-max">
                <div className="w-5 h-5 border-2 border-t-transparent border-accord-accent rounded-full animate-spin" />
                <span className="text-sm font-medium text-accord-accent">Evaluating delivery criteria...</span>
              </div>
            ) : (
              <div className={`rounded-xl rounded-tl-sm p-5 ml-11 border shadow-sm max-w-lg ${
                verdict === "on_time"
                  ? "bg-accord-green/5 border-accord-green/30"
                  : "bg-accord-red/5 border-accord-red/30"
              }`}>
                <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-3">
                  {verdict === "on_time" ? (
                    <div className="w-8 h-8 rounded-full bg-accord-green/20 flex items-center justify-center text-accord-green">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accord-red/20 flex items-center justify-center text-accord-red">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <span className={`font-bold text-base ${
                    verdict === "on_time" ? "text-accord-green" : "text-accord-red"
                  }`}>
                    {verdict === "on_time" ? "Delivery Accepted — Releasing Funds" : "Delivery Rejected — Refunding Buyer"}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
