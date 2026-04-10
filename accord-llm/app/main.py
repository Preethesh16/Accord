import json
import re
from collections import deque
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from hashlib import sha256

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.personas import PERSONAS, build_messages


class NegotiationRequest(BaseModel):
    seller: str = Field(..., examples=["SpeedyDev"])
    task: str = Field(..., examples=["Build a REST API"])
    budget: str = Field(..., examples=["10 ALGO"])
    round: int = Field(..., ge=1, examples=[1])
    offer_price: str = Field(..., examples=["8 ALGO"])
    timeline: str = Field(..., examples=["4 days"])
    negotiation_id: str | None = Field(default=None, examples=["neg_123"])


class NegotiationResponse(BaseModel):
    message: str
    price: str
    timeline: str
    negotiation_id: str


class NegotiationTurn(BaseModel):
    round: int
    price: str
    timeline: str
    message: str


class NegotiationSession:
    def __init__(self, negotiation_id: str):
        self.negotiation_id = negotiation_id
        self.updated_at = datetime.now(UTC)
        self.turns: deque[NegotiationTurn] = deque(maxlen=settings.history_max_turns)


class AppState:
    client: httpx.AsyncClient
    model: str | None = None
    sessions: dict[str, NegotiationSession]


state = AppState()


@asynccontextmanager
async def lifespan(_: FastAPI):
    state.client = httpx.AsyncClient(timeout=settings.request_timeout_seconds)
    state.model = await resolve_model_name()
    state.sessions = {}
    try:
        yield
    finally:
        await state.client.aclose()


app = FastAPI(title="Accord LLM Middleware", version="0.1.0", lifespan=lifespan)


async def resolve_model_name() -> str:
    if settings.llm_model:
        return settings.llm_model

    try:
        response = await state.client.get(f"{settings.llm_base_url}/models")
        response.raise_for_status()
        payload = response.json()
        models = payload.get("data", [])
        if not models:
            raise RuntimeError("No models returned by upstream")
        return models[0]["id"]
    except Exception as exc:
        raise RuntimeError(f"Unable to resolve upstream model: {exc}") from exc


def extract_json_object(content: str) -> dict:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def extract_message_content(choice_message: dict) -> str | None:
    content = choice_message.get("content")
    if isinstance(content, str) and content.strip():
        return content

    reasoning_content = choice_message.get("reasoning_content")
    if isinstance(reasoning_content, str) and "{" in reasoning_content and "}" in reasoning_content:
        try:
            match = re.search(r"\{.*\}", reasoning_content, re.DOTALL)
            if match:
                return match.group(0)
        except Exception:
            pass

    return None


def normalize_response(payload: dict, offer_price: str, timeline: str) -> NegotiationResponse:
    message = str(payload.get("message", "")).strip()
    price = str(payload.get("price", offer_price)).strip() or offer_price
    final_timeline = str(payload.get("timeline", timeline)).strip() or timeline

    if not re.search(r"[A-Za-z]", price):
        price = offer_price

    if not re.search(r"[A-Za-z]", final_timeline):
        final_timeline = timeline

    if not message:
        raise ValueError("Missing message in model response")

    return NegotiationResponse(message=message, price=price, timeline=final_timeline, negotiation_id="")


def build_session_key(request: NegotiationRequest) -> str:
    if request.negotiation_id:
        return request.negotiation_id

    fingerprint = "|".join(
        [
            request.seller.strip().lower(),
            request.task.strip().lower(),
            request.budget.strip().lower(),
        ]
    )
    return f"neg_{sha256(fingerprint.encode()).hexdigest()[:16]}"


def prune_sessions() -> None:
    cutoff = datetime.now(UTC) - timedelta(minutes=settings.session_ttl_minutes)
    expired = [key for key, session in state.sessions.items() if session.updated_at < cutoff]
    for key in expired:
        state.sessions.pop(key, None)


def get_or_create_session(request: NegotiationRequest) -> NegotiationSession:
    prune_sessions()
    session_key = build_session_key(request)
    session = state.sessions.get(session_key)
    if session is None or request.round <= 1:
        session = NegotiationSession(session_key)
        state.sessions[session_key] = session
    session.updated_at = datetime.now(UTC)
    return session


async def call_upstream(request: NegotiationRequest) -> NegotiationResponse:
    session = get_or_create_session(request)
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"

    upstream_payload = {
        "model": state.model,
        "messages": build_messages(
            seller=request.seller,
            task=request.task,
            budget=request.budget,
            round_number=request.round,
            offer_price=request.offer_price,
            timeline=request.timeline,
            history=[turn.model_dump() for turn in session.turns],
        ),
        "temperature": settings.temperature,
        "top_p": settings.top_p,
        "max_tokens": settings.max_tokens,
        "reasoning_effort": settings.reasoning_effort,
    }

    response = await state.client.post(
        f"{settings.llm_base_url}/chat/completions",
        headers=headers,
        json=upstream_payload,
    )
    response.raise_for_status()
    payload = response.json()
    choice_message = payload["choices"][0]["message"]
    content = extract_message_content(choice_message)

    try:
        parsed = extract_json_object(content)
        normalized = normalize_response(parsed, request.offer_price, request.timeline)
    except Exception:
        normalized = NegotiationResponse(
            message=(content or "I can take this on and move quickly.").strip()[:280]
            or "I can take this on and move quickly.",
            price=request.offer_price,
            timeline=request.timeline,
            negotiation_id="",
        )

    session.turns.append(
        NegotiationTurn(
            round=request.round,
            price=normalized.price,
            timeline=normalized.timeline,
            message=normalized.message,
        )
    )
    session.updated_at = datetime.now(UTC)
    normalized.negotiation_id = session.negotiation_id
    return normalized


@app.get("/health")
async def health() -> dict:
    try:
        response = await state.client.get(f"{settings.llm_base_url}/models")
        response.raise_for_status()
        upstream_status = "ok"
    except Exception as exc:
        upstream_status = f"error: {exc}"

    return {
        "status": "ok",
        "upstream_status": upstream_status,
        "upstream_base_url": settings.llm_base_url,
        "model": state.model,
        "reasoning_effort": settings.reasoning_effort,
        "active_sessions": len(state.sessions),
        "personas": sorted(PERSONAS),
    }


@app.post("/negotiate", response_model=NegotiationResponse)
async def negotiate(request: NegotiationRequest) -> NegotiationResponse:
    if request.seller not in PERSONAS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown seller '{request.seller}'. Valid sellers: {', '.join(sorted(PERSONAS))}",
        )

    try:
        return await call_upstream(request)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream LLM error: {exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Unable to reach upstream LLM: {exc}") from exc
