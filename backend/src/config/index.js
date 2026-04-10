import "dotenv/config";

export const config = {
  port: process.env.PORT || 3001,
  appId: parseInt(process.env.APP_ID),
  oracleMnemonic: process.env.ORACLE_MNEMONIC,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
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
