import { Router } from "express";
import { callRefundBuyer } from "../services/algorandService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const txId = await callRefundBuyer();
    res.json({ success: true, txId });
  } catch (err) {
    next(err);
  }
});

export default router;
