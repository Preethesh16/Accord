import algosdk from "algosdk";
import { ALGOD_SERVER, ALGOD_PORT, ALGOD_TOKEN } from "../config/constants";

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Decode base64 unsigned txns from backend, sign with Pera, submit
export async function fundDealFromBase64(fundTxns, wallet) {
  if (!Array.isArray(fundTxns) || fundTxns.length === 0) {
    throw new Error("No on-chain funding transactions are available for this deal");
  }

  // Preserve unsigned grouped bytes exactly as provided by backend
  const txnsToSign = fundTxns.map((t) => ({
    txn: Uint8Array.from(atob(t.txn), (c) => c.charCodeAt(0)),
    signers: [wallet.address],
  }));

  // Sign with Pera
  const signedTxns = await wallet.signTransactions(txnsToSign);

  // Submit to network
  const result = await algodClient.sendRawTransaction(signedTxns).do();
  return result.txId;
}
