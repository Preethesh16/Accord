import algosdk from "algosdk";
import { ALGOD_SERVER, ALGOD_PORT, ALGOD_TOKEN } from "../config/constants";

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Sign a single simple payment via Pera and submit
export async function signAndSubmitPayment(base64Txn, wallet) {
  // Decode the unsigned payment from base64
  const txnBytes = Uint8Array.from(atob(base64Txn), (c) => c.charCodeAt(0));

  // Ask Pera to sign — single payment, no group, no app call
  const signedTxns = await wallet.signTransactions([
    { txn: txnBytes, signers: [wallet.address] },
  ]);

  // Submit signed payment to Algorand
  const result = await algodClient.sendRawTransaction(signedTxns).do();
  const txId = result.txId || result.txid;
  await algosdk.waitForConfirmation(algodClient, txId, 10);
  return txId;
}
