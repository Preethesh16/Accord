import algosdk from "algosdk";

export function estimateFundingRequirement(encodedTxns, senderAddress) {
  if (!Array.isArray(encodedTxns) || encodedTxns.length === 0) return 0;

  return encodedTxns.reduce((total, entry) => {
    const txn = algosdk.decodeUnsignedTransaction(
      Uint8Array.from(atob(entry.txn), (c) => c.charCodeAt(0))
    );

    if (txn.sender.toString() !== senderAddress) return total;

    const fee = Number(txn.fee || 0n) / 1e6;
    const amount = "amount" in txn && txn.amount !== undefined ? Number(txn.amount || 0n) / 1e6 : 0;
    return total + fee + amount;
  }, 0);
}

// Sign the grouped escrow funding transactions via Pera and return the signed blobs.
export async function signFundingGroup(encodedTxns, wallet) {
  if (!Array.isArray(encodedTxns) || encodedTxns.length === 0) {
    throw new Error("No on-chain funding transactions are available for this deal");
  }

  const txnGroup = encodedTxns.map((entry) => ({
    txn: algosdk.decodeUnsignedTransaction(
      Uint8Array.from(atob(entry.txn), (c) => c.charCodeAt(0))
    ),
    signers: [wallet.address],
  }));

  const signedTxns = await wallet.signTransactions(txnGroup);
  return signedTxns.flat().map((txn) => Buffer.from(txn).toString("base64"));
}
