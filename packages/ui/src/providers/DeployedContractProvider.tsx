import useMidnightWallet from "@/hookes/useMidnightWallet";
import type { StateraPrivateState } from "@statera/ada-statera-protocol";
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
  readonly privateState: StateraPrivateState | null;
  readonly isJoining: boolean;
  readonly error: string | null;
  readonly hasJoined: boolean;
  readonly stateraApi: DeployedStateraAPI | undefined;
  readonly contractState: DerivedStateraContractState | undefined;
  onJoinContract: () => Promise<void>;
  clearError: () => void;
}

export const DeployedContractContext = createContext<DeploymentProvider | null>(
  null
);

interface DeployedContractProviderProps extends PropsWithChildren {
  logger?: Logger;
  contractAddress?: string;
}

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
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [privateState, setPrivateState] = useState<StateraPrivateState | null>(
    null
  );

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
      toast.error(error);
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

  useEffect(() => {
    if (!stateraApi && !walletContext) return;
    (async function fetchPrivateState() {
      const userPrivateState = await walletContext?.privateStateProvider.get(
        "stateraPrivateState"
      );

      if (userPrivateState) {
        setPrivateState(userPrivateState);
      } else return;
    })();
  }, [walletContext?.privateStateProvider, contractState]);

  const contextValue: DeploymentProvider = {
    isJoining,
    hasJoined,
    error,
    stateraApi,
    onJoinContract,
    clearError,
    contractState,
    privateState,
  };

  return (
    <DeployedContractContext.Provider value={contextValue}>
      {children}
    </DeployedContractContext.Provider>
  );
};
