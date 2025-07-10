import { connectWallet } from "@/lib/actions";
import type { WalletAPI } from "@/lib/common-types";
import {
  stateraPrivateStateId,
  type StateraContractProviders,
  type StateraPrivateStateId,
  type TokenCircuitKeys,
} from "@statera/statera-api";
import type { Logger } from "pino";
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  Transaction as ZswapTransaction,
  type TransactionId,
} from "@midnight-ntwrk/zswap";
import { PrivateStateProviderWrapper } from "./privateStateProvider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {
  createBalancedTx,
  ZKConfigProvider,
  type BalancedTransaction,
  type MidnightProvider,
  type PrivateStateProvider,
  type ProofProvider,
  type PublicDataProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { WrappedPublicStateProvider } from "./publicStateProvider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import type { CoinInfo } from "@midnight-ntwrk/compact-runtime";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { Transaction } from "@midnight-ntwrk/ledger";
import { noProofClient, proofClient } from "./proofProvider";
import { WrappedZKConfigProvider } from "./zkConfigProvider";
import toast from "react-hot-toast";
import type { StateraPrivateState } from "@statera/ada-statera-protocol";

interface WalletAPIType extends WalletAPI {
  address: string | undefined;
}

export interface MidnightWalletState {
  readonly address: string | undefined;
  readonly isConnecting: boolean;
  readonly hasConnected: boolean;
  readonly coinPublicKey: string | undefined;
  readonly encryptionPublicKey: string | undefined;
  readonly providers: StateraContractProviders | undefined;
  readonly walletAPI: WalletAPIType | undefined;
  readonly error: string | null;
}

export type MidnightWalletContextType = {
  connectFn: () => Promise<void>;
  isConnecting: boolean;
  hasConnected: boolean;
  state: MidnightWalletState;
  providers: StateraContractProviders | undefined;
  privateStateProvider: PrivateStateProvider<
    StateraPrivateStateId,
    StateraPrivateState
  >;
  publicDataProvider: PublicDataProvider;
  midnightProvider: MidnightProvider;
  walletProvider: WalletProvider;
  zkConfigProvider: ZKConfigProvider<TokenCircuitKeys>;
  checkProofServerStatus: (uri: string) => Promise<void>;
  proofProvider: ProofProvider<string>;
};

export const MidnightWalletContext =
  createContext<MidnightWalletContextType | null>(null);

