import useMidnightWallet from "@/hookes/useMidnightWallet";
import { StateraAPI, type DeployedStateraAPI } from "@statera/statera-api";
import type { Logger } from "pino";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";

export interface DeploymentProvider {
  readonly isJoining: boolean;
  readonly error: string | null;
  readonly hasJoined: boolean;
  readonly stateraApi: DeployedStateraAPI | undefined;
  onJoinContract: () => Promise<void>;
  clearError: () => void;
}

export const DeployedContractContext = createContext<DeploymentProvider | null>(null);

interface DeployedContractProviderProps extends PropsWithChildren {
  logger?: Logger;
  contractAddress?: string;
}

const DeployedContractProvider = ({ 
  children, 
  logger, 
  contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS 
}: DeployedContractProviderProps) => {
  
  const [stateraApi, setStateraApi] = useState<DeployedStateraAPI | undefined>(undefined);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  // Use the custom hook instead of useContext directly
  const walletContext = useMidnightWallet();

  const onJoinContract = useCallback(async () => {
    // Prevent multiple simultaneous joins
    if (isJoining || hasJoined) return;
    
    // Validate requirements
    if (!walletContext?.walletState.hasConnected || !walletContext?.walletState.providers) {
      setError("Wallet must be connected before joining contract");
      return;
    }

    if (!contractAddress) {
      setError("Contract address not configured");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const deployedAPI = await StateraAPI.joinStateraContract(
        walletContext.walletState.providers,
        contractAddress,
        logger
      );
      
      setStateraApi(deployedAPI);
      setHasJoined(true);
      logger?.info("Successfully joined contract", { contractAddress });
      
    } catch (error) {
      const errMsg = error instanceof Error 
        ? error.message 
        : `Failed to join contract at ${contractAddress}`;
      setError(errMsg);
      logger?.error("Failed to join contract", { error: errMsg, contractAddress });
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, hasJoined, walletContext?.walletState.hasConnected, walletContext?.walletState.providers, contractAddress, logger]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: DeploymentProvider = {
    isJoining,
    hasJoined,
    error,
    stateraApi,
    onJoinContract,
    clearError,
  };

  return (
    <DeployedContractContext.Provider value={contextValue}>
      {children}
    </DeployedContractContext.Provider>
  );
};

// Custom hook for consuming the context
export const useDeployedContract = (): DeploymentProvider => {
  const context = useContext(DeployedContractContext);
  
  if (!context) {
    throw new Error("useDeployedContract must be used within a DeployedContractProvider");
  }
  
  return context;
};

export default DeployedContractProvider;