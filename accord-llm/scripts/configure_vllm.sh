#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.vllm"

if ! command -v rocm-smi >/dev/null 2>&1; then
  echo "rocm-smi is required to detect VRAM" >&2
  exit 1
fi

ROCM_MEMINFO="$(rocm-smi --showmeminfo vram)"
VRAM_BYTES="$(python3 - <<PY
import re
text = """${ROCM_MEMINFO}"""
match = re.search(r"VRAM Total Memory \(B\):\s*(\d+)", text)
if not match:
    raise SystemExit("Unable to parse VRAM from rocm-smi output")
print(match.group(1))
PY
)"
if [[ -z "${VRAM_BYTES}" ]]; then
  echo "Unable to detect total VRAM" >&2
  exit 1
fi

VRAM_GIB="$(python3 - <<PY
vram = int("${VRAM_BYTES}")
print(f"{vram / (1024**3):.2f}")
PY
)"

MODEL="mistralai/Mistral-7B-Instruct-v0.3"
MAX_MODEL_LEN="8192"
GPU_MEMORY_UTILIZATION="0.9"
MAX_NUM_SEQS="64"
BLOCK_SIZE="32"

python3 "${ROOT_DIR}/scripts/select_model.py" >/tmp/accord-vllm-selection.json
SELECTED_MODEL="$(python3 - <<PY
import json
with open('/tmp/accord-vllm-selection.json', 'r', encoding='utf-8') as fh:
    payload = json.load(fh)
print(payload['selected_model'])
PY
)"

if [[ "${SELECTED_MODEL}" == "openai/gpt-oss-20b" ]]; then
  MODEL="openai/gpt-oss-20b"
  MAX_MODEL_LEN="8192"
  GPU_MEMORY_UTILIZATION="0.92"
  MAX_NUM_SEQS="64"
  BLOCK_SIZE="32"
elif [[ "${SELECTED_MODEL}" == "meta-llama/Meta-Llama-3-8B-Instruct" ]]; then
  MODEL="meta-llama/Meta-Llama-3-8B-Instruct"
  MAX_MODEL_LEN="8192"
  GPU_MEMORY_UTILIZATION="0.9"
  MAX_NUM_SEQS="128"
  BLOCK_SIZE="16"
else
  MODEL="mistralai/Mistral-7B-Instruct-v0.3"
  MAX_MODEL_LEN="8192"
  GPU_MEMORY_UTILIZATION="0.9"
  MAX_NUM_SEQS="128"
  BLOCK_SIZE="16"
fi

cat > "${ENV_FILE}" <<EOF
VLLM_IMAGE=rocm/vllm:latest
VLLM_MODEL=${MODEL}
VLLM_HOST_PORT=8002
VLLM_MAX_MODEL_LEN=${MAX_MODEL_LEN}
VLLM_TENSOR_PARALLEL_SIZE=1
VLLM_GPU_MEMORY_UTILIZATION=${GPU_MEMORY_UTILIZATION}
VLLM_MAX_NUM_SEQS=${MAX_NUM_SEQS}
VLLM_BLOCK_SIZE=${BLOCK_SIZE}
EOF

echo "Detected VRAM: ${VRAM_GIB} GiB"
echo "Selected model: ${MODEL}"
echo "Wrote ${ENV_FILE}"
