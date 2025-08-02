import { TabsContent } from "../ui/tabs";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, Settings } from "lucide-react";
import type { AdminActions, AdminPayload } from "./admin-panel";
import { useState } from "react";
import useDeployment from "@/hookes/useDeployment";
import toast from "react-hot-toast";

interface ContractUpdateTabProps {
  handleAdminFunctionality: (
    action: AdminActions,
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    payload?: AdminPayload
  ) => Promise<void>;
}

const ContractUpdateTab = ({
  handleAdminFunctionality,
}: ContractUpdateTabProps) => {
  const [newCollateralRatio, setNewCollateralRatio] = useState("");
  const [liquidationThreshold, setLiquidationThreshold] = useState("");
  const [LVT, setLVT] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const deploymentUtils = useDeployment();

  if (!deploymentUtils?.contractState) {
    toast.error("Failed to retrieve onchain state");
    return null; // Return null instead of undefined
  }

  // Helper function to validate numeric input
  const isValidNumericInput = (value: string): boolean => {
    return value.trim().length > 0 && !isNaN(Number(value)) && Number(value) > 0;
  };

  // Check if all fields are valid
  const areAllFieldsValid = () => {
    return (
      isValidNumericInput(newCollateralRatio) &&
      isValidNumericInput(liquidationThreshold) &&
      isValidNumericInput(LVT)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!areAllFieldsValid()) {
      toast.error("All fields are required and must be valid positive numbers");
      return;
    }

    // Additional validation for reasonable values
    const mcrValue = Number(newCollateralRatio);
    const ltValue = Number(liquidationThreshold);
    const lvtValue = Number(LVT);

    if (mcrValue < 100 || mcrValue > 500) {
      toast.error("MCR should be between 100% and 500%");
      return;
    }

    if (ltValue < 80 || ltValue > 200) {
      toast.error("Liquidation Threshold should be between 100% and 200%");
      return;
    }

    if (lvtValue <= 0) {
      toast.error("LVT must be a positive number");
      return;
    }

    // If validation passes, proceed with the update
    handleAdminFunctionality("update", setIsUpdating, {
      MCR: mcrValue,
      liquidation_threshold: ltValue,
      LVT: lvtValue,
    });
  };

  return (
    <TabsContent value="parameters" className="space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="collateral-ratio" className="text-slate-300">
            Minimum Collateral Ratio (MCR)(%)
          </Label>
          <Input
            required
            id="collateral-ratio"
            type="number"
            min="100"
            max="500"
            step="1"
            placeholder="150"
            value={newCollateralRatio}
            onChange={(e) => setNewCollateralRatio(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <p className="text-xs text-muted-foreground text-slate-400">
            Current: {deploymentUtils?.contractState.MCR}%
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="liquidation-threshold" className="text-slate-300">
            Liquidation Threshold (LT)(%)
          </Label>
          <Input
            required
            id="liquidation-threshold"
            type="number"
            min="100"
            max="200"
            step="1"
            value={liquidationThreshold}
            onChange={(e) => setLiquidationThreshold(e.target.value)}
            placeholder="120"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <p className="text-xs text-muted-foreground text-slate-400">
            Current: {deploymentUtils.contractState.liquidationThreshold}%
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lvt" className="text-slate-300">
            Loan to Value (LVT)
          </Label>
          <Input
            required
            id="lvt"
            type="number"
            min="1"
            step="1"
            value={LVT}
            onChange={(e) => setLVT(e.target.value)}
            placeholder="10000000"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <p className="text-xs text-muted-foreground text-slate-400">
            Current: {deploymentUtils.contractState.LVT}
          </p>
        </div>

        <Button
          type="submit"
          disabled={!areAllFieldsValid() || isUpdating}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Update Parameters
            </div>
          )}
        </Button>
      </form>
    </TabsContent>
  );
};

export default ContractUpdateTab;