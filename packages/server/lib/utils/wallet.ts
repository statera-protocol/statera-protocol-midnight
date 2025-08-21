import * as dotenv from "dotenv";
import { type Resource, WalletBuilder } from "@midnight-ntwrk/wallet";
import { Logger } from "pino";
import { WalletConfigType } from "../config/wallet-config";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { type Wallet } from "@midnight-ntwrk/wallet-api";
import * as Rx from "rxjs";
import { writeFile, existsSync, createReadStream } from "node:fs";
import { nativeToken } from "@midnight-ntwrk/ledger";
import {
  MidnightProvider,
  WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import {
  Transaction,
  type CoinInfo,
  type TransactionId,
} from "@midnight-ntwrk/ledger";
import {
  type UnbalancedTransaction,
  createBalancedTx,
  type BalancedTransaction,
} from "@midnight-ntwrk/midnight-js-types";

import path from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({});

export const createWalletAndMidnightProvider = async (
  wallet: Wallet
): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
    balanceTx(
      tx: UnbalancedTransaction,
      newCoins: CoinInfo[]
    ): Promise<BalancedTransaction> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(
            tx.serialize(getLedgerNetworkId()),
            getZswapNetworkId()
          ),
          newCoins
        )
        .then((tx) => wallet.proveTransaction(tx))
        .then((zswapTx) =>
          Transaction.deserialize(
            zswapTx.serialize(getZswapNetworkId()),
            getLedgerNetworkId()
          )
        )
        .then(createBalancedTx);
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

export const waitForSync = (wallet: Wallet, logger: Logger) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is synced fully
        return state.syncProgress !== undefined && state.syncProgress.synced;
      })
    )
  );

export const waitForSyncProgress = async (wallet: Wallet, logger: Logger) =>
  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if syncProgress is defined
        return state.syncProgress !== undefined;
      })
    )
  );

export const waitForFunds = (wallet: Wallet, logger: Logger) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is synced
        return state.syncProgress?.synced === true;
      }),
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n)
    )
  );

export const isAnotherChain = async (
  wallet: Wallet,
  offset: number,
  logger: Logger
) => {
  await waitForSyncProgress(wallet, logger);
  // Here wallet does not expose the offset block it is synced to, that is why this workaround
  const walletOffset = Number(JSON.parse(await wallet.serializeState()).offset);
  if (walletOffset < offset - 1) {
    logger.info(
      `Your offset offset is: ${walletOffset} restored offset: ${offset} so it is another chain`
    );
    return true;
  } else {
    logger.info(
      `Your offset offset is: ${walletOffset} restored offset: ${offset} ok`
    );
    return false;
  }
};

export const waitForTokenBalance = (
  wallet: Wallet,
  tokenType: string,
  minimumAmount: bigint,
  logger: Logger,
  timeoutMs: number = 30000
): Promise<bigint> =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(2_000),
      Rx.tap((state) => {
        const balance = state.balances[tokenType] ?? 0n;
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        logger.info(
          `Waiting for ${tokenType} balance. Current: ${balance}, Target: ${minimumAmount}, Backend lag: ${sourceGap}, Wallet lag: ${applyGap}`
        );
      }),
      Rx.filter((state) => {
        const balance = state.balances[tokenType] ?? 0n;
        return state.syncProgress?.synced === true && balance >= minimumAmount;
      }),
      Rx.map((state) => state.balances[tokenType] ?? 0n),
      Rx.timeout(timeoutMs)
    )
  );

// Enhanced function to wait for wallet sync after operations
export const waitForWalletSyncAfterOperation = async (
  wallet: Wallet,
  logger: Logger,
  timeoutMs: number = 30000
): Promise<void> => {
  try {
    await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(1_000),
        Rx.tap((state) => {
          const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
          const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
          logger.info(
            `Syncing after operation. Backend lag: ${sourceGap}, Wallet lag: ${applyGap}`
          );
        }),
        Rx.filter((state) => {
          return state.syncProgress?.synced === true;
        }),
        Rx.timeout(timeoutMs)
      )
    );
    logger.info("Wallet sync completed after operation");
  } catch (error) {
    logger.warn(`Wallet sync timeout after ${timeoutMs}ms`);
  }
};

