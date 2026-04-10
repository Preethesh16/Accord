import { Router } from "express";
import algosdk from "algosdk";
import { config } from "../config/index.js";

const router = Router();
const algodClient = new algosdk.Algodv2(config.algod.token, config.algod.server, config.algod.port);

router.post("/", async (req, res, next) => {
  try {
    const { signedTxns } = req.body;

    if (!Array.isArray(signedTxns) || signedTxns.length === 0) {
      return res.status(400).json({ error: "Missing signedTxns" });
    }

    const blobs = signedTxns.map((txn) => Buffer.from(txn, "base64"));
    const result = await algodClient.sendRawTransaction(blobs).do();
    const txId = result.txId || result.txid;
    await algosdk.waitForConfirmation(algodClient, txId, 10);

    res.json({ success: true, txId });
  } catch (err) {
    if (typeof err.message === "string" && err.message.includes("balance") && err.message.includes("below min")) {
      err.message = `${err.message}. The connected buyer wallet does not have enough spendable TestNet ALGO for this escrow payment. Top up the wallet or use a fresh TestNet buyer account.`;
    }
    next(err);
  }
});

export default router;
