export function pickWinner(messages, budget) {
  // Get final round offers only
  const maxRound = Math.max(...messages.map((m) => m.round));
  const finalOffers = messages.filter((m) => m.round === maxRound);

  const scored = finalOffers.map((offer) => {
    const costScore = 0.4 * (1 / offer.price);
    const speedScore = 0.3 * (1 / offer.days);
    const qualityScore = 0.3 * offer.quality;
    const total = Math.round((costScore + speedScore + qualityScore) * 100) / 100;
    return { ...offer, score: total };
  });

  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0];
  const savings = Math.round(((budget - winner.price) / budget) * 100);

  const loserNames = scored
    .slice(1)
    .map((s) => s.seller)
    .join(" and ");

  const explanation = `${winner.seller} wins with the best combined score of ${winner.score}. At ${winner.price} ALGO and ${winner.days}-day delivery, this offer beats ${loserNames} on the cost-speed-quality tradeoff. You save ${savings}% compared to your original budget of ${budget} ALGO.`;

  return {
    winner: {
      seller: winner.seller,
      sellerId: winner.sellerId,
      avatar: winner.avatar,
      color: winner.color,
      price: winner.price,
      days: winner.days,
      score: winner.score,
      savings: `${savings}%`,
      confidence: Math.min(95, Math.round(winner.score * 100)),
      explanation,
    },
    allScores: scored,
  };
}
