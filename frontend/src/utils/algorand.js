import algosdk from "algosdk";
import { ALGOD_SERVER, ALGOD_PORT, ALGOD_TOKEN } from "../config/constants";

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Sign the grouped escrow funding transactions via Pera and submit them together.
export async function signAndSubmitFundingGroup(encodedTxns, wallet) {
  if (!Array.isArray(encodedTxns) || encodedTxns.length === 0) {
    throw new Error("No on-chain funding transactions are available for this deal");
  }

  const txnGroup = encodedTxns.map((entry) => ({
    txn: Uint8Array.from(atob(entry.txn), (c) => c.charCodeAt(0)),
    signers: [wallet.address],
  }));

  const signedTxns = await wallet.signTransactions(txnGroup);
  const result = await algodClient.sendRawTransaction(signedTxns).do();
  const txId = result.txId || result.txid;
  await algosdk.waitForConfirmation(algodClient, txId, 10);
  return txId;
}
