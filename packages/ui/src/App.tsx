import ConnectToWalletScreen from "./components/custom/ConnectToWalletScreen";
import Dashboard from "./components/custom/dashboard";
import useMidnightWallet from "./hookes/useMidnightWallet";
import { DeployedContractProvider } from "./providers/DeployedContractProvider";

function App() {
  const walletUtils = useMidnightWallet();
  return walletUtils?.hasConnected ? (
    <DeployedContractProvider>
      <Dashboard />
    </DeployedContractProvider>
  ) : (
    <ConnectToWalletScreen />
  );
}

export default App;
