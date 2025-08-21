// services/wallet-service.ts
import { createLogger } from "../utils/logger-utils";
import {
  buildWalletAndWaitForFunds,
  createWalletAndMidnightProvider,
} from "../utils/wallet";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { walletConfig } from "../config/wallet-config";
import { StateraAPI } from "./statera-liquidation-api";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { PrivateStateId } from "@midnight-ntwrk/midnight-js-types";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Global variables to store initialized instances
let globalStateraAPI: StateraAPI | null = null;
let globalLogger: any = null;
let isInitialized = false;

export async function initializeWalletAndAPI(): Promise<void> {
  if (isInitialized) {
    console.log("Wallet and API already initialized");
    return;
  }

  setNetworkId(NetworkId.TestNet);
  
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Contract address not configured");
  }

  try {
    console.log("Creating logger...");
    const logPath = path.join(__dirname, "..", "logs");
    globalLogger = await createLogger(logPath);

    console.log("Building wallet and waiting for funds...");
    const wallet = await buildWalletAndWaitForFunds(globalLogger, walletConfig);

    console.log("Creating wallet and midnight provider...");
    const walletAndMidnightProvider = await createWalletAndMidnightProvider(wallet);

    console.log("Setting up providers...");
    const providers = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId>({
        privateStateStoreName: "server-side-bot-ps",
      }),
      publicDataProvider: indexerPublicDataProvider(
        walletConfig.indexerUri,
        walletConfig.indexerWsUri
      ),
      zkConfigProvider: new NodeZkConfigProvider<never>(
        path.resolve(
          __dirname,
          "..",
          "..",
          "..",
          "contracts",
          "ada-statera-protocol",
          "dist",
          "managed",
          "adaStateraProtocol"
        )
      ),
      proofProvider: httpClientProofProvider(walletConfig.proofServerUri),
      walletProvider: walletAndMidnightProvider,
      midnightProvider: walletAndMidnightProvider,
    };

    console.log("Joining Statera contract...");
    globalStateraAPI = await StateraAPI.joinStateraContract(
      providers,
      contractAddress,
      globalLogger
    );

    isInitialized = true;
    console.log("Wallet and Statera API initialization completed successfully");
  } catch (error) {
    console.error("Failed to initialize wallet and API:", error);
    throw error;
  }
}

export function getStateraAPI(): StateraAPI {
  if (!globalStateraAPI) {
    throw new Error("Statera API not initialized. Call initializeWalletAndAPI() first.");
  }
  return globalStateraAPI;
}

export function getLogger() {
  if (!globalLogger) {
    throw new Error("Logger not initialized. Call initializeWalletAndAPI() first.");
  }
  return globalLogger;
}

export function isWalletInitialized(): boolean {
  return isInitialized;
}