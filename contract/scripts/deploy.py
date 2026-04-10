import json
import base64
from pathlib import Path
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCreateTxn,
    OnComplete,
    StateSchema,
    wait_for_confirmation,
)

ALGOD_SERVER = "https://testnet-api.algonode.cloud"
ALGOD_PORT = 443
ALGOD_TOKEN = ""

ARTIFACTS_DIR = Path(__file__).parent.parent / "smart_contracts" / "deal_escrow" / "artifacts"


def deploy():
    mn = input("Enter deployer mnemonic (25 words): ").strip()
    sk = mnemonic.to_private_key(mn)
    deployer = account.address_from_private_key(sk)

    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER, headers={"User-Agent": "accord"})

    approval_teal = (ARTIFACTS_DIR / "DealEscrow.approval.teal").read_text()
    clear_teal = (ARTIFACTS_DIR / "DealEscrow.clear.teal").read_text()

    approval_compiled = client.compile(approval_teal)["result"]
    clear_compiled = client.compile(clear_teal)["result"]

    sp = client.suggested_params()

    txn = ApplicationCreateTxn(
        sender=deployer,
        sp=sp,
        on_complete=OnComplete.NoOpOC,
        approval_program=base64.b64decode(approval_compiled),
        clear_program=base64.b64decode(clear_compiled),
        global_schema=StateSchema(num_uints=4, num_byte_slices=2),
        local_schema=StateSchema(num_uints=0, num_byte_slices=0),
    )

    signed = txn.sign(sk)
    tx_id = client.send_transaction(signed)
    print(f"Sent tx: {tx_id}")

    result = wait_for_confirmation(client, tx_id, 4)
    app_id = result["application-index"]
    print(f"APP_ID: {app_id}")
    print(f"App address: {result.get('application-index', '')}")

    # Save for reference
    output = {"app_id": app_id, "tx_id": tx_id, "deployer": deployer}
    (ARTIFACTS_DIR / "deploy_output.json").write_text(json.dumps(output, indent=2))
    print("Saved to artifacts/deploy_output.json")


if __name__ == "__main__":
    deploy()
