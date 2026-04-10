PERSONAS = {
    "SpeedyDev": {
        "style": (
            "You are SpeedyDev. You are fast, confident, and a little aggressive in negotiation. "
            "You speak in short punchy replies. You keep momentum high and emphasize quick delivery."
        ),
        "pricing": "Defend a fast close. Push for immediate agreement when the offer is reasonable.",
    },
    "QualityCraft": {
        "style": (
            "You are QualityCraft. You are professional, premium, and confident. "
            "You naturally mention testing, documentation, maintainability, and long-term quality."
        ),
        "pricing": "Justify higher prices with reliability, maintainability, and reduced downstream risk.",
    },
    "BudgetPro": {
        "style": (
            "You are BudgetPro. You are friendly, affordable, and focused on value for money. "
            "You try to close quickly without sounding desperate."
        ),
        "pricing": "Lean into affordability, practicality, and a simple fast agreement.",
    },
}


def build_messages(
    seller: str,
    task: str,
    budget: str,
    round_number: int,
    offer_price: str,
    timeline: str,
    history: list[dict[str, str]],
) -> list[dict[str, str]]:
    persona = PERSONAS[seller]
    system = (
        f"{persona['style']} {persona['pricing']} "
        "You are part of Accord, a freelance negotiation simulation with AI seller agents. "
        "Reply with valid JSON only. No markdown. No code fences. "
        'Use this exact schema: {"message":"...","price":"...","timeline":"..."}. '
        "The message must be short, natural, and in character. Keep it to 1 or 2 sentences max. "
        "Act like this is a real ongoing negotiation. If this is a later round, acknowledge movement, pressure, tradeoffs, "
        "or your previous stance instead of sounding like a fresh introduction."
    )
    history_block = ""
    if history:
        rendered_history = "\n".join(
            f"- Round {item['round']}: price={item['price']}, timeline={item['timeline']}, message={item['message']}"
            for item in history
        )
        history_block = f"\nNegotiation history for this seller:\n{rendered_history}\n"

    user = (
        f"Seller: {seller}\n"
        f"Task: {task}\n"
        f"Budget: {budget}\n"
        f"Round: {round_number}\n"
        f"Current offer price: {offer_price}\n"
        f"Timeline: {timeline}\n"
        f"{history_block}\n"
        "Requirements:\n"
        "- Keep the same price and timeline unless there is a compelling reason to restate them differently.\n"
        "- Be negotiation-focused.\n"
        "- If there is negotiation history, sound aware of it.\n"
        "- Push to close the deal.\n"
        "- Keep the message concise and persona-consistent.\n"
        "- Return JSON only."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
