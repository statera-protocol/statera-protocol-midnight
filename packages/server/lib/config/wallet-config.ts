export const walletConfig = {
  proofServerUri: process.env.PROOF_SERVER_URI as string,
  indexerUri: process.env.INDEXER_URI as string,
  indexerWsUri: process.env.INDEXER_WS_URI as string,
  nodeUri: process.env.NODE_URI as string,
};
export type WalletConfigType = typeof walletConfig;
