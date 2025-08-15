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
  disconnect: () => Promise<void>;
};

export const MidnightWalletContext =
  createContext<MidnightWalletContextType | null>(null);

const MidnightWalletProvider = ({
  children,
  logger,
}: PropsWithChildren<{ logger: Logger }>) => {
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [hasConnected, setHasConnected] = useState<boolean>(false);
  const [walletAPI, setWalletAPI] = useState<WalletAPIType | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [providers, setProviders] = useState<
    StateraContractProviders | undefined
  >(undefined);
  const [walletState, setWalletState] = useState<MidnightWalletState>({
    address: undefined,
    isConnecting: false,
    hasConnected: false,
    coinPublicKey: undefined,
    encryptionPublicKey: undefined,
    providers: undefined,
    walletAPI: undefined,
    error: null,
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
    const proof_server_uri = import.meta.env.VITE_PROOF_SERVER_URI;
    console.log("proof-server-uri", proof_server_uri);
    if (walletAPI && proof_server_uri) {
      return proofClient(proof_server_uri as string);
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

  const reconnectToWalletAndProviders = async () => {
    // Check if we should attempt reconnection
    const wasConnected = sessionStorage.getItem("WALLET_CONNECTED");
    if (!wasConnected || wasConnected !== "true") {
      return;
    }

    setIsConnecting(true);
    logger?.info("Attempting to reconnect wallet...");

    try {
      const { wallet, uris } = await connectWallet();
      const connectedWalletState = await wallet.state();

      // Validate the wallet state
      if (
        !connectedWalletState.address ||
        !connectedWalletState.coinPublicKey
      ) {
        throw new Error("Invalid wallet state - missing required fields");
      }

      logger?.info("Wallet state retrieved", connectedWalletState);

      const newWalletAPI = {
        address: connectedWalletState.address,
        coinPublicKey: connectedWalletState.coinPublicKey,
        encryptionPublicKey: connectedWalletState.encryptionPublicKey,
        wallet: wallet,
        uris: uris,
      };

      setWalletAPI(newWalletAPI);
      setHasConnected(true);

      // Check proof server status
      await checkProofServerStatus(uris.proverServerUri);
      toast.success("Reconnected successfully");

      logger?.info("Wallet reconnection successful");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reconnect to wallet";

      logger?.error("Wallet reconnection failed", { error: errorMessage });
      setError(errorMessage);
      setHasConnected(false);

      // Clear the connection flag if reconnection fails
      sessionStorage.removeItem("WALLET_CONNECTED");
      sessionStorage.removeItem("WALLET_STATE");

      toast.error("Failed to reconnect wallet. Please connect manually.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Enables user connect their wallet to the DAPP
  const connect = async () => {
    setIsConnecting(true);
    setError(undefined);
    logger?.info("Connecting to wallet....");

    try {
      const { wallet, uris } = await connectWallet();
      if (!wallet.state) {
        toast.error(
          "Could not find Lace wallet extension, Check to see if you have installed it on your Chrome browser"
        );
        return;
      }
      const connectedWalletState = await wallet.state();

      // Validate the wallet state
      if (
        !connectedWalletState.address ||
        !connectedWalletState.coinPublicKey
      ) {
        throw new Error("Invalid wallet state - missing required fields");
      }

      logger?.info("Wallet state", connectedWalletState);

      const newWalletAPI = {
        address: connectedWalletState.address,
        coinPublicKey: connectedWalletState.coinPublicKey,
        encryptionPublicKey: connectedWalletState.encryptionPublicKey,
        wallet: wallet,
        uris: uris,
      };

      setWalletAPI(newWalletAPI);
      setHasConnected(true);

      // Store connection state only after successful connection
      sessionStorage.setItem("WALLET_CONNECTED", "true");

      // Check proof server status
      const proof_server_uri = import.meta.env.VITE_PROOF_SERVER_URI;
      await checkProofServerStatus(proof_server_uri && proof_server_uri);
      toast.success("Connected successfully");

      logger?.info("Wallet connection successful");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect to wallet";

      setError(errorMessage);
      setHasConnected(false);
      toast.error(errorMessage);

      logger?.error("Wallet connection failed", { error: errorMessage });
    } finally {
      setIsConnecting(false);
    }
  };

  // Sets the wallet state as soon as the walletAPI is available after connection
  useEffect(() => {
    if (!walletAPI) return;

    logger?.info("Updating wallet state with API", walletAPI);

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

    setWalletState(newState);

    // Store wallet state only after successful setup
    sessionStorage.setItem("WALLET_STATE", JSON.stringify(newState));

    const newProviders = {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      midnightProvider,
      walletProvider,
      proofProvider,
    };

    setProviders(newProviders);
    logger?.info("Updated providers", newProviders);
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

  const disconnect = async () => {
    sessionStorage.removeItem("WALLET_STATE");
    sessionStorage.removeItem("WALLET_CONNECTED");
    setWalletAPI(undefined);
    setWalletState({
      address: undefined,
      isConnecting: false,
      hasConnected: false,
      coinPublicKey: undefined,
      encryptionPublicKey: undefined,
      providers: undefined,
      walletAPI: undefined,
      error: null,
    });
  };

  // Initiates wallet reconnection on component mount
  useEffect(() => {
    void reconnectToWalletAndProviders();
  }, []); // Only run once on mount

  const contextWalletValue: MidnightWalletContextType = useMemo(
    () => ({
      state: walletState,
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
      disconnect,
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
      providers,
    ]
  );

  return (
    <MidnightWalletContext.Provider value={contextWalletValue}>
      {children}
    </MidnightWalletContext.Provider>
  );
};

export default MidnightWalletProvider;
