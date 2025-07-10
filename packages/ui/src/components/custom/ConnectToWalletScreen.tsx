import useMidnightWallet from "@/hookes/useMidnightWallet";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Loader2, Wallet, Zap } from "lucide-react";

const ConnectToWalletScreen = () => {
  const walletUtils = useMidnightWallet();
  return (
    <div className="w-full flex justify-center px-6 py-12 items-center  min-h-screen text-white bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Card
        className={`relative lg:w-[40%] text-center flex justify-center items-center overflow-hidden backdrop-blur-xl border bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10
            `}
      >
        <div className="p-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <Zap className="w-16 h-16 text-white" />
        </div>
        <h3 className="text-3xl font-bold">Welcome to Statera Defi Platform</h3>
        <p className="text-md text-zinc-100">
          Midnight's most reliable overcollaterized stable coin protocol.
          Connect your wallet and get onboarded straight away
        </p>
        <Button
          onClick={async () => {
            await walletUtils?.connectFn();
          }}
          className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
        >
          {walletUtils?.isConnecting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </>
          )}
        </Button>
      </Card>
    </div>
  );
};

export default ConnectToWalletScreen;
