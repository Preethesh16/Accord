import { Router } from "express";
import { config } from "../config/index.js";
import {
  callVerifyComplete,
  callReleaseFunds,
  callRefundBuyer,
} from "../services/algorandService.js";

const router = Router();

async function callLLM(prompt, systemPrompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.negotiation.timeoutMs);

  try {
    const res = await fetch(config.negotiation.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seller: "DeliveryOracle",
        task: prompt,
        budget: "0 ALGO",
        round: 1,
        offer_price: "0 ALGO",
        timeline: "0 days",
        system_prompt: systemPrompt,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`LLM error ${res.status}`);
    const data = await res.json();
    return data.message || null;
  } finally {
    clearTimeout(timeout);
  }
}

router.post("/", async (req, res, next) => {
  try {
    const { appId, task, sellerName, price, days } = req.body;
    if (!task || !sellerName) {
      return res.status(400).json({ error: "Missing task or sellerName" });
    }

    // Step 1: Seller AI generates delivery update
    let sellerMessage;
    try {
      const sellerPrompt = `You are ${sellerName}, a freelance developer. You were hired to do this task: "${task}" for ${price} ALGO with a ${days}-day deadline.

Write a short delivery update (3-4 sentences max). Describe what you built, mention specific technical details relevant to the task. Be natural — sometimes you deliver great work on time, sometimes you run into issues and deliver late or incomplete. Be realistic and varied. Do NOT use markdown or bullet points.`;

      sellerMessage = await callLLM(sellerPrompt, `You are ${sellerName}, delivering a project update.`);
    } catch (err) {
      console.warn("[Deliver] LLM seller fallback:", err.message);
    }

    if (!sellerMessage) {
      // Mock fallback
      const templates = [
        `Hey! I've completed "${task}". Built out the full implementation with clean code and basic tests. Everything's working as expected — ready for your review.`,
        `Update on "${task}": I ran into some unexpected complexity with the integration layer. I got the core functionality working but the edge cases took longer than planned. Submitting what I have — it's about 80% complete.`,
        `Done with "${task}"! Implemented all the requirements, added error handling, and wrote documentation. Deployed a test version to verify everything works end-to-end. Should be good to go.`,
        `Finished "${task}" but I'll be honest — I underestimated the scope. The main features work but I had to cut corners on testing to meet the deadline. Core functionality is solid though.`,
      ];
      sellerMessage = templates[Math.floor(Math.random() * templates.length)];
    }

    // Step 2: Oracle AI evaluates delivery
    let verdict = null;
    let reasoning = null;
    try {
      const oraclePrompt = `You are an impartial delivery oracle for a freelance escrow platform. Evaluate this delivery.

TASK: "${task}"
PRICE: ${price} ALGO
DEADLINE: ${days} days
SELLER: ${sellerName}

SELLER'S DELIVERY UPDATE:
"${sellerMessage}"

Based on the seller's update, decide:
- If the delivery sounds complete and on-time → respond with exactly: VERDICT: ON_TIME followed by a one-sentence reasoning
- If the delivery sounds incomplete, late, or has issues → respond with exactly: VERDICT: LATE followed by a one-sentence reasoning

You MUST start your response with either "VERDICT: ON_TIME" or "VERDICT: LATE". Then add your reasoning on the same line.`;

      const oracleResponse = await callLLM(oraclePrompt, "You are a fair and impartial delivery evaluation oracle. You must start your response with VERDICT: ON_TIME or VERDICT: LATE.");

      if (oracleResponse) {
        if (oracleResponse.includes("VERDICT: ON_TIME")) {
          verdict = "on_time";
          reasoning = oracleResponse.replace("VERDICT: ON_TIME", "").replace(/^[\s\-—:]+/, "").trim();
        } else if (oracleResponse.includes("VERDICT: LATE")) {
          verdict = "late";
          reasoning = oracleResponse.replace("VERDICT: LATE", "").replace(/^[\s\-—:]+/, "").trim();
        }
      }
    } catch (err) {
      console.warn("[Deliver] LLM oracle fallback:", err.message);
    }

    // Fallback if LLM didn't return a parseable verdict
    if (!verdict) {
      verdict = Math.random() < 0.7 ? "on_time" : "late";
      reasoning = verdict === "on_time"
        ? "Delivery update indicates task completion with adequate quality."
        : "Delivery update suggests incomplete work or missed deadline.";
    }

    // Step 3: Execute smart contract action
    let verifyTxId = null;
    let releaseTxId = null;
    let refundTxId = null;

    if (appId) {
      try {
        if (verdict === "on_time") {
          verifyTxId = await callVerifyComplete(appId);
          releaseTxId = await callReleaseFunds(appId);
        } else {
          refundTxId = await callRefundBuyer(appId);
        }
      } catch (err) {
        console.error("[Deliver] Contract call error:", err.message);
        // Still return the verdict even if chain call fails
      }
    }

    res.json({
      sellerMessage,
      verdict,
      reasoning,
      verifyTxId,
      releaseTxId,
      refundTxId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
