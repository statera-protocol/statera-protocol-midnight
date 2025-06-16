// import { webcrypto } from "crypto";
// import { WebSocket } from "ws"
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { stdin as input, stdout as output } from "node:process";
import {
  DeployedStateraOnchainContract,
  DerivedStateraContractState,
  StateraAPI,
  StateraContractProviders,
  stateraPrivateStateId,
  utils,
} from "@stater/statera-api";
import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { createInterface, Interface } from "node:readline/promises";
import { Logger } from "pino";
import {
  type Ledger,
  ledger,
  StateraPrivateState,
} from "@statera/ada-statera-protocol";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { type Config, StandaloneConfig } from "./config.js";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import * as Rx from "rxjs";
import { type Wallet } from "@midnight-ntwrk/wallet-api";
import type {
  StartedDockerComposeEnvironment,
  DockerComposeEnvironment,
} from "testcontainers";
import { type Resource, WalletBuilder } from "@midnight-ntwrk/wallet";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import {
  nativeToken,
  Transaction,
  type CoinInfo,
  type TransactionId,
} from "@midnight-ntwrk/ledger";
import {
  type MidnightProvider,
  type WalletProvider,
  type UnbalancedTransaction,
  createBalancedTx,
  type BalancedTransaction,
  PrivateStateId,
} from "@midnight-ntwrk/midnight-js-types";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import * as fsAsync from "node:fs/promises";
import * as fs from "node:fs";
import { streamToString } from "testcontainers/build/common/streams.js";
import { webcrypto } from "node:crypto";

/**
 * publicDataProvider is used because it allows us retrieve ledger state variables
 * @param providers provides us with all api to interact with midnight blockchain
 * enable us read or update the state of our smart contract
 * @param contractAddress the address of the intend smart contract we intend to retrieve the state of.
 * @returns the state of our smart contract
 */
export const getStateraLedgerState = (
  providers: StateraContractProviders,
  contractAddress: ContractAddress
): Promise<Ledger | null> =>
  providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) =>
      contractState != null ? ledger(contractState.data) : null
    );

const DEPLOY_OR_JOIN_QUESTION = `
    You can do one of the following:
    1. Deploy a statera stablecoin contract
    2. Join an existing one
    3. Exit
`;

const resolve = async (
  providers: StateraContractProviders,
  rli: Interface,
  logger: Logger
): Promise<StateraAPI | null> => {
  let api: StateraAPI | null = null;

  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case "1":
        api = await StateraAPI.deployStateraContract(providers, logger);
        logger.info(
          `Deployed contract at address: ${api.deployedContractAddress}`
        );
        return api;

      case "2":
        api = await StateraAPI.joinStateraContract(
          providers,
          await rli.question("What is the contract address (in hex)?"),
          logger
        );
        logger.info(
          `Joined contract at address: ${api.deployedContractAddress}`
        );
        return api;
    }
  }
};

const displayLedgerState = async (
  providers: StateraContractProviders,
  deployedStateraContract: DeployedStateraOnchainContract,
  logger: Logger
): Promise<void> => {
  const contractAddress =
    deployedStateraContract.deployTxData.public.contractAddress;
  const ledgerState = await getStateraLedgerState(providers, contractAddress);
  if (ledgerState === null) {
    logger.info(
      `There is no token mint contract deployed at ${contractAddress}`
    );
  } else {
    logger.info(`Current admin is: ${ledgerState.admin}`);
    logger.info(
      `Current collateral pool amount is: ${ledgerState.reservePoolTotal}`
    );
    logger.info(`Current total value minted is: ${ledgerState.totalMint}`);
    logger.info(`Current nonce is: ${ledgerState.nonce}`);
    logger.info(`Current depositor is: ${ledgerState.reservePoolTotal}`);
    logger.info(`Current mint count is: ${ledgerState.mintCounter}`);
    logger.info(`Current stake pool is: ${ledgerState.stakePoolTotal}`);
    logger.info(`Current stablecoin color is: ${ledgerState.sUSDTokenType}`);
    logger.info(`Current stakers is: ${ledgerState.stakers}`);
    logger.info(
      `Current no of depositors is: ${ledgerState.reservePoolTotal.size()}`
    );
    logger.info(
      `Current liquidation threshold is: ${ledgerState.liquidationThreshold}`
    );
  }
};

const displayDerivedLedgerState = async (
  currentState: DerivedStateraContractState,
  logger: Logger
): Promise<void> => {
  logger.info(`Current admin is: ${currentState.admin}`);
  logger.info(
    `Current collateral pool amount is: ${currentState.reservePoolTotal}`
  );
  logger.info(`Current total value minted is: ${currentState.totalMint}`);
  logger.info(`Current nonce is: ${currentState.nonce}`);
  logger.info(`Current depositor is: ${currentState.collateralDepositors}`);
  logger.info(`Current mint count is: ${currentState.mintCounter}`);
  logger.info(`Current stake pool is: ${currentState.stakePoolTotal}`);
  logger.info(`Current stablecoin color is: ${currentState.sUSDTokenType}`);
  logger.info(`Current stakers is: ${currentState.stakers}`);
  logger.info(`Current no of depositors is: ${currentState.noOfDepositors}`);
  logger.info(
    `Current liquidation threshold is: ${currentState.liquidationThreshold}`
  );
};  

