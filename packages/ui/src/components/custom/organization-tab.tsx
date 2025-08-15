import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "../ui/tabs";
import type { AdminActions, AdminPayload } from "./admin-panel";
import useDeployment from "@/hookes/useDeployment";
import toast from "react-hot-toast";
import { useState } from "react";
import type { CoinPublicKey } from "@midnight-ntwrk/compact-runtime";
import { Loader2, Settings, Settings2, Shield, ShieldUser } from "lucide-react";
import { utils } from "@statera/statera-api";
import { Separator } from "@radix-ui/react-separator";

interface OrganizationTabProps {
  isSuperAdmin: boolean;
  handleAdminFunctionality: (
    action: AdminActions,
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    payload?: AdminPayload
  ) => Promise<void>;
}

const OrganizationTab = ({isSuperAdmin, handleAdminFunctionality}: OrganizationTabProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isTransfering, setIsTransfering] = useState(false);

  const [newAdmin, setNewAdmin] = useState<CoinPublicKey | "">("");
  const deploymentUtils = useDeployment();
  if (!deploymentUtils?.contractState) {
    toast.error("Failed to retrieve onchian state");
    return;
  }
  return (
    <TabsContent value="organization" className="space-y-4">
      {deploymentUtils.contractState.admins.map((admin, index) => (
        <div key={index} className="flex flex-col space-y-4 py-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {isSuperAdmin ? <ShieldUser /> : <Shield />}
              <p className="text-base text-slate-300">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-slate-400">
              admin_
              {`${utils.uint8arraytostring(admin).slice(0, 5)}***${utils.uint8arraytostring(admin).slice(-4)}`}
            </p>
            {isSuperAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Settings className="text-2xl" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 text-white">
                  <DropdownMenuLabel>Update role</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <Button
                      onClick={() =>
                        handleAdminFunctionality(
                          "transfer",
                          setIsTransfering,
                          utils.uint8arraytostring(admin)
                        )
                      }
                      className="flex items-center gap-1 text-base text-white"
                    >
                      {isTransfering ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="text-2xl" />
                          <span>Assigning role...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Settings2 className="text-2xl" />
                          <span>Assign super admin</span>
                        </div>
                      )}
                    </Button>
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Button className="flex items-center gap-1 text-base text-white">
                      <Settings2 className="text-2xl" />
                      <span>Remove admin</span>
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <Separator className="bg-slate-700/50" />
        </div>
      ))}

      {isSuperAdmin && (
        <div className="space-y-4 pt-8">
          <p className="text-slate-300 text-xl">Add new admin user</p>
          <Input
            id="collateral-ratio"
            placeholder="mn_sheild-cpk_test*******"
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
          <div className="flex gap-2">
            <Button
              disabled={!newAdmin.length}
              onClick={() => {
                if (newAdmin.length < 77)
                  toast.error("Invalid coin public key provided");

                handleAdminFunctionality("add", setIsAdding, newAdmin.trim());
              }}
              variant="destructive"
              size="sm"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
            >
              {isAdding ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding admin...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Make admin
                </div>
              )}
            </Button>
          </div>
        </div>
      )}
    </TabsContent>
  );
};

export default OrganizationTab;
