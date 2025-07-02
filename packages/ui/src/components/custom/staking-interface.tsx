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
import { TrendingUp, Shield, Gift, Clock } from "lucide-react";

export function StakingInterface() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

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
          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Stake sUSD Tokens</CardTitle>
              <CardDescription>
                Earn rewards while helping to cover bad debt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stake" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stake">Stake</TabsTrigger>
                  <TabsTrigger value="unstake">Unstake</TabsTrigger>
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
                      onClick={() => setStakeAmount("625")}
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount("1250")}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount("1875")}
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStakeAmount("2500")}
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
                      <span>Estimated Daily Rewards</span>
                      <span className="text-green-600">
                        {stakeAmount
                          ? (
                              (Number.parseFloat(stakeAmount) * 0.125) /
                              365
                            ).toFixed(4)
                          : "0"}{" "}
                        sUSD
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Lock Period</span>
                      <span>7 days</span>
                    </div>
                  </div>

                  <Button className="w-full" disabled={!stakeAmount}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Stake sUSD
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

                  <Button className="w-full" disabled={!unstakeAmount}>
                    <Clock className="w-4 h-4 mr-2" />
                    Unstake sUSD
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
                    className="border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3"
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
                        <p className="font-medium">{pool.userStaked} sUSD</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rewards</p>
                        <p className="font-medium text-green-600">
                          {pool.rewards} sUSD
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Stake More
                      </Button>
                      <Button size="sm" variant="outline">
                        Claim Rewards
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Your Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending Rewards</span>
                  <span className="font-medium text-green-600">
                    192.75 sUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Claimed Today</span>
                  <span className="font-medium">25.50 sUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Earned</span>
                  <span className="font-medium">1,247.25 sUSD</span>
                </div>
              </div>

              <Button className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                Claim All Rewards
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Staking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Staked</span>
                  <span className="font-medium">7,500 sUSD</span>
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
