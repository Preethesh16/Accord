import json
import re
import subprocess


def detect_vram_bytes() -> int:
    result = subprocess.run(
        ["rocm-smi", "--showmeminfo", "vram"],
        capture_output=True,
        check=True,
        text=True,
    )
    match = re.search(r"VRAM Total Memory \(B\):\s*(\d+)", result.stdout)
    if not match:
        raise RuntimeError("Unable to detect VRAM from rocm-smi output")
    return int(match.group(1))


def select_model(vram_bytes: int) -> str:
    vram_gib = vram_bytes / (1024 ** 3)
    if vram_gib >= 48:
        return "openai/gpt-oss-20b"
    if vram_gib >= 16:
        return "meta-llama/Meta-Llama-3-8B-Instruct"
    return "mistralai/Mistral-7B-Instruct-v0.3"


def main() -> int:
    vram_bytes = detect_vram_bytes()
    print(
        json.dumps(
            {
                "vram_bytes": vram_bytes,
                "vram_gib": round(vram_bytes / (1024 ** 3), 2),
                "selected_model": select_model(vram_bytes),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
