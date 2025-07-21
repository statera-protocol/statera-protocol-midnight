import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Shield, Gift, Clock, Loader2, Wallet } from "lucide-react";
import useDeployment from "@/hookes/useDeployment";
import toast from "react-hot-toast";
import { decodeCoinPublicKey } from "@midnight-ntwrk/compact-runtime";
import { parseCoinPublicKeyToHex } from "@midnight-ntwrk/midnight-js-utils";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import { getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

type StakersActions = "stake" | "unstake" | "check" | "withdraw";

export function StakingInterface() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [withdrawingReward, setWithdrawingReward] = useState(false);
  const [checking, setChecking] = useState(false);
  const deploymentCTX = useDeployment();
  const walletCtx = useMidnightWallet();

  const stakePosition =
    walletCtx &&
    deploymentCTX?.contractState?.stakers.find(
      (position) =>
        decodeCoinPublicKey(position.id) ===
        parseCoinPublicKeyToHex(
          walletCtx.state.coinPublicKey as string,
          getZswapNetworkId()
        )
    );

  const stakingPools = [
    {
      name: "Protocol Stake Pool",
      apy: "8.2%",
      tvl: "$1,200,000",
      userStaked: "2,500",
      rewards: "67.25",
      risk: "Low",
    },
  ];

  const handleStakeInteraction = async (
    action: StakersActions,
    stateSetter: React.Dispatch<React.SetStateAction<boolean>>,
    amt?: number
  ) => {
    if (!deploymentCTX?.stateraApi) return;
    let txResult;
    stateSetter(true);
    try {
      switch (action) {
        case "stake":
          txResult = await deploymentCTX?.stateraApi.depositToStakePool(
            amt as number
          );
          break;
        case "unstake":
          txResult = await deploymentCTX.stateraApi.withdrawStake(
            amt as number
          );
          break;
        case "check":
          txResult = await deploymentCTX.stateraApi.checkStakeReward();
          break;
        case "withdraw":
          txResult = await deploymentCTX.stateraApi.withdrawStakeReward(
            amt as number
          );
          break;
        default:
          break;
      }
      txResult?.public.status === "SucceedEntirely"
        ? toast.success(`${action.toLocaleUpperCase()} Transaction successfull`)
        : toast.error(`${action.toLocaleUpperCase()} Transaction failed`);
      stateSetter(false);
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : `${action.toLocaleUpperCase()} Transaction Failed`;
      toast.error(errMsg);
      stateSetter(false);
    } finally {
      stateSetter(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Staking & Rewards</h2>
        <p className="text-muted-foreground">
          Stake sUSD to earn rewards and help secure the protocol
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle>Stake sUSD Tokens</CardTitle>
              <CardDescription>
                Earn rewards while helping to cover bad debt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stake" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                  <TabsTrigger
                    value="stake"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Stake
                  </TabsTrigger>
                  <TabsTrigger
                    value="unstake"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Unstake
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stake" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stake-amount">Amount to Stake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stake-amount"
                        placeholder="0.00"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                      />
                      <Button variant="outline">sUSD</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: 2,500 sUSD
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount("1")}
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount("5")}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount("7")}
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount("10")}
                    >
                      Max
                    </Button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-cyan-200 dark:border-cyan-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-200">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Staking Benefits
                      </span>
                    </div>
                    <ul className="text-xs text-cyan-700 dark:text-cyan-300 mt-1 space-y-1">
                      <li>• Earn 12.5% APY in sUSD rewards</li>
                      <li>• Help secure the protocol</li>
                      <li>• Participate in governance</li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stake Amount</span>
                      <span>{stakeAmount || "0"} sUSD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Lock Period</span>
                      <span>7 days</span>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      handleStakeInteraction(
                        "stake",
                        setIsStaking,
                        parseInt(stakeAmount)
                      )
                    }
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
                    disabled={!stakeAmount}
                  >
                    {isStaking ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 animate-spin h-4 mr-2" />
                        Stake sUSD
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Stake sUSD
                      </div>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="unstake" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="unstake-amount"
                        placeholder="0.00"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                      />
                      <Button variant="outline">sUSD</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Staked: 7,500 sUSD
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Unstaking Period
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      Unstaked tokens will be available after a 7-day cooldown
                      period
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      handleStakeInteraction(
                        "unstake",
                        setIsUnstaking,
                        parseInt(unstakeAmount)
                      )
                    }
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
                    disabled={!unstakeAmount}
                  >
                    {isUnstaking ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Unstake sUSD...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 mr-2" />
                        Unstake sUSD
                      </div>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="mt-6 bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Staking Pools</CardTitle>
              <CardDescription>
                Choose from different staking options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stakingPools.map((pool, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-zinc-700 bg-transparent dark:bg-zinc-800/50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{pool.name}</h3>
                      <Badge
                        variant={pool.risk === "Low" ? "secondary" : "outline"}
                      >
                        {pool.risk} Risk
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">APY</p>
                        <p className="font-medium text-green-600">{pool.apy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">TVL</p>
                        <p className="font-medium">{pool.tvl}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Your Stake</p>
                        <p className="font-medium">
                          {(stakePosition &&
                            stakePosition.staker.stake_reward) ||
                            0}{" "}
                          sUSD
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rewards</p>
                        <p className="font-medium text-green-600">
                          {pool.rewards} sUSD
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {stakePosition ? (
            <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Your Reward Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pending Rewards</span>
                    <span className="font-medium text-green-600">
                      {stakePosition.staker.stake_reward} tDUST
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Claimed Today</span>
                    <span className="font-medium">0 sUSD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Earned</span>
                    <span className="font-medium">
                      {stakePosition.staker.stake_reward} sUSD
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleStakeInteraction("check", setChecking)}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
                >
                  {checking ? (
                    <div>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </div>
                  ) : (
                    <div>
                      <Gift className="w-4 h-4 mr-2" />
                      Check current stake reward
                    </div>
                  )}
                </Button>
                {stakePosition && stakePosition.staker.stake_reward > 0 && (
                  <Button
                    onClick={() =>
                      handleStakeInteraction(
                        "withdraw",
                        setWithdrawingReward,
                        parseInt(stakeAmount)
                      )
                    }
                    size="sm"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
                  >
                    {withdrawingReward ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Claiming Reward...
                      </div>
                    ) : (
                      "Claim Rewards"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="w-full border-slate-700/50 rounded-lg border items-center gap-2 flex flex-col py-20 text-center">
              <h1 className="text-slate-300 text-2xl font-semibold">
                You have no stake position
              </h1>
              <p className="text-sm text-slate-400">
                Stake sUSD to earn stake reward in other tokens
              </p>
              <Wallet size={40} className="fill-blue-600" />
            </div>
          )}

          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Staking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Staked</span>
                  <span className="font-medium">
                    {deploymentCTX?.contractState?.stakePoolTotal} sUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average APY</span>
                  <span className="font-medium text-green-600">10.8%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lock Status</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Next Unlock</span>
                  <span className="font-medium">5 days</span>
                </div>
                <Progress value={28} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  2 days remaining in lock period
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
