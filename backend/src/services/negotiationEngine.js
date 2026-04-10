import { config } from "../config/index.js";
import { sellers } from "./sellers.js";

const USE_AI = !!config.anthropicApiKey;
let anthropic = null;

if (USE_AI) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
}

const mockTemplates = {
  speedy: {
    1: (task, price, days) =>
      `I can tackle "${task}" in just ${days} days for ${price} ALGO. Speed is my game — I'll have a working version in your hands before you know it. Let's move fast!`,
    2: (task, price, days) =>
      `Final offer: ${price} ALGO, ${days} days. I'll include basic tests and a README. I can start within the hour — no one delivers faster than me.`,
  },
  quality: {
    1: (task, price, days) =>
      `I'd be happy to deliver "${task}" in ${days} days for ${price} ALGO. My approach includes comprehensive testing, clean architecture, and thorough documentation. Quality you can build on.`,
    2: (task, price, days) =>
      `I'll come down to ${price} ALGO with a ${days}-day timeline. That includes full test coverage, CI/CD setup, and one week of post-delivery bug fixes. You get production-grade work.`,
  },
  budget: {
    1: (task, price, days) =>
      `I can handle "${task}" for just ${price} ALGO in ${days} days. I've built dozens of similar projects and deliver solid, reliable work at the best price point in the market.`,
    2: (task, price, days) =>
      `Best I can do: ${price} ALGO, ${days} days. Clean code, documented endpoints, and one revision round included. You won't find better value anywhere.`,
  },
};

function computeOffer(seller, budget, round, totalRounds) {
  const priceRange = budget * seller.maxPrice - budget * seller.minPrice;
  const discount = (round / totalRounds) * priceRange * 0.5;
  const price = Math.round((budget * seller.maxPrice - discount) * 100) / 100;

  const dayRange = seller.deliveryDays.max - seller.deliveryDays.min;
  const speedup = Math.floor((round / totalRounds) * dayRange * 0.3);
  const days = seller.deliveryDays.max - speedup;

  return { price: Math.max(price, budget * seller.minPrice), days };
}

async function generateMessage(seller, task, budget, offer, round, history) {
  if (!USE_AI) {
    return mockTemplates[seller.id][round](task, offer.price, offer.days);
  }

  const historyText = history.length
    ? `\nPrevious messages in this negotiation:\n${history.map((h) => `- ${h.seller} (Round ${h.round}): ${h.message}`).join("\n")}`
    : "";

  const prompt = `You are bidding on this task: "${task}"
The buyer's budget is ${budget} ALGO.
This is round ${round} of the negotiation.
Your offer: ${offer.price} ALGO, delivery in ${offer.days} days.
${historyText}

Write a short negotiation message (2-3 sentences max). State your price and timeline. Be persuasive in your unique style. Do NOT use markdown or bullet points.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: seller.personality,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text;
}

async function generateMessageWithMiddleware(seller, task, budget, offer, round, sessionId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.negotiation.timeoutMs);

  try {
    const res = await fetch(config.negotiation.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seller: seller.name,
        task,
        budget: `${budget} ALGO`,
        round,
        offer_price: `${offer.price} ALGO`,
        timeline: `${offer.days} days`,
        negotiation_id: sessionId || undefined,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Negotiation middleware error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return {
      message: data.message || mockTemplates[seller.id][round](task, offer.price, offer.days),
      negotiationId: data.negotiation_id || sessionId || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runNegotiation(task, budget, deadline) {
  const totalRounds = 2;
  const messages = [];
  const sessionIds = new Map();

  for (let round = 1; round <= totalRounds; round++) {
    for (const seller of sellers) {
      const offer = computeOffer(seller, budget, round, totalRounds);
      let message;
      let negotiationId = sessionIds.get(seller.name) || null;

      try {
        const result = await generateMessageWithMiddleware(
          seller,
          task,
          budget,
          offer,
          round,
          negotiationId
        );
        message = result.message;
        negotiationId = result.negotiationId;
      } catch (err) {
        console.warn(
          `[Negotiate] Middleware fallback for ${seller.name} round ${round}:`,
          err.message
        );
        message = await generateMessage(seller, task, budget, offer, round, messages);
      }

      if (negotiationId) {
        sessionIds.set(seller.name, negotiationId);
      }

      messages.push({
        seller: seller.name,
        sellerId: seller.id,
        avatar: seller.avatar,
        color: seller.color,
        round,
        price: offer.price,
        days: offer.days,
        quality: seller.qualityScore,
        message,
      });
    }
  }

  return messages;
}
