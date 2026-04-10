import time
import json

import httpx


BASE_URL = "http://127.0.0.1:9000"
PAYLOADS = {
    "SpeedyDev": [
        {
            "seller": "SpeedyDev",
            "task": "Build a REST API",
            "budget": "10 ALGO",
            "round": 1,
            "offer_price": "8 ALGO",
            "timeline": "4 days",
        },
        {
            "seller": "SpeedyDev",
            "task": "Build a REST API",
            "budget": "10 ALGO",
            "round": 2,
            "offer_price": "7.8 ALGO",
            "timeline": "4 days",
        },
    ],
    "QualityCraft": [
        {
            "seller": "QualityCraft",
            "task": "Build a REST API",
            "budget": "10 ALGO",
            "round": 1,
            "offer_price": "9 ALGO",
            "timeline": "5 days",
        },
        {
            "seller": "QualityCraft",
            "task": "Build a REST API",
            "budget": "10 ALGO",
            "round": 2,
            "offer_price": "8.5 ALGO",
            "timeline": "5 days",
        },
    ],
    "BudgetPro": [
        {
            "seller": "BudgetPro",
            "task": "Build a REST API",
            "budget": "10 ALGO",
            "round": 1,
            "offer_price": "7 ALGO",
            "timeline": "6 days",
        },
        {
            "seller": "BudgetPro",
            "task": "Build a REST API",
            "budget": "10 ALGO",
            "round": 2,
            "offer_price": "6.5 ALGO",
            "timeline": "6 days",
        },
    ],
}


def main() -> int:
    started = time.perf_counter()
    with httpx.Client(timeout=60.0) as client:
        request_index = 1
        for seller, turns in PAYLOADS.items():
            negotiation_id = None
            for payload in turns:
                if negotiation_id:
                    payload = {**payload, "negotiation_id": negotiation_id}
                response = client.post(f"{BASE_URL}/negotiate", json=payload)
                response.raise_for_status()
                result = response.json()
                negotiation_id = result["negotiation_id"]
                print(f"Request {request_index}: {json.dumps(result, ensure_ascii=True)}")
                request_index += 1

    elapsed = time.perf_counter() - started
    target_ok = elapsed < 30
    print(f"Total time: {elapsed:.2f}s")
    print(f"Target met (<30s): {target_ok}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
