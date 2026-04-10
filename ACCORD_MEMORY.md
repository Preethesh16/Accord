# Accord Memory

This file is the shared running memory for work done on the Accord project so progress stays visible across sessions and tools.

## Purpose

- Track what the project currently does
- Track what has been added to the system and repo
- Preserve deployment decisions and open questions
- Append updates here instead of creating new memory files

## Current Project Understanding

Date: 2026-04-10

Accord is currently a full-stack project with:

- `frontend/`: React + Vite UI
- `backend/`: Express API with negotiation, verify, release, and refund routes
- `contract/`: Algorand escrow smart contract code and artifacts

The existing negotiation flow is already implemented in the Node backend and should remain in place for now.

Relevant existing files:

- `backend/src/routes/negotiate.js`
- `backend/src/services/negotiationEngine.js`
- `backend/src/services/sellers.js`
- `backend/src/server.js`

## Existing Negotiation Behavior

- `POST /api/negotiate` runs a multi-round negotiation
- Three seller personas already exist:
  - `SpeedyDev`
  - `QualityCraft`
  - `BudgetPro`
- The current engine uses:
  - Anthropic Claude if `ANTHROPIC_API_KEY` is set
  - mock seller templates otherwise
- The backend also tries to deploy/use Algorand escrow after picking a winning seller
- If on-chain work fails, it falls back to a demo mode response

## New Goal Being Planned

Add a separate open-source LLM negotiation backend on this ROCm machine without removing the current dummy/mock/backend flow yet.

Planned addition:

- Run `vLLM` with ROCm in Docker on port `8000`
- Auto-select model based on detected VRAM:
  - Prefer `meta-llama/Meta-Llama-3-8B-Instruct`
  - Fallback `mistralai/Mistral-7B-Instruct-v0.3`
  - If VRAM is at least `48 GB`, use `openai/gpt-oss-20b`
- Store model cache in `/root/.cache/huggingface`
- Add a separate FastAPI middleware service in `/root/accord-llm`
- Expose middleware on port `9000`
- Forward middleware requests to `http://localhost:8000/v1/chat/completions`
- Keep current Accord app code intact while this is built and tested separately

## Planned Middleware API

Primary endpoint:

- `POST /negotiate`

Expected input:

```json
{
  "seller": "SpeedyDev",
  "task": "Build a REST API",
  "budget": "10 ALGO",
  "round": 1,
  "offer_price": "8 ALGO",
  "timeline": "4 days"
}
```

Expected output:

```json
{
  "message": "short seller negotiation response",
  "price": "8 ALGO",
  "timeline": "4 days"
}
```

Additional planned endpoint:

- `GET /health`

## Seller Persona Requirements For New Middleware

### SpeedyDev

- fast, confident
- short punchy replies
- emphasizes delivery speed
- slightly aggressive negotiation

### QualityCraft

- professional
- mentions testing, documentation, maintainability
- justifies higher prices
- confident premium tone

### BudgetPro

- friendly
- affordable
- value for money
- tries to close quickly

## Deployment Requirements To Execute Later

- Verify ROCm GPU with `rocm-smi`
- Install Docker if missing
- Pull latest ROCm-compatible `vLLM` image
- Start vLLM OpenAI-compatible server on port `8000`
- Build FastAPI middleware separately from current backend
- Add benchmark script for 6 sequential negotiations
- Add Docker Compose for middleware
- Add systemd service for both containers
- Open UFW ports `8000` and `9000`
- Ensure services auto-restart on reboot
- Optimize for low latency and stable short negotiation replies

## Performance Constraints

- 6 total API calls should finish in under 30 seconds
- Use small `max_tokens`
- Prefer stable generation settings for persona consistency
- No authentication required for this deployment

## Important Working Rule

Do not remove or overwrite the existing dummy/current negotiation implementation yet. Build the new LLM-backed negotiation service separately inside the Accord project context first, validate it, then decide on integration.

## Change Log

### 2026-04-10

- Inspected repository structure and confirmed this is an existing full-stack Accord app
- Confirmed current negotiation route lives in `backend/src/routes/negotiate.js`
- Confirmed seller personas already exist in `backend/src/services/sellers.js`
- Confirmed current negotiation engine uses Claude or mock templates in `backend/src/services/negotiationEngine.js`
- Confirmed current backend health route and API mounting in `backend/src/server.js`
- Chose to preserve the existing negotiation flow and build the ROCm/vLLM service separately
- Created this `ACCORD_MEMORY.md` file as the persistent cross-session project memory
- Tried SSH with `~/.ssh/preethesh2005` and found that key file does not exist on this machine
- Retried SSH with `~/.ssh/id_ed25519`; key file exists, but connection failed at host verification with `Host key verification failed`
- Added the host key for `165.245.134.230` to local `~/.ssh/known_hosts`
- Successfully connected via `ssh -i ~/.ssh/id_ed25519 root@165.245.134.230`
- Confirmed the remote server is Ubuntu `24.04.3 LTS` on DigitalOcean
- Confirmed the droplet is a DigitalOcean `OpenAI GPT OSS 120b 1-Click` image
- Confirmed Docker is already installed on the droplet
- Confirmed the one-click image currently advertises:
  - Web UI on `http://165.245.134.230`
  - public vLLM API on `http://165.245.134.230:8000`
  - internal local API example on `http://localhost:8001/v1/chat/completions`
