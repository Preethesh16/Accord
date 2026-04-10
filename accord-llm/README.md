# Accord LLM Middleware

Separate FastAPI middleware for Accord seller negotiation personas.

This service is designed to sit in front of an OpenAI-compatible LLM endpoint such as vLLM and expose:

- `GET /health`
- `POST /negotiate`

It is intentionally separate from the existing Node negotiation flow in the main Accord backend.

## Default Ports

- Upstream LLM: `http://127.0.0.1:8001/v1`
- Middleware: `http://0.0.0.0:9000`

## Local Run

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 9000
```

## Benchmark

```bash
uv run python scripts/benchmark.py
```
