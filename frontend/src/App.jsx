import { useState, useCallback } from "react";
import WalletConnect from "./components/WalletConnect";
import BuyerForm from "./components/BuyerForm";
import ChatWindow from "./components/ChatWindow";
import DealSummary from "./components/DealSummary";
import ContractConditions from "./components/ContractConditions";
import StatusTimeline from "./components/StatusTimeline";
import EscrowStatus from "./components/EscrowStatus";
import DeliverySimulation from "./components/DeliverySimulation";
import { BACKEND_URL } from "./config/constants";
import { useWallet } from "./hooks/useWallet";
import { estimateFundingRequirement, signFundingGroup } from "./utils/algorand";

// Steps: 0=connect, 1=form, 2=negotiating, 3=deal ready, 4=funding, 5=delivery sim, 6=resolved

export default function App() {
  const wallet = useWallet();
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [winner, setWinner] = useState(null);
  const [contract, setContract] = useState(null);
  const [fundTxns, setFundTxns] = useState([]);
  const [fundTxHash, setFundTxHash] = useState(null);
  const [verifyTxHash, setVerifyTxHash] = useState(null);
  const [releaseTxHash, setReleaseTxHash] = useState(null);
  const [refundTxHash, setRefundTxHash] = useState(null);
  const [deliveryOutcome, setDeliveryOutcome] = useState(null);
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const [deliveryLoading] = useState(false); // kept for compatibility
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  const notify = useCallback(async (msg) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([150, 80, 150]);
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") await Notification.requestPermission();
    if (Notification.permission === "granted") new Notification("Accord", { body: msg });
  }, []);

  const handleConnect = async () => {
    const addr = await wallet.connect();
    if (addr) setStep(1);
  };

  const handleDisconnect = () => {
    wallet.disconnect();
    setStep(0);
    setMessages([]);
    setWinner(null);
    setContract(null);
    setFundTxns([]);
    setFundTxHash(null);
    setVerifyTxHash(null);
    setReleaseTxHash(null);
    setRefundTxHash(null);
    setDeliveryOutcome(null);
    setError(null);
    setWarning(null);
    setFunding(false);
  };

  const fetchContractState = useCallback(async (appId) => {
    const res = await fetch(`${BACKEND_URL}/api/contract/${appId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.state || null;
  }, []);

  // Step 1→2→3: Negotiate
  const handleSubmitTask = useCallback(async (formData) => {
    setStep(2);
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/negotiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: formData.task,
          budget: formData.budget,
          deadline: formData.deadline,
          buyerAddress: wallet.address,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Negotiation failed");
      }

      const data = await res.json();
      setMessages(data.messages);
      setWinner(data.winner);
      setContract(data.contract);
      setFundTxns(data.fundTxns || []);
      setWarning(data.warning || null);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  }, [wallet.address]);

  const handleChatDone = useCallback(() => setStep(3), []);

  // Step 3→4→5: Buyer pays via Pera, then oracle confirms on contract
  const handleFundEscrow = async () => {
    if (funding) return;

    setError(null);
    setWarning(null);

    try {
      if (contract?.demoMode || !Array.isArray(fundTxns) || fundTxns.length === 0) {
        setStep(4);
        setFunding(true);
        // Demo mode — no real transaction
        setWarning("Demo mode: simulated transaction.");
        setFundTxHash(`SIM_FUND_${Date.now()}`);
        setStep(5);
        setFunding(false);
        return;
      }

      const requiredAlgo = estimateFundingRequirement(fundTxns, wallet.address);
      if (wallet.spendableBalance !== null && wallet.spendableBalance + 1e-9 < requiredAlgo) {
        throw new Error(
          `Insufficient spendable balance. Funding this escrow needs about ${requiredAlgo.toFixed(4)} ALGO, but this wallet only has ${wallet.spendableBalance.toFixed(4)} ALGO available to spend. Top up the wallet or use a fresh TestNet buyer account.`
        );
      }

      setStep(4);
      setFunding(true);

      // Buyer signs in Pera, then the backend submits the signed group and confirms it.
      const signedTxns = await signFundingGroup(fundTxns, wallet);
      const fundRes = await fetch(`${BACKEND_URL}/api/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTxns }),
      });
      if (!fundRes.ok) {
        const errData = await fundRes.json();
        throw new Error(errData.error || "Funding submission failed");
      }
      const fundData = await fundRes.json();
      const payTxId = fundData.txId;
      setFundTxHash(payTxId);
      console.log("[Fund] Buyer payment confirmed:", payTxId);

      setStep(5);
      wallet.refreshBalance?.();
      await notify(`Escrow funded: ${winner.price} ALGO deducted from your wallet`);

      if (contract?.appId) {
        setTimeout(async () => {
          const state = await fetchContractState(contract.appId);
          if (state?.status && Number(state.status) >= 2) {
            setWarning(null);
          } else {
            setWarning("Funding was submitted. If Explorer is slow to update, wait a moment before testing delivery.");
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Fund error:", err);
      setError(err.message || "Funding failed");
      setFundTxHash(null);
      setWarning("Escrow funding did not complete. Review the wallet balance and try again.");
      setStep(3);
    } finally {
      setFunding(false);
    }
  };

  // Step 5→6: AI delivery evaluation result
  const handleDeliveryResult = async (result) => {
    if (result.verdict === "on_time") {
      setVerifyTxHash(result.verifyTxId || `SIM_VERIFY_${Date.now()}`);
      setReleaseTxHash(result.releaseTxId || `SIM_RELEASE_${Date.now()}`);
      setDeliveryOutcome("released");
      await notify(`Deal complete: ${winner.price} ALGO released to seller`);
    } else {
      setRefundTxHash(result.refundTxId || `SIM_REFUND_${Date.now()}`);
      setDeliveryOutcome("refunded");
      await notify(`Delivery late: ${winner.price} ALGO refunded to your wallet`);
    }
    setStep(6);
    wallet.refreshBalance?.();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#0b0f19] text-gray-200 font-sans selection:bg-accord-accent/30 overflow-hidden">
      <header className="relative z-10 border-b border-accord-border/50 bg-[#0b0f19]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accord-accent to-[#4f46e5] flex items-center justify-center font-bold text-white shadow-lg shadow-accord-accent/20">A</div>
          <h1 className="text-xl font-bold tracking-tight text-white">Accord</h1>
          <span className="text-[10px] uppercase tracking-widest font-bold text-accord-accent bg-accord-accent/10 px-2.5 py-1 rounded-md border border-accord-accent/20 ml-1">TestNet</span>
        </div>
        <WalletConnect
          address={wallet.address}
          balance={wallet.balance}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accord-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 relative z-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            {step === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-accord-accent/20 rounded-full blur-xl animate-pulse" />
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accord-card to-accord-bg border border-accord-border flex items-center justify-center relative z-10 shadow-xl shadow-black/20">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accord-accent to-[#4f46e5] flex items-center justify-center font-bold text-white text-xl shadow-inner">A</div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Welcome to Accord</h2>
                <p className="text-gray-400 max-w-md text-base leading-relaxed mb-10">
                  Connect your Pera Wallet to start a highly secure, trustless deal. AI agents negotiate the optimal price, and funds are strictly locked in an Algorand smart contract escrow.
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold uppercase tracking-widest bg-accord-card/50 px-4 py-2 rounded-lg border border-accord-border/50">
                    <svg className="w-4 h-4 text-accord-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Trustless Escrow
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold uppercase tracking-widest bg-accord-card/50 px-4 py-2 rounded-lg border border-accord-border/50">
                    <svg className="w-4 h-4 text-accord-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Driven
                  </div>
                </div>
              </div>
            )}

            {step === 1 && <BuyerForm onSubmit={handleSubmitTask} loading={loading} />}

            {error && (
              <div className="animate-fade-in bg-accord-red/10 border border-accord-red/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <svg className="w-5 h-5 text-accord-red shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-accord-red text-sm font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {warning && (
              <div className="animate-fade-in bg-accord-yellow/10 border border-accord-yellow/30 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                <svg className="w-5 h-5 text-accord-yellow shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-accord-yellow text-sm font-medium leading-relaxed">{warning}</div>
              </div>
            )}

          {step >= 2 && (
            <div className="space-y-6">
              <ChatWindow
                messages={messages}
                isNegotiating={step === 2}
                onDone={handleChatDone}
              />

              {step >= 3 && winner && contract && (
                <>
                  <DealSummary
                    winner={winner}
                    onFund={handleFundEscrow}
                    funded={step >= 4}
                    funding={funding}
                    spendableBalance={wallet.spendableBalance}
                  />
                  <ContractConditions
                    contract={contract}
                    funded={step >= 5}
                  />
                </>
              )}

              {step >= 4 && (
                <EscrowStatus
                  status={
                    step === 4 ? "funding" :
                    step === 5 ? "funded" :
                    deliveryOutcome === "held" ? "held" :
                    deliveryOutcome === "refunded" ? "refunded" : "complete"
                  }
                  txHash={fundTxHash}
                  verifyTxHash={verifyTxHash}
                  releaseTxHash={releaseTxHash}
                  refundTxHash={refundTxHash}
                  dealAmount={winner?.price}
                />
              )}

              {step === 5 && (
                <DeliverySimulation
                  winner={winner}
                  contract={contract}
                  onResult={handleDeliveryResult}
                />
              )}
            </div>
          )}
        </div>
      </main>

        <aside className="w-80 border-l border-accord-border/50 bg-[#0b0f19] overflow-y-auto p-6 hidden lg:block relative z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
          <StatusTimeline currentStep={step} />

          {wallet.address && (
            <div className="mt-8 border border-accord-border/60 bg-accord-card/40 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Wallet Portfolio</h3>
              <div className="space-y-4">
                <div className="bg-accord-bg/60 border border-accord-border/50 rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Balance</div>
                  <div className="text-2xl font-mono font-bold text-white flex items-baseline gap-1">
                    {wallet.balance !== null ? wallet.balance : "—"}
                    <span className="text-xs text-accord-accent font-sans">ALGO</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="bg-accord-bg/40 border border-accord-border/30 rounded-lg p-3 flex justify-between items-center">
                    <div className="text-[11px] uppercase text-gray-400 font-semibold flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accord-green" /> Spendable
                    </div>
                    <div className="text-sm font-mono font-bold text-accord-green">
                      {wallet.spendableBalance !== null ? wallet.spendableBalance : "—"}
                    </div>
                  </div>
                  <div className="bg-accord-bg/40 border border-accord-border/30 rounded-lg p-3 flex justify-between items-center">
                    <div className="text-[11px] uppercase text-gray-400 font-semibold flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accord-yellow" /> Locked
                    </div>
                    <div className="text-sm font-mono font-bold text-accord-yellow">
                      {wallet.minBalance !== null ? wallet.minBalance : "—"}
                    </div>
                  </div>
                </div>
                <div className="pt-3 mt-1 border-t border-accord-border/50 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Address</span>
                  <div className="text-xs text-gray-400 font-mono bg-accord-bg px-2 py-1 rounded" title={wallet.address}>
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-6)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
