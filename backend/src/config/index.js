import "dotenv/config";

export const config = {
  port: process.env.PORT || 3001,
  appId: parseInt(process.env.APP_ID),
  oracleMnemonic: process.env.ORACLE_MNEMONIC,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  negotiation: {
    backendUrl:
      process.env.NEGOTIATION_BACKEND_URL ||
      "http://165.245.134.230:9000/negotiate",
    timeoutMs: parseInt(process.env.NEGOTIATION_TIMEOUT_MS) || 12000,
  },
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  algod: {
    server: process.env.ALGOD_SERVER || "https://testnet-api.algonode.cloud",
    token: process.env.ALGOD_TOKEN || "",
    port: parseInt(process.env.ALGOD_PORT) || 443,
  },
};
