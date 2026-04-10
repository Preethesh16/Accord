from algosdk import account, mnemonic

sk, addr = account.generate_account()
print("Address:", addr)
print("Mnemonic:", mnemonic.from_private_key(sk))