const getUserPrivateState = async (
  providers: StateraContractProviders
): Promise<StateraPrivateState | null> =>
  providers.privateStateProvider
    .get(stateraPrivateStateId)
    .then((privateState) => (privateState != null ? privateState : null));

const displayUserPrivateState = async (
  providers: StateraContractProviders,
  logger: Logger
) => {
  const privateState = await getUserPrivateState(providers);

  if (privateState === null)
    logger.info(`There is no private state stored at ${stateraPrivateStateId}`);
  console.log(
    `Current collateral reserved is:`, privateState?.depositPositions
  );
  logger.info(`Current secrete-key is: ${privateState?.secrete_key}`);
};

const CIRCUIT_MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Check your stake reward
  2. Deposit tDUST into collaateral pool
  3. Deposit sUSD into stake pool
  4. Display the current ledger state (known by everyone)
  5. Display the current derived ledger state (known by everyone)
  6. Display the current private state (known by you alone)
  7. Mint sUSD from your Collateral position
  8. repay sUSD for your Collateral position
  9. Withdraw stake reward
  10. Withdraw deposited collateral
  11. Exit
Which would you like to do? `;

const circuit_main_loop = async (
  providers: StateraContractProviders,
  rli: Interface,
  logger: Logger
): Promise<void> => {
  const stateraApi = await resolve(providers, rli, logger);
  if (stateraApi === null) return;

  let currentState: DerivedStateraContractState | undefined;
  const stateObserver = {
    next: (state: DerivedStateraContractState) => (currentState = state),
  };

  const subscription = stateraApi.state.subscribe(stateObserver);
  try {
    while (true) {
      const choice = await rli.question(CIRCUIT_MAIN_LOOP_QUESTION);
      switch (choice) {
        case "1": {
          await stateraApi.checkStakeReward();
          break;
        }
        case "2": {
          const amountToDeposit = await rli.question(
            `How much do you want to deposit?`
          );
          await stateraApi.depositToCollateralPool(
            await rli.question("Enter newly generated collateral id "),
            Number(amountToDeposit),
            providers
          );
          break;
        }
        case "3": {
          await stateraApi.depositToStakePool(
            Number(await rli.question("How much do you want to stake "))
          );
          break;
        }
        case "4": {
          await displayLedgerState(
            providers,
            stateraApi.allReadyDeployedContract,
            logger
          );
          break;
        }
        case "5": {
          await displayDerivedLedgerState(
            currentState as DerivedStateraContractState,
            logger
          );
          break;
        }
        case "6": {
          await displayUserPrivateState(providers, logger);
          break;
        }
        case "7": {
          await stateraApi.mint_sUSD(
            Number(await rli.question("How much do you want to mint? ")),
            await rli.question("Enter your collateralId ")
          );
          break;
        }
         case "8": {
          await stateraApi.repay(
            Number(
              await rli.question("How much of your debt do you want to offset ")
            ),
            await rli.question("Enter ID of debt position to repay ")
          );
          break;
        }
        case "9": {
          await stateraApi.withdrawStakeReward(
            Number(
              await rli.question(
                "How much of your stake reward do you want to withdraw "
              )
            )
          );
          break;
        }
        case "10": {
          await stateraApi.withdrawCollateral(
            Number(
              await rli.question(
                "How much of your collateral do you want to withdraw "
              )
            ),
            await rli.question(
              "Enter ID of colateral position you want to withdraw from "
            ),
            await rli.question("Enter recipent wallet address ")
          );
          break;
        }
        case "11": {
          logger.info("Exiting.......");
          return;
        }
        default:
          logger.error(`Invalid choice: ${choice}`);
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

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

export const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  seed: string,
  filename: string,
  logger: Logger
): Promise<Wallet & Resource> => {
  const directoryPath = process.env.SYNC_CACHE;
  let wallet: Wallet & Resource;
  if (directoryPath !== undefined) {
    if (fs.existsSync(`${directoryPath}/${filename}`)) {
      logger.info(
        `Attempting to restore state from ${directoryPath}/${filename}`
      );
      try {
        const serializedStream = fs.createReadStream(
          `${directoryPath}/${filename}`,
          "utf-8"
        );
        const serialized = await streamToString(serializedStream);
        serializedStream.on("finish", () => {
          serializedStream.close();
        });
        wallet = await WalletBuilder.restore(
          indexer,
          indexerWS,
          proofServer,
          node,
          seed,
          serialized,
          "info"
        );
        wallet.start();
        const stateObject = JSON.parse(serialized);
        if (
          (await isAnotherChain(wallet, Number(stateObject.offset), logger)) ===
          true
        ) {
          logger.warn("The chain was reset, building wallet from scratch");
          wallet = await WalletBuilder.build(
            indexer,
            indexerWS,
            proofServer,
            node,
            seed,
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
              indexer,
              indexerWS,
              proofServer,
              node,
              seed,
              getZswapNetworkId(),
              "info"
            );
            wallet.start();
          }
        }
      } catch (error: unknown) {
        if (typeof error === "string") {
          logger.error(error);
        } else if (error instanceof Error) {
          logger.error(error.message);
        } else {
          logger.error(error);
        }
        logger.warn(
          "Wallet was not able to restore using the stored state, building wallet from scratch"
        );
        wallet = await WalletBuilder.build(
          indexer,
          indexerWS,
          proofServer,
          node,
          seed,
          getZswapNetworkId(),
          "info"
        );
        wallet.start();
      }
    } else {
      logger.info("Wallet save file not found, building wallet from scratch");
      wallet = await WalletBuilder.build(
        indexer,
        indexerWS,
        proofServer,
        node,
        seed,
        getZswapNetworkId(),
        "info"
      );
      wallet.start();
    }
  } else {
    logger.info(
      "File path for save file not found, building wallet from scratch"
    );
    wallet = await WalletBuilder.build(
      indexer,
      indexerWS,
      proofServer,
      node,
      seed,
      getZswapNetworkId(),
      "info"
    );
    wallet.start();
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
};

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  return bytes;
};

// Generate a random see and create the wallet with that.
export const buildFreshWallet = async (
  config: Config,
  logger: Logger
): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, toHex(randomBytes(32)), "", logger);

// Prompt for a seed and create the wallet with that.
const buildWalletFromSeed = async (
  config: Config,
  rli: Interface,
  logger: Logger
): Promise<Wallet & Resource> => {
  const seed = await rli.question("Enter your wallet seed: ");
  return await buildWalletAndWaitForFunds(config, seed, "", logger);
};

/* ***********************************************************************
 * This seed gives access to tokens minted in the genesis block of a local development node - only
 * used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (
  config: Config,
  rli: Interface,
  logger: Logger
): Promise<(Wallet & Resource) | null> => {
  if (config instanceof StandaloneConfig) {
    return await buildWalletAndWaitForFunds(
      config,
      GENESIS_MINT_WALLET_SEED,
      "",
      logger
    );
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case "1":
        return await buildFreshWallet(config, logger);
      case "2":
        return await buildWalletFromSeed(config, rli, logger);
      case "3":
        logger.info("Exiting...");
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const mapContainerPort = (
  env: StartedDockerComposeEnvironment,
  url: string,
  containerName: string
) => {
  const mappedUrl = new URL(url);
  const container = env.getContainer(containerName);

  mappedUrl.port = String(container.getFirstMappedPort());

  return mappedUrl.toString().replace(/\/+$/, "");
};

export const run = async (
  config: Config,
  logger: Logger,
  dockerEnv?: DockerComposeEnvironment
): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  let env;
  if (dockerEnv !== undefined) {
    env = await dockerEnv.up();

    if (config instanceof StandaloneConfig) {
      config.indexer = mapContainerPort(
        env,
        config.indexer,
        "manual-statera-indexer"
      );
      config.indexerWS = mapContainerPort(
        env,
        config.indexerWS,
        "manual-statera-indexer"
      );
      config.node = mapContainerPort(env, config.node, "manual-statera-node");
      config.proofServer = mapContainerPort(
        env,
        config.proofServer,
        "manual-statera-proof-server"
      );
    }
  }
  const wallet = await buildWallet(config, rli, logger);
  try {
    if (wallet !== null) {
      const walletAndMidnightProvider =
        await createWalletAndMidnightProvider(wallet);
      const providers = {
        privateStateProvider: levelPrivateStateProvider<PrivateStateId>({
          privateStateStoreName: config.privateStateStoreName as string,
        }),
        publicDataProvider: indexerPublicDataProvider(
          config.indexer,
          config.indexerWS
        ),
        zkConfigProvider: new NodeZkConfigProvider<never>(config.zkConfigPath),
        proofProvider: httpClientProofProvider(config.proofServer),
        walletProvider: walletAndMidnightProvider,
        midnightProvider: walletAndMidnightProvider,
      };
      await circuit_main_loop(providers, rli, logger);
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Found error '${e.message}'`);
      logger.info("Exiting...");
      logger.debug(`${e.stack}`);
    } else {
      throw e;
    }
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
    } finally {
      try {
        if (wallet !== null) {
          await wallet.close();
        }
      } catch (e) {
      } finally {
        try {
          if (env !== undefined) {
            await env.down();
            logger.info("Goodbye");
            process.exit(0);
          }
        } catch (e) {}
      }
    }
  }
};
