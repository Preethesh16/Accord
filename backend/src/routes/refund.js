import { Router } from "express";
import { callRefundBuyer } from "../services/algorandService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { appId } = req.body;
    if (!appId) return res.status(400).json({ error: "Missing appId" });

    const txId = await callRefundBuyer(appId);
    res.json({ success: true, txId });
  } catch (err) {
    next(err);
  }
});

export default router;
