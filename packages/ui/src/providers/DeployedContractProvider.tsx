import useMidnightWallet from "@/hookes/useMidnightWallet";
import { decodeCoinPublicKey } from "@midnight-ntwrk/compact-runtime";
import { getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { parseCoinPublicKeyToHex } from "@midnight-ntwrk/midnight-js-utils";
import type { Depositor, StateraPrivateState } from "@statera/statera-protocol";
import {
  StateraAPI,
  type DeployedStateraAPI,
  type DerivedStateraContractState,
} from "@statera/statera-api";
import type { Logger } from "pino";
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import toast from "react-hot-toast";

export interface DeploymentProvider {
  readonly userRole: "admin" | "user";
  readonly privateState: StateraPrivateState | null;
  readonly isJoining: boolean;
  readonly error: string | null;
  readonly hasJoined: boolean;
  readonly stateraApi: DeployedStateraAPI | undefined;
  readonly contractState: DerivedStateraContractState | undefined;
  onJoinContract: () => Promise<void>;
  clearError: () => void;
  readonly SCALE_FACTOR: bigint;
  readonly currentDepositor: Depositor | null;
  readonly healthFactor: bigint | null;
}

export const DeployedContractContext = createContext<DeploymentProvider | null>(
  null
);

interface DeployedContractProviderProps extends PropsWithChildren {
  logger?: Logger;
  contractAddress?: string;
}

// interface EnhancedStateraPrivateState extends StateraPrivateState {
//   hFactor: bigint;
// }

export const DeployedContractProvider = ({
  children,
  logger,
  contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS,
}: DeployedContractProviderProps) => {
  const [stateraApi, setStateraApi] = useState<DeployedStateraAPI | undefined>(
    undefined
  );
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contractState, setContractState] = useState<
    DerivedStateraContractState | undefined
  >(undefined);
  const [currentDepositor, setCurrentDepositor] = useState<Depositor | null>(
    null
  );
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [privateState, setPrivateState] = useState<StateraPrivateState | null>(
    null
  );
  const [healthFactor, setHealthFactor] = useState<bigint | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "user">("user");
  const SCALE_FACTOR = 1_000_000n;

  // Use the custom hook instead of useContext directly
  const walletContext = useMidnightWallet();

  const onJoinContract = async () => {
    // Prevent multiple simultaneous joins
    if (isJoining || hasJoined) return;

    // Validate requirements
    if (!walletContext?.hasConnected) {
      setError("Wallet must be connected before joining contract");
      return;
    }

    if (!contractAddress) {
      setError("Contract address not configured");
      toast.error("Contract address not configured");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const deployedAPI = await StateraAPI.joinStateraContract(
        walletContext,
        contractAddress,
        logger
      );

      setStateraApi(deployedAPI);
      toast.success("Onboarded successfully");
      setHasJoined(true);
      logger?.info("Successfully joined contract", { contractAddress });
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : `Failed to join contract at ${contractAddress}`;
      setError(errMsg);
      toast.error(errMsg);
      logger?.error("Failed to join contract", {
        error: errMsg,
        contractAddress,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!stateraApi) return;

    const stateSubscription = stateraApi.state.subscribe(setContractState);

    return () => stateSubscription.unsubscribe();
  }, [stateraApi]);

  // Fetches and provides an extended user private state, then set the current depositor from the list of depositors
  useEffect(() => {
    if (!stateraApi && !walletContext) return;
    (async function fetchPrivateState() {
      const userPrivateState = await walletContext?.privateStateProvider.get(
        "stateraPrivateState"
      );

      if (userPrivateState) {
        //Update global states
        setPrivateState(userPrivateState);

        if (contractState && currentDepositor) {
          setHealthFactor(
            (contractState?.liquidationThreshold *
              (userPrivateState?.mint_metadata.collateral *
                currentDepositor.entryOraclePrice)) /
              (userPrivateState.mint_metadata.debt * SCALE_FACTOR)
          );
        }
      } else return;
    })();
  }, [walletContext?.privateStateProvider, contractState]);

  //Sets the user role whenever the onchain state changes
  useEffect(() => {
    if (!contractState) return;

    const walletAddressHex = parseCoinPublicKeyToHex(
      walletContext?.state.coinPublicKey as string,
      getZswapNetworkId()
    );

    const vault = contractState.collateralDepositors.find(
      (vault) => decodeCoinPublicKey(vault.id) == walletAddressHex
    );
    console.log("vault", vault);
    if (!vault) return;

    //Update the current depositor
    setCurrentDepositor(vault.state);

    const role =
      decodeCoinPublicKey(contractState.superAdmin) == walletAddressHex ||
      contractState.admins.findIndex(
        (admin) => decodeCoinPublicKey(admin) == walletAddressHex
      ) != -1
        ? "admin"
        : "user";

    console.log("USER ROLE:", role);

    setUserRole(role);
  }, [stateraApi, contractState]);

  const contextValue: DeploymentProvider = {
    isJoining,
    hasJoined,
    error,
    stateraApi,
    onJoinContract,
    clearError,
    contractState,
    privateState,
    userRole,
    SCALE_FACTOR,
    currentDepositor,
    healthFactor
  };

  return (
    <DeployedContractContext.Provider value={contextValue}>
      {children}
    </DeployedContractContext.Provider>
  );
};
