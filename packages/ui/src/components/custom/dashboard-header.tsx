"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Wallet,
  ChevronDown,
  Settings,
  Activity,
  Bell,
  Loader2,
} from "lucide-react";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import toast from "react-hot-toast";
import { Badge } from "../ui/badge";
import useDeployment from "@/hookes/useDeployment";


export function DashboardHeader() {
  const walletUtils = useMidnightWallet();
  const deploymentCTX = useDeployment();

  return (
    <header className="border-b sticky z-[50] top-0 border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-slate-300 hover:text-white" />
          <div>
            <h1 className="text-xl font-semibold text-white">
              Statera Dashboard
            </h1>
            <p className="text-sm text-slate-400">
              Manage your stablecoin positions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-300">Network: Midnight</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Badge
            variant={deploymentCTX?.userRole === "admin" ? "default" : "secondary"}
            className={
              deploymentCTX?.userRole === "admin"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                : "bg-slate-700 text-slate-300"
            }
          >
            {deploymentCTX?.userRole === "admin" ? "Admin" : "User"}
          </Badge>

          {walletUtils?.hasConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0">
                  <Wallet className="w-4 h-4" />
                  {`${walletUtils.state.address?.slice(0, 4)}...${walletUtils.state.address?.slice(-4)}`}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-slate-800 border-slate-700"
              >
                <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {}}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={async () => {
                try {
                  await walletUtils?.connectFn();
                } catch (error) {
                  const errMsg = error instanceof Error ? error.message : "Connection failed, is lace wallet installed?";
                  toast.error(errMsg)
                }
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
          )}
        </div>
      </div>
    </header>
  );
}
