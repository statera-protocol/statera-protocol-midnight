import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import useDeployment from "@/hookes/useDeployment";
import { TrendingUp, DollarSign, Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { distinctUntilChanged, map, tap } from "rxjs";

type OverviewBoarState = {
  collateralTVL: bigint;
  stakePoolTotal: bigint;
  totalMint: bigint;
  liquidationThreshold: bigint;
};

export function Overview() {
  const deploymentCtx = useDeployment();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [boardState, setBoardState] = useState<OverviewBoarState | undefined>(
    undefined
  );
  const deploymentStateProvider = deploymentCtx?.stateraApi?.state;
  const boardOverview$ = deploymentStateProvider?.pipe(
    map((state) => ({
      collateralTVL: state.reservePoolTotal.value,
      stakePoolTotal: state.stakePoolTotal,
      totalMint: state.totalMint,
      liquidationThreshold: state.liquidationThreshold,
    })),
    tap((state) => {
      console.log({
        boardState: state,
      });
    }),
    distinctUntilChanged(
      (prev, curr) =>
        prev.collateralTVL === curr.collateralTVL &&
        prev.liquidationThreshold === curr.liquidationThreshold &&
        prev.stakePoolTotal === curr.stakePoolTotal &&
        prev.totalMint === curr.totalMint
    )
  );

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await deploymentCtx?.onJoinContract();
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        const errMsg =
          error instanceof Error ? error.message : "Failed to join contract";
        toast.error(errMsg);
      }
    })();
  }, []);

  useEffect(() => {
    if (!deploymentStateProvider) return;

    const subscritption = boardOverview$?.subscribe((value) =>
      setBoardState(value)
    );

    return () => subscritption?.unsubscribe();
  }, [deploymentCtx?.stateraApi]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">
          Protocol Overview
        </h2>
        <p className="text-slate-400">Monitor key metrics and system health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className={`relative overflow-hidden backdrop-blur-xl border bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Value Locked
            </CardTitle>
            <DollarSign className={`h-5 w-5 text-cyan-400`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {deploymentCtx?.contractState !== undefined ? (
                `${(Number(deploymentCtx?.contractState?.reservePoolTotal.value)/ 1_000_000)} tDUST`
              ) : (
                <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className={"text-green-400"}>{12}</span>
              <span className="text-slate-500">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`relative overflow-hidden backdrop-blur-xl border bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Stablecoins Minted
            </CardTitle>
            <DollarSign className={`h-5 w-5 text-cyan-400`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {deploymentCtx?.contractState !== undefined ? (
                `${Number(deploymentCtx?.contractState?.totalMint)} sUSD`
              ) : (
                <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className={"text-green-400"}>{12}</span>
              <span className="text-slate-500">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`relative overflow-hidden backdrop-blur-xl border bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              StakePool TVL
            </CardTitle>
            <DollarSign className={`h-5 w-5 text-cyan-400`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {deploymentCtx?.contractState !== undefined ? (
                `${Number(deploymentCtx?.contractState?.stakePoolTotal)} sUSD`
              ) : (
                <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className={"text-green-400"}>{12}</span>
              <span className="text-slate-500">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              System Health
            </CardTitle>
            <CardDescription className="text-slate-400">
              Current protocol status and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Collateralization Ratio</span>
                <span className="text-white font-medium">80%</span>
              </div>
              <Progress value={90} className="h-2 bg-slate-700" />
              <p className="text-xs text-green-400">
                ✓ Healthy - Above minimum threshold
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Liquidation Buffer</span>
                <span className="text-white font-medium">90%</span>
              </div>
              <Progress value={75} className="h-2 bg-slate-700" />
              <p className="text-xs text-yellow-400">
                ⚠ Good - Sufficient buffer maintained
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Staking Pool Coverage</span>
                <span className="text-white font-medium">98.5%</span>
              </div>
              <Progress value={98} className="h-2 bg-slate-700" />
              <p className="text-xs text-green-400">
                ✓ Excellent - Bad debt well covered
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Latest protocol transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="w-full min-h-[200px]">
            <div className="space-y-4">
              {boardState ? (
                Object.entries(boardState).map(([key, value], index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 py-3 border-b border-slate-700/50 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index == 0
                            ? "bg-green-400"
                            : index == 1
                              ? "bg-blue-400"
                              : index == 2
                                ? "bg-purple-400"
                                : "bg-red-400"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col flex-1 gap-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium capitalize text-white">
                          {key}
                        </p>
                        <p className="text-xs text-slate-500">{value}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-slate-400">0x1453378</p>
                        <p className="text-xs text-slate-400">2mins</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex justify-center items-center">
                  <Loader2 className="animate-spin w-20 h-20 text-blue-500" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
