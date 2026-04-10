import { Router } from "express";
import { v4 as uuid } from "uuid";
import { runNegotiation } from "../services/negotiationEngine.js";
import { pickWinner } from "../services/optimizer.js";
import {
  deployDealContract,
  createDealOnContract,
  buildFundTxn,
  SELLER_ADDRESS,
} from "../services/algorandService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { task, budget, deadline, buyerAddress } = req.body;

    if (!task || !budget || !deadline || !buyerAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const dealId = uuid();

    // 1. Run AI negotiation
    console.log("[Negotiate] Starting negotiation...");
    const messages = await runNegotiation(task, budget, deadline);
    const { winner, allScores } = pickWinner(messages, budget);
    console.log("[Negotiate] Winner picked:", winner.seller, winner.price);

    let contract;
    let txns = [];
    let warning = null;

    try {
      // 2. Deploy a new contract for this deal
      console.log("[Negotiate] Deploying contract...");
      const { appId, appAddr, deployTxId } = await deployDealContract();
      console.log("[Negotiate] Contract deployed. AppID:", appId);

      // 3. Create deal with conditions on the contract
      const { createTxId, conditions } = await createDealOnContract(
        appId,
        buyerAddress,
        winner.price,
        deadline
      );

      // 4. Build unsigned fund transactions for Pera
      const fund = await buildFundTxn(appId, buyerAddress, winner.price);
      txns = fund.txns;

      contract = {
        appId,
        appAddr,
        deployTxId,
        createTxId,
        conditions,
        seller: SELLER_ADDRESS,
        demoMode: false,
      };
    } catch (chainErr) {
      warning = "Demo mode active: on-chain escrow is temporarily unavailable, so this run uses simulated transactions.";
      console.warn("[Negotiate]", warning, chainErr.message);

      contract = {
        appId: null,
        appAddr: null,
        deployTxId: null,
        createTxId: null,
        conditions: {
          buyer: buyerAddress,
          seller: SELLER_ADDRESS,
          amount: winner.price,
          amountMicroAlgo: Math.round(winner.price * 1e6),
          deadline: new Date(Date.now() + Number(deadline) * 86400 * 1000).toISOString(),
          deadlineTimestamp: Math.floor(Date.now() / 1000) + Number(deadline) * 86400,
        },
        seller: SELLER_ADDRESS,
        demoMode: true,
      };
    }

    res.json({
      dealId,
      messages,
      winner,
      allScores,
      contract,
      fundTxns: txns,
      warning,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
