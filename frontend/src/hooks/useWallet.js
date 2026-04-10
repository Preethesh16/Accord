import { useState, useEffect, useRef, useCallback } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";
import { ALGOD_SERVER, ALGOD_PORT, ALGOD_TOKEN } from "../config/constants";

const peraWallet = new PeraWalletConnect({ chainId: 416002 }); // TestNet
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const initialized = useRef(false);

  const fetchBalance = useCallback(async (addr) => {
    if (!addr) { setBalance(null); return; }
    try {
      const info = await algodClient.accountInformation(addr).do();
      const microAlgo = Number(info.amount || 0n);
      setBalance(Math.round((microAlgo / 1e6) * 10000) / 10000);
    } catch {
      setBalance(null);
    }
  }, []);

  const refreshBalance = useCallback(() => {
    if (address) fetchBalance(address);
  }, [address, fetchBalance]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setAddress(accounts[0]);
          setConnected(true);
          fetchBalance(accounts[0]);
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
      fetchBalance(accounts[0]);
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
    setBalance(null);
  };

  const signTransactions = async (txnGroups) => {
    const groups = Array.isArray(txnGroups?.[0]) ? txnGroups : [txnGroups];
    return await peraWallet.signTransaction(groups);
  };

  return { address, connected, balance, connect, disconnect, signTransactions, refreshBalance };
}
