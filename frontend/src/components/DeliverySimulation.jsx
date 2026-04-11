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
      // Phase 1: Show typing for 2s
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

        // Phase 2: Show seller message
        setSellerMessage(data.sellerMessage);
        setPhase("seller");

        // Wait 2s then show evaluating
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        setPhase("evaluating");

        // Wait 2s then show verdict
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        setVerdict(data.verdict);
        setReasoning(data.reasoning);
        setPhase("verdict");

        // Wait 2s then trigger outcome
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
  }, []);

  if (error) {
    return (
      <div className="animate-fade-in border border-accord-red/30 bg-accord-red/5 rounded-xl p-6">
        <div className="text-accord-red font-medium mb-2">Delivery Evaluation Failed</div>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in border border-accord-border bg-accord-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">AI Delivery Evaluation</h3>

      {/* Seller typing / message */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: winner?.color || "#6366f1" }}
          >
            {winner?.avatar || "S"}
          </div>
          <span className="text-sm font-medium">{winner?.seller}</span>
          <span className="text-xs text-gray-500">Delivery Update</span>
        </div>

        {phase === "typing" ? (
          <div className="bg-accord-bg rounded-lg p-4 ml-11">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : (
          <div className="bg-accord-bg rounded-lg p-4 ml-11 text-sm text-gray-300">
            {sellerMessage}
          </div>
        )}
      </div>

      {/* Oracle evaluation */}
      {(phase === "evaluating" || phase === "verdict") && (
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-accord-accent flex items-center justify-center text-sm font-bold text-white">
              O
            </div>
            <span className="text-sm font-medium">Delivery Oracle</span>
            <span className="text-xs text-gray-500">AI Evaluation</span>
          </div>

          {phase === "evaluating" ? (
            <div className="bg-accord-bg rounded-lg p-4 ml-11 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-t-transparent border-accord-accent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Evaluating delivery...</span>
            </div>
          ) : (
            <div className={`rounded-lg p-4 ml-11 border ${
              verdict === "on_time"
                ? "bg-accord-green/5 border-accord-green/30"
                : "bg-accord-red/5 border-accord-red/30"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {verdict === "on_time" ? (
                  <svg className="w-5 h-5 text-accord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-accord-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`font-semibold text-sm ${
                  verdict === "on_time" ? "text-accord-green" : "text-accord-red"
                }`}>
                  {verdict === "on_time" ? "Delivery Accepted — Releasing Funds" : "Delivery Rejected — Refunding Buyer"}
                </span>
              </div>
              <p className="text-sm text-gray-400">{reasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
