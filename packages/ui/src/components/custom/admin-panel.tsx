"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Activity, Loader2 } from "lucide-react";
import useDeployment from "@/hookes/useDeployment";
import {
  decodeCoinPublicKey,
} from "@midnight-ntwrk/compact-runtime";
import { parseCoinPublicKeyToHex } from "@midnight-ntwrk/midnight-js-utils";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import { getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import toast from "react-hot-toast";
import ContractUpdateTab from "./update-tab";
import DeploymentBoard from "./deployment-tab";
import OrganizationTab from "./organization-tab";

export type AdminActions = "setSUSDType" | "add" | "update" | "transfer";
export type UpdatePayload = {
  MCR: number;
  liquidation_threshold: number;
  LVT: number;
};

export type AdminPayload = UpdatePayload | string;

export function AdminPanel() {
  const deploymentUtils = useDeployment();
  const walletUtils = useMidnightWallet();

  const systemMetrics = [
    { label: "Total Users", value: "1,247", change: "+12%" },
    { label: "Active Positions", value: "892", change: "+8%" },
    { label: "Liquidations (24h)", value: "23", change: "-15%" },
    { label: "Protocol Revenue", value: "$45,230", change: "+22%" },
  ];

  const recentActions = [
    { action: "Collateral ratio updated", user: "Admin", time: "2 hours ago" },
    { action: "Emergency mode disabled", user: "Admin", time: "1 day ago" },
    { action: "New collateral type added", user: "Admin", time: "3 days ago" },
    { action: "Fee structure updated", user: "Admin", time: "1 week ago" },
  ];

  if (!deploymentUtils?.contractState) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
        <p className="text-slate-300">Retrieving contract state</p>
      </div>
    );
  }

  const isSuperAdmin =
    deploymentUtils?.contractState &&
    decodeCoinPublicKey(deploymentUtils?.contractState?.super_admin) ==
      parseCoinPublicKeyToHex(
        walletUtils?.state.coinPublicKey as string,
        getZswapNetworkId()
      );

  const handleAdminFunctionality = async (
    action: AdminActions,
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    payload?: AdminPayload
  ) => {
    if (!deploymentUtils.stateraApi) return;
    let txResult;
    stateSetter(true);
    try {
      switch (action) {
        case "setSUSDType": {
          txResult = await deploymentUtils.stateraApi.setSUSDColor();
          break;
        }

        case "add": {
          if (typeof payload === "string") {
            txResult = await deploymentUtils.stateraApi.addAdmin(
              parseCoinPublicKeyToHex(payload, getZswapNetworkId())
            );
          } else {
            throw new Error("Invalid payload for add action: expected string");
          }
          break;
        }

        case "transfer": {
          if (typeof payload === "string") {
            txResult = await deploymentUtils.stateraApi.transferSuperAdminRole(
              parseCoinPublicKeyToHex(payload, getZswapNetworkId())
            );
          } else {
            throw new Error("Invalid payload for add action: expected string");
          }
          break;
        }

        case "update": {
          if (payload && typeof payload === "object" && "MCR" in payload) {
            txResult = await deploymentUtils.stateraApi.reset(
              payload.liquidation_threshold,
              payload.LVT,
              payload.MCR
            );
          } else {
            throw new Error(
              "Invalid payload for update action: expected UpdatePayload"
            );
          }
          break;
        }
      }

      txResult?.public.status === "SucceedEntirely"
        ? toast.success(`${action.toLocaleUpperCase()} Transaction successfull`)
        : toast.error(`${action.toLocaleUpperCase()} Transaction failed`);
      stateSetter(false);
    } catch (error) {
      console.log(`${action}`, error)
      const errMsg =
        error instanceof Error ? error.message : "Transaction failed";
      toast.error(errMsg);
      stateSetter(false);
    } finally {
      stateSetter(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Admin Panel</h2>
        <p className="text-muted-foreground text-slate-400">
          Manage protocol settings and monitor system health
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, index) => (
          <Card
            key={index}
            className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                {metric.label}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground text-slate-400">
                <span className="text-green-600">{metric.change}</span> from
                last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Protocol Controls</CardTitle>
              <CardDescription className="text-slate-400">
                Manage critical protocol parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="organization" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                  <TabsTrigger
                    value="organization"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Organization
                  </TabsTrigger>
                  <TabsTrigger
                    value="parameters"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Parameters
                  </TabsTrigger>
                  <TabsTrigger
                    value="contract managment"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Contract Managment
                  </TabsTrigger>
                </TabsList>

                <OrganizationTab
                  isSuperAdmin={isSuperAdmin}
                  handleAdminFunctionality={handleAdminFunctionality}
                />
                <ContractUpdateTab
                  handleAdminFunctionality={handleAdminFunctionality}
                />
                <DeploymentBoard
                  handleAdminFunctionality={handleAdminFunctionality}
                />
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-4 h-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Protocol Health</span>
                  <Badge
                    variant="secondary"
                    className="text-green-400 bg-green-900/30 border-green-500/30"
                  >
                    Healthy
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Oracle Status</span>
                  <Badge
                    variant="secondary"
                    className="text-green-400 bg-green-900/30 border-green-500/30"
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Liquidation Engine</span>
                  <Badge
                    variant="secondary"
                    className="text-green-400 bg-green-900/30 border-green-500/30"
                  >
                    Running
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="w-4 h-4" />
                Recent Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {action.action}
                      </p>
                      <p className="text-xs text-muted-foreground text-slate-400">
                        {action.user}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground text-slate-400">
                      {action.time}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Risk Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Positions at Risk</span>
                <span className="font-medium text-yellow-400">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Avg. Collateral Ratio</span>
                <span className="font-medium text-white">168%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Bad Debt Coverage</span>
                <span className="font-medium text-green-400">1,960%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
