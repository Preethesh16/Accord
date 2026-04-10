import { useState, useEffect, useRef } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect({ chainId: 416002 }); // TestNet

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setAddress(accounts[0]);
          setConnected(true);
          peraWallet.connector?.on("disconnect", handleDisconnect);
        }
      })
      .catch(() => {});
  }, []);

  const connect = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAddress(accounts[0]);
      setConnected(true);
      peraWallet.connector?.on("disconnect", handleDisconnect);
      return accounts[0];
    } catch (err) {
      console.error("Wallet connect failed:", err);
      return null;
    }
  };

  const disconnect = () => {
    peraWallet.disconnect();
    handleDisconnect();
  };

  const handleDisconnect = () => {
    setAddress(null);
    setConnected(false);
  };

  const signTransactions = async (txnGroups) => {
    const groups = Array.isArray(txnGroups?.[0]) ? txnGroups : [txnGroups];
    return await peraWallet.signTransaction(groups);
  };

  return { address, connected, connect, disconnect, signTransactions };
}
