import { Label } from "@radix-ui/react-label";
import { TabsContent } from "@radix-ui/react-tabs";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CoinsIcon, DollarSign, Loader2 } from "lucide-react";
import useDeployment from "@/hookes/useDeployment";
import { useCallback, useState } from "react";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import {
  StateraAPI,
  utils,
} from "@statera/statera-api";
import toast from "react-hot-toast";
import { Separator } from "@radix-ui/react-separator";
import type { AdminActions, AdminPayload } from "./admin-panel";

const DeploymentBoard = ({
  handleAdminFunctionality,
}: {
  handleAdminFunctionality: (
    action: AdminActions,
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    payload?: AdminPayload
  ) => Promise<void>;
}) => {
  const [initCollateralRatio, setInitCollateralRatio] = useState("");
  const [initLiquidationThreshold, setInitLiquidationThreshold] = useState("");
  const [initLVT, setInitLVT] = useState("");
  const [initValiAssetType, setInitValiAssetType] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSetting, setIsSetting] = useState(false);

  const deploymentUtils = useDeployment();
  const walletUtils = useMidnightWallet();

  const handleNewDeployment = useCallback(async () => {
    if (initCollateralRatio.trim()) setIsDeploying(true);
    try {
      if (!walletUtils) return;
      await StateraAPI.deployStateraContract(
        walletUtils,
      );
      setIsDeploying(false);
      toast.success("Deployed successfully");
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Transaction failed";
      toast.error(errMsg);
    } finally {
      setIsDeploying(false);
    }
  }, []);

  if (!deploymentUtils?.contractState) {
    toast.error("Failed to retrieve onchian state");
    return;
  }
  return (
    <TabsContent value="contract managment" className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNewDeployment();
        }}
        className="space-y-4"
      >
        <h2 className="py-4 font-bold text-slate-400">Deploy new statera contract</h2>
        <div className="space-y-2">
          <Label className="text-slate-300">Minimum collateral ratio (%)</Label>
          <Input
            required
            onChange={(e) => setInitCollateralRatio(e.target.value.trim())}
            placeholder="0.5"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <p className="text-xs text-muted-foreground text-slate-400">
            Current: {deploymentUtils.contractState.MCR}%
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Liquidation Threshold (%)</Label>
          <Input
            required
            onChange={(e) => setInitLiquidationThreshold(e.target.value.trim())}
            placeholder="5"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <p className="text-xs text-muted-foreground text-slate-400">
            Current: {deploymentUtils.contractState.liquidationThreshold}%
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Loan to Value (LVT) (%)</Label>
          <Input
            required
            onChange={(e) => setInitLVT(e.target.value.trim())}
            placeholder="12.5"
            className="bg-slate-700/50 border-slate-600 t ext-white placeholder:text-slate-400"
          />
          <p className="text-xs text-muted-foreground text-slate-400">
            Current: {deploymentUtils.contractState.LVT}%
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">
            Valid Collateral Asset Type (tDUST)
          </Label>
          <Input
            required
            onChange={(e) => setInitValiAssetType(e.target.value.trim())}
            placeholder="12.5"
            className="bg-slate-700/50 border-slate-600 t ext-white placeholder:text-slate-400"
          />
          <p className="text-xs text-muted-foreground text-slate-400">
            Current:{" "}
            {utils.uint8arraytostring(
              deploymentUtils.contractState.validCollateralType
            )}
            </p>
        </div>

        <Button
          type="submit"
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
        >
          {isDeploying ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Deploying
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Deploy
            </div>
          )}
        </Button>
      </form>

      <Separator />

      <div className="space-y-4 pt-8">
        <p className="text-slate-300 text-xl">Set sUSD coin color</p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              handleAdminFunctionality("setSUSDType", setIsSetting);
            }}
            variant="destructive"
            size="sm"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
          >
            {isSetting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CoinsIcon className="w-4 h-4" />
                Set coin color
              </div>
            )}
          </Button>
        </div>
      </div>
    </TabsContent>
  );
};

export default DeploymentBoard;
