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
    <div className="h-[100dvh] w-full flex flex-col">
      <header className="border-b border-accord-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accord-accent flex items-center justify-center font-bold text-sm">A</div>
          <h1 className="text-xl font-semibold tracking-tight">Accord</h1>
          <span className="text-xs text-gray-500 bg-accord-card px-2 py-0.5 rounded-full border border-accord-border">TestNet</span>
        </div>
        <WalletConnect
          address={wallet.address}
          balance={wallet.balance}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-accord-accent/20 flex items-center justify-center mb-6">
                <div className="w-8 h-8 rounded-lg bg-accord-accent flex items-center justify-center font-bold">A</div>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Accord</h2>
              <p className="text-gray-400 max-w-md">
                Connect your Pera Wallet to start a trustless deal. AI agents negotiate the best price, and funds are locked in smart contract escrow.
              </p>
            </div>
          )}

          {step === 1 && <BuyerForm onSubmit={handleSubmitTask} loading={loading} />}

          {error && (
            <div className="bg-accord-red/10 border border-accord-red/30 rounded-lg p-4 text-accord-red text-sm mb-4">
              {error}
            </div>
          )}

          {warning && (
            <div className="bg-accord-yellow/10 border border-accord-yellow/30 rounded-lg p-4 text-accord-yellow text-sm mb-4">
              {warning}
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
        </main>

        <aside className="w-72 border-l border-accord-border overflow-y-auto p-4 hidden lg:block">
          <StatusTimeline currentStep={step} />
        </aside>
      </div>
    </div>
  );
}