- Confirmed the droplet MOTD says UFW currently allows only ports `22`, `80`, `443`, `2375`, and `2376`
- Noted that this existing one-click setup may conflict with the planned custom no-auth vLLM deployment and needs inspection before changes are applied
- Confirmed the repo being edited locally is not the droplet filesystem; `/home/infinity/Projects/Accord` does not exist on the droplet
- Inspected remote GPU/container state:
  - `rocm-smi` reports about `205.8 GB` total VRAM
  - existing container `rocm-gpt-oss` is running `openai/gpt-oss-120b`
  - `open-webui` is also running
  - remote `caddy` proxies public port `8000` to local `127.0.0.1:8001` and enforces bearer auth
- Created a separate middleware project at `accord-llm/` in the repo
- Synced that separate middleware project to `/root/accord-llm` on the droplet
- Built and started a separate FastAPI middleware container on the droplet using Docker Compose
- Confirmed the separate middleware exposes:
  - `GET /health`
  - `POST /negotiate`
- Confirmed the middleware is isolated from the existing Accord UI/backend dummy negotiation flow and does not replace it
- Configured the separate middleware to use the existing local upstream LLM at `http://127.0.0.1:8001/v1`
- Added seller persona prompt templates for:
  - `SpeedyDev`
  - `QualityCraft`
  - `BudgetPro`
- Added a benchmark script for 6 sequential requests
- Identified that `gpt-oss-120b` returns reasoning-style responses; fixed the middleware by using `reasoning_effort=low`
- Added response normalization so `price` and `timeline` preserve units like `ALGO` and `days`
- Verified working middleware example response:
  - input seller `SpeedyDev`, price `8 ALGO`, timeline `4 days`
  - output preserved price and timeline in that format
- Verified benchmark result on the droplet:
  - `6` sequential negotiation requests completed in about `3.79s`
  - this meets the `<30s` performance target
- Did not touch the current Accord frontend or existing dummy/current negotiation backend path
- Did not yet replace the existing public one-click `:8000` GPT OSS setup
- Did not yet open public UFW port `9000`; the separate middleware is currently validated locally on the droplet
- Opened UFW port `9000/tcp` on the droplet for public middleware access
- Verified middleware health over the public IP at `http://165.245.134.230:9000/health`
- Installed and enabled the systemd unit `accord-llm-middleware.service`
- Started the middleware systemd unit and confirmed it is `active (exited)` as a oneshot Docker Compose launcher
- Confirmed restart state now is:
  - separate middleware container: Docker `unless-stopped`
  - existing `rocm-gpt-oss` model container: Docker `always`
- Current public middleware endpoint is now reachable without authentication:
  - `http://165.245.134.230:9000/negotiate`
- Current public model endpoint on `:8000` is still the DigitalOcean one-click stack behind bearer-token auth
- The original requested no-auth custom `:8000` replacement has not been performed yet
- Upgraded the separate middleware from a stateless responder to a lightweight stateful negotiation service
- Added `negotiation_id` support so later rounds can reuse the same negotiation thread
- Added in-memory per-session negotiation history with TTL-based cleanup
- Added prompt history injection so round 2 responses are aware of earlier offers/messages
- Added active session reporting in middleware `/health`
- Updated the benchmark to test two rounds per seller using the same `negotiation_id`
- Rebuilt and redeployed the upgraded middleware container on the droplet
- Verified upgraded benchmark result:
  - `6` sequential requests completed in about `4.36s`
  - still well within the `<30s` target
- Verified two-round live memory test for `SpeedyDev`:
  - round 1 returned a `negotiation_id`
  - round 2 reused the same `negotiation_id`
  - round 2 preserved the negotiation thread and updated price correctly
- Pulled `rocm/vllm:latest` successfully on the droplet
- Added custom vLLM deployment assets to `accord-llm/`:
  - Compose service for `accord-vllm`
  - host-side model selector/config writer
  - systemd unit for custom vLLM persistence
- Generated `/root/accord-llm/.env.vllm` on the droplet from detected VRAM
- Confirmed automatic model choice selected `openai/gpt-oss-20b` because VRAM is above `48 GB`
- Stopped the old DigitalOcean one-click `rocm-gpt-oss` container and disabled its auto-restart
- Started the new custom `accord-vllm` container on `127.0.0.1:8002`
- Confirmed the new custom vLLM endpoint serves:
  - model `openai/gpt-oss-20b`
  - max model length `8192`
- Replaced the old authenticated public `:8000` Caddy route with a no-auth reverse proxy to `localhost:8002`
- Repointed the premium middleware on `:9000` from `http://127.0.0.1:8001/v1` to `http://127.0.0.1:8002/v1`
- Verified direct no-auth public model endpoint:
  - `http://165.245.134.230:8000/v1/models`
  - `http://165.245.134.230:8000/v1/chat/completions`
- Verified end-to-end premium middleware on the new upstream:
  - `http://165.245.134.230:9000/health`
  - `http://165.245.134.230:9000/negotiate`
- Final production state now matches the intended custom deployment much more closely:
  - `:8000` is custom no-auth vLLM
  - `:9000` is the separate premium negotiation middleware

## Next Recommended Steps

1. Inspect ROCm and GPU VRAM on this machine
2. Check whether Docker is already installed and running
3. Scaffold the separate FastAPI middleware in a new directory without touching the current backend path
4. Deploy and benchmark the vLLM server
5. Document every system and repo change in this same file
