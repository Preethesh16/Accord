import { Router } from "express";
import { getContractState } from "../services/algorandService.js";

const router = Router();

router.get("/:appId", async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    if (!Number.isFinite(appId) || appId <= 0) {
      return res.status(400).json({ error: "Invalid appId" });
    }

    const state = await getContractState(appId);
    if (!state) {
      return res.status(404).json({ error: "Contract state not found" });
    }

    res.json({ appId, state });
  } catch (err) {
    next(err);
  }
});

export default router;