export async function buildWalletAndWaitForFunds(
  logger: Logger,
  { indexerUri, indexerWsUri, proofServerUri, nodeUri }: WalletConfigType
): Promise<Wallet & Resource> {
  // Use process.cwd() for project root instead of __dirname navigation
  const serializationFilePath = path.resolve(
    process.cwd(),
    "..",
    "..",
    "packages",
    "server",
    "serialize-wallet-state.txt"
  );
  let wallet: Wallet & Resource;
  const seed = process.env.BOT_WALLET_SEED;
  if (seed == undefined) {
    logger.info("Could not retrieve seed from env");
  }

  try {
    if (existsSync(serializationFilePath)) {
      logger.info("Attempting to restore serialized wallet state");
      const serializedReadStream = createReadStream(
        serializationFilePath,
        "utf-8"
      );
      let serializedState = "";

      for await (const chunk of serializedReadStream) {
        serializedState += chunk;
      }

      serializedReadStream.on("finish", () => {
        serializedReadStream.close();
      });

      wallet = await WalletBuilder.restore(
        indexerUri,
        indexerWsUri,
        proofServerUri,
        nodeUri,
        seed as string,
        serializedState
      );

      wallet.start();

      const stateObject = JSON.parse(serializedState);
      if (
        (await isAnotherChain(wallet, Number(stateObject.offset), logger)) ===
        true
      ) {
        logger.warn("The chain was reset, building wallet from scratch");
        wallet = await WalletBuilder.build(
          indexerUri,
          indexerWsUri,
          proofServerUri,
          nodeUri,
          seed as string,
          getZswapNetworkId(),
          "info"
        );

        wallet.start();
      } else {
        const newState = await waitForSync(wallet, logger);
        // allow for situations when there's no new index in the network between runs
        if (newState.syncProgress?.synced) {
          logger.info("Wallet was able to sync from restored state");
        } else {
          logger.info(`Offset: ${stateObject.offset}`);
          logger.info(
            `SyncProgress.lag.applyGap: ${newState.syncProgress?.lag.applyGap}`
          );
          logger.info(
            `SyncProgress.lag.sourceGap: ${newState.syncProgress?.lag.sourceGap}`
          );
          logger.warn(
            "Wallet was not able to sync from restored state, building wallet from scratch"
          );
          wallet = await WalletBuilder.build(
            indexerUri,
            indexerWsUri,
            proofServerUri,
            nodeUri,
            seed as string,
            getZswapNetworkId(),
            "info"
          );
          wallet.start();
        }
      }
    } else {
      logger.info(
        "File path for save file not found, building wallet from scratch"
      );

      wallet = await WalletBuilder.build(
        indexerUri,
        indexerWsUri,
        proofServerUri,
        nodeUri,
        seed as string,
        getZswapNetworkId(),
        "info"
      );
      const serialized = await wallet.serializeState();

      // Use process.cwd() for consistent project root path resolution
      const newSerializationFilePath = path.resolve(
        process.cwd(),
        "..",
        "..",
        "packages",
        "server",
        "serialize-wallet-state.txt"
      );

      logger.info(`new serialization path ${newSerializationFilePath}`);

      writeFile(newSerializationFilePath, serialized.toString(), (error) => {
        if (error) {
          logger.info("Failed to write serialize wallet state");
        }

        logger.info("Serialized state saved successfully");
      });
      wallet.start();
    }
  } catch (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : "Failed to build wallet and wait for funds";

    logger.info(errMsg);
    throw new Error(errMsg);
  }

  const state = await Rx.firstValueFrom(wallet.state());
  logger.info(`Your wallet seed is: ${seed}`);
  logger.info(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    logger.info(`Your wallet balance is: 0`);
    logger.info(`Waiting to receive tokens...`);
    balance = await waitForFunds(wallet, logger);
  }
  logger.info(`Your wallet balance is: ${balance}`);
  return wallet;
}
