import algosdk from "algosdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const algodClient = new algosdk.Algodv2(
  config.algod.token,
  config.algod.server,
  config.algod.port
);

// Load compiled TEAL from artifacts
const ARTIFACTS_DIR = resolve(__dirname, "../../../contract/artifacts");
const approvalTeal = readFileSync(resolve(ARTIFACTS_DIR, "DealEscrow.approval.teal"), "utf-8");
const clearTeal = readFileSync(resolve(ARTIFACTS_DIR, "DealEscrow.clear.teal"), "utf-8");

// Demo seller address
const SELLER_ADDRESS = "BNKOQ6FFOWYM6SU2PF2MIIYEUB5BOB6BJVYHZFLUEM6SUG3SMZQ23TXUGU";

function getOracleAccount() {
  const acc = algosdk.mnemonicToSecretKey(config.oracleMnemonic);
  return { addr: acc.addr.toString(), sk: acc.sk };
}

function abiSelector(signature) {
  const hash = createHash("sha512-256").update(signature).digest();
  return hash.slice(0, 4);
}

async function signAndSend(txn, sk) {
  const signed = algosdk.signTransaction(txn, sk);
  const sendResult = await algodClient.sendRawTransaction(signed.blob).do();
  const txId = sendResult.txId || sendResult.txid;
  if (!txId) throw new Error("Unable to read transaction id from algod response");
  await algosdk.waitForConfirmation(algodClient, txId, 10);
  return txId;
}

// Deploy a new contract per deal and return the APP_ID
export async function deployDealContract() {
  try {
    console.log("[Deploy] Getting oracle account...");
    const oracle = getOracleAccount();

    const accountInfo = await algodClient.accountInformation(oracle.addr).do();
    const balance = Number(accountInfo.amount || 0n);
    const minimumNeeded = 2_500_000;
    if (balance < minimumNeeded) {
      throw new Error(
        `Oracle wallet balance too low for app deployment. Current: ${balance} microAlgo, required at least: ${minimumNeeded} microAlgo. Fund ${oracle.addr} on TestNet faucet and retry.`
      );
    }
    
    console.log("[Deploy] Getting transaction params...");
    const sp = await algodClient.getTransactionParams().do();

    console.log("[Deploy] Compiling TEAL programs...");
    const approvalCompiled = await algodClient.compile(Buffer.from(approvalTeal)).do();
    const clearCompiled = await algodClient.compile(Buffer.from(clearTeal)).do();

    console.log("[Deploy] Creating application...");
    const approvalProgram = new Uint8Array(Buffer.from(approvalCompiled.result, "base64"));
    const clearProgram = new Uint8Array(Buffer.from(clearCompiled.result, "base64"));

    const txn = algosdk.makeApplicationCreateTxnFromObject({
      sender: oracle.addr,
      approvalProgram,
      clearProgram,
      numGlobalInts: 4,
      numGlobalByteSlices: 2,
      numLocalInts: 0,
      numLocalByteSlices: 0,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      suggestedParams: sp,
    });

    console.log("[Deploy] Signing and submitting transaction...");
    const signed = algosdk.signTransaction(txn, oracle.sk);
    const sendResult = await algodClient.sendRawTransaction(signed.blob).do();
    const txId = sendResult.txId || sendResult.txid;
    if (!txId) throw new Error("Unable to read transaction id from algod response");
    console.log("[Deploy] Waiting for confirmation. TxID:", txId);
    
    const result = await algosdk.waitForConfirmation(algodClient, txId, 10);

    const appId = Number(result.applicationIndex);
    const appAddr = algosdk.getApplicationAddress(appId).toString();

    console.log("[Deploy] Contract deployed successfully. AppID:", appId, "Address:", appAddr);
    return { appId, appAddr, deployTxId: txId };
  } catch (err) {
    console.error("[Deploy] Error:", err.message);
    throw err;
  }
}

// Create deal conditions on a deployed contract
export async function createDealOnContract(appId, buyerAddress, amount, deadlineDays) {
  const oracle = getOracleAccount();
  const sp = await algodClient.getTransactionParams().do();

  const amountMicroAlgo = Math.round(amount * 1e6);
  const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadlineDays * 86400;

  const buyerBytes = algosdk.decodeAddress(buyerAddress).publicKey;
  const sellerBytes = algosdk.decodeAddress(SELLER_ADDRESS).publicKey;

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: oracle.addr,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [
      abiSelector("createDeal(address,address,uint64,uint64)void"),
      buyerBytes,
      sellerBytes,
      algosdk.encodeUint64(amountMicroAlgo),
      algosdk.encodeUint64(deadlineTimestamp),
    ],
    suggestedParams: sp,
  });

  const txId = await signAndSend(txn, oracle.sk);

  return {
    createTxId: txId,
    conditions: {
      buyer: buyerAddress,
      seller: SELLER_ADDRESS,
      amount: amount,
      amountMicroAlgo,
      deadline: new Date(deadlineTimestamp * 1000).toISOString(),
      deadlineTimestamp,
    },
  };
}

// Build unsigned fund transaction for Pera to sign
export async function buildFundTxn(appId, buyerAddress, amount) {
  const sp = await algodClient.getTransactionParams().do();
  const appAddr = algosdk.getApplicationAddress(appId).toString();
  const amountMicroAlgo = Math.round(amount * 1e6);
  const minBalance = 228500;

  // Payment to app account
  const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: buyerAddress,
    receiver: appAddr,
    amount: amountMicroAlgo + minBalance,
    suggestedParams: sp,
  });

  // fundDeal app call
  const fundTxn = algosdk.makeApplicationCallTxnFromObject({
    sender: buyerAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [abiSelector("fundDeal(pay)void")],
    suggestedParams: sp,
  });

  algosdk.assignGroupID([payTxn, fundTxn]);

  return {
    txns: [payTxn, fundTxn].map((t) => ({
      txn: Buffer.from(algosdk.encodeUnsignedTransaction(t)).toString("base64"),
    })),
    appAddr,
  };
}

export async function callVerifyComplete(appId) {
  const oracle = getOracleAccount();
  const sp = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: oracle.addr,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [abiSelector("verifyComplete()void")],
    suggestedParams: sp,
  });

  return await signAndSend(txn, oracle.sk);
}

export async function callReleaseFunds(appId) {
  const oracle = getOracleAccount();
  const sp = await algodClient.getTransactionParams().do();
  sp.fee = BigInt(2000);
  sp.flatFee = true;

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: oracle.addr,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [abiSelector("releaseFunds()void")],
    suggestedParams: sp,
  });

  return await signAndSend(txn, oracle.sk);
}

export async function callRefundBuyer(appId) {
  const oracle = getOracleAccount();
  const sp = await algodClient.getTransactionParams().do();
  sp.fee = BigInt(2000);
  sp.flatFee = true;

  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender: oracle.addr,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs: [abiSelector("refundBuyer()void")],
    suggestedParams: sp,
  });

  return await signAndSend(txn, oracle.sk);
}

export async function getContractState(appId) {
  try {
    const appInfo = await algodClient.getApplicationByID(appId).do();
    const state = {};
    for (const kv of appInfo.params.globalState || []) {
      const key = String.fromCharCode(...Object.values(kv.key));
      if (kv.value.type === 2) {
        state[key] = Number(kv.value.uint);
      } else {
        const bytes = new Uint8Array(Object.values(kv.value.bytes));
        state[key] = algosdk.encodeAddress(bytes);
      }
    }
    return state;
  } catch {
    return null;
  }
}

export { SELLER_ADDRESS };