const MidnightWalletProvider = ({
  children,
  logger,
}: PropsWithChildren<{ logger: Logger }>) => {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [hasConnected, setHasConnected] = useState<boolean>(() => {
    const isWalletConnected = sessionStorage.getItem("WALLET_CONNECTED");
    return isWalletConnected ? JSON.parse(isWalletConnected) : false;
  });
  const [walletAPI, setWalletAPI] = useState<WalletAPIType | undefined>(() => {
    const existingWalletApi = sessionStorage.getItem("WALLET_API");
    return existingWalletApi ? JSON.parse(existingWalletApi) : undefined;
  });
  const [error, setError] = useState<string | undefined>(undefined);
  const [providers, setProviders] = useState<
    StateraContractProviders | undefined
  >(undefined);
  const [walletState, setWalletState] = useState<
    MidnightWalletState | undefined
  >(() => {
    const previousWalletState = sessionStorage.getItem("WALLET_STATE");
    return previousWalletState
      ? JSON.parse(previousWalletState)
      : {
          address: undefined,
          isConnecting: false,
          hasConnected: false,
          coinPublicKey: undefined,
          encryptionPublicKey: undefined,
          providers: undefined,
          walletAPI: undefined,
          error: null,
        };
  });

  const checkProofServerStatus = async (uri: string) => {
    try {
      const result = await fetch(`${uri}`);
      if (result.ok) {
        toast.success("Proof-server is active");
      } else {
        toast.error("Proof-server inactive");
      }
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? `Proof server inactive: ${error.message}`
          : "Prove server not responding";
      toast.error(errMsg);
    }
  };

  const privateStateProvider = useMemo(
    () =>
      new PrivateStateProviderWrapper(
        levelPrivateStateProvider({
          privateStateStoreName: stateraPrivateStateId,
        }),
        logger
      ),
    []
  );

  const publicDataProvider = useMemo(
    () =>
      new WrappedPublicStateProvider(
        indexerPublicDataProvider(
          import.meta.env.VITE_INDEXER_URL as string,
          import.meta.env.VITE_INDEXER_WS_URL as string
        ),
        logger
      ),
    []
  );

  const walletProvider = useMemo(() => {
    if (walletAPI) {
      return {
        coinPublicKey: walletAPI.coinPublicKey,
        encryptionPublicKey: walletAPI.encryptionPublicKey,
        balanceTx(
          tx: UnbalancedTransaction,
          newCoins: CoinInfo[]
        ): Promise<BalancedTransaction> {
          return walletAPI.wallet
            .balanceAndProveTransaction(
              ZswapTransaction.deserialize(
                tx.serialize(getLedgerNetworkId()),
                getZswapNetworkId()
              ),
              newCoins
            )
            .then((zswapTx) =>
              Transaction.deserialize(
                zswapTx.serialize(getZswapNetworkId()),
                getLedgerNetworkId()
              )
            )
            .then(createBalancedTx);
        },
      };
    } else {
      return {
        coinPublicKey: "",
        encryptionPublicKey: "",
        balanceTx: () => {
          return Promise.reject(
            new Error("Wallet API not set @walletProvider")
          );
        },
      };
    }
  }, [walletAPI]);

  const proofProvider = useMemo(() => {
    if (walletAPI) {
      return proofClient(walletAPI.uris.proverServerUri);
    } else {
      return noProofClient();
    }
  }, [walletAPI]);

  const zkConfigProvider = useMemo(
    () =>
      new WrappedZKConfigProvider<TokenCircuitKeys>(
        window.location.origin,
        fetch.bind(window)
      ),
    []
  );

  const midnightProvider = useMemo(() => {
    if (walletAPI) {
      return {
        submitTx(tx: BalancedTransaction): Promise<TransactionId> {
          return walletAPI.wallet.submitTransaction(tx);
        },
      };
    } else {
      return {
        submitTx() {
          return Promise.reject(
            new Error("Wallet API not found @midnightProvider")
          );
        },
      };
    }
  }, [walletAPI]);

  // Enables user connect their wallet to the DAPP
  const connect = async () => {
    setIsConnecting(true);
    logger.info("Connecting to wallet....");
    try {
      const { wallet, uris } = await connectWallet();
      const connectedWalletState = await wallet.state();
      logger.info("wallet state", connectedWalletState);

      sessionStorage.setItem("WALLET_CONNECTED", JSON.stringify(true));
      setHasConnected(true);

      // Sets the wallet api to trigger changes to the main wallet state
      const newWalletAPI = {
        address: connectedWalletState.address,
        coinPublicKey: connectedWalletState.coinPublicKey,
        encryptionPublicKey: connectedWalletState.encryptionPublicKey,
        wallet: wallet,
        uris: uris,
      };

      sessionStorage.setItem("WALLET_API", JSON.stringify(newWalletAPI));
      setWalletAPI(newWalletAPI);
      // Checks if the proof server is active
      await checkProofServerStatus(uris.proverServerUri);

      toast.success("Connected successfully");
      logger.info("Finished setting wallet api");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to connnect to  wallet";
      setError(errorMessage);
      setHasConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Sets the wallet state as soon as the walletAPI is available after connection
  useEffect(() => {
    if (!walletAPI) return;
    logger.info("cached wallet api", walletAPI);
    const newState: MidnightWalletState = {
      address: walletAPI.address,
      walletAPI: walletAPI,
      coinPublicKey: walletAPI.coinPublicKey,
      isConnecting: isConnecting,
      hasConnected: hasConnected,
      encryptionPublicKey: walletAPI.encryptionPublicKey,
      error: error || null,
      providers: {
        privateStateProvider,
        proofProvider,
        publicDataProvider,
        zkConfigProvider,
        midnightProvider,
        walletProvider,
      },
    };

    logger.info("Updated wallet status", newState);
    sessionStorage.setItem("WALLET_STATE", JSON.stringify(newState));
    setWalletState(newState);

    const newProviders = {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      midnightProvider,
      walletProvider,
      proofProvider,
    };
    logger.info("Updated DAp providers", newProviders);

    setProviders(newProviders);
  }, [
    walletAPI,
    hasConnected,
    isConnecting,
    error,
    privateStateProvider,
    publicDataProvider,
    midnightProvider,
    walletProvider,
    zkConfigProvider,
    proofProvider,
  ]);

  const contextWalletValue: MidnightWalletContextType = useMemo(
    () => ({
      state: walletState as MidnightWalletState,
      connectFn: connect,
      privateStateProvider,
      publicDataProvider,
      midnightProvider,
      walletProvider,
      zkConfigProvider,
      proofProvider,
      isConnecting,
      hasConnected,
      providers,
      checkProofServerStatus: checkProofServerStatus,
    }),
    [
      walletState,
      privateStateProvider,
      publicDataProvider,
      midnightProvider,
      walletProvider,
      zkConfigProvider,
      proofProvider,
      isConnecting,
      hasConnected,
    ]
  );

  return (
    <MidnightWalletContext.Provider value={contextWalletValue}>
      {children}
    </MidnightWalletContext.Provider>
  );
};

export default MidnightWalletProvider;
