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
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  AlertTriangle,
} from "lucide-react";

export function CollateralManager() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const collateralTypes = [
    {
      name: "tDUST",
      balance: "12.5",
      value: "$25,000",
      ratio: "150%",
      icon: "Ξ",
      color: "from-purple-500 to-blue-500",
    },
    {
      name: "WBTC",
      balance: "0.75",
      value: "$30,000",
      ratio: "160%",
      icon: "₿",
      color: "from-orange-500 to-yellow-500",
    },
    {
      name: "USDC",
      balance: "5,000",
      value: "$5,000",
      ratio: "110%",
      icon: "$",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">
          Collateral Management
        </h2>
        <p className="text-slate-400">
          Deposit and manage your collateral assets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Manage Collateral</CardTitle>
              <CardDescription className="text-slate-400">
                Deposit or withdraw collateral assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                  <TabsTrigger
                    value="deposit"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger
                    value="withdraw"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                  >
                    Withdraw
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount" className="text-slate-300">
                      Amount to Deposit
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="deposit-amount"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      />
                      <Button
                        variant="outline"
                        className="bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white"
                      >
                        tDUST
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Available: 5.25 tDUST (~$10,500)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount("1.25")}
                      className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount("2.5")}
                      className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount("3.75")}
                      className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount("5.25")}
                      className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                    >
                      Max
                    </Button>
                  </div>

                  <Separator className="bg-slate-700/50" />

                  <div className="space-y-3 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Deposit Amount</span>
                      <span className="text-white font-medium">
                        {depositAmount || "0"} tDUST
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">USD Value</span>
                      <span className="text-white font-medium">
                        $
                        {depositAmount
                          ? (
                              Number.parseFloat(depositAmount) * 2000
                            ).toLocaleString()
                          : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        New Collateral Ratio
                      </span>
                      <span className="text-green-400 font-medium">
                        {depositAmount
                          ? Math.round(
                              165 + Number.parseFloat(depositAmount) * 5
                            )
                          : 165}
                        %
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
                    disabled={!depositAmount}
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Deposit Collateral
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount" className="text-slate-300">
                      Amount to Withdraw
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="withdraw-amount"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      />
                      <Button
                        variant="outline"
                        className="bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white"
                      >
                        tDUST
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Available to withdraw: 8.5 tDUST (~$17,000)
                    </p>
                  </div>

                  <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Withdrawal Warning
                      </span>
                    </div>
                    <p className="text-xs text-yellow-300 mt-1">
                      Ensure your collateral ratio stays above 150% to avoid
                      liquidation
                    </p>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
                    disabled={!withdrawAmount}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Withdraw Collateral
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex gap-2 w-full pt-4">
            <Card className="bg-slate-800/50 backdrop-blur-xl w-1/2 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                  Your Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Collateral</span>
                    <span className="font-medium text-white">$60,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Minted Stablecoins</span>
                    <span className="font-medium text-white">35,000 USC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Collateral Ratio</span>
                    <Badge className="bg-green-900/30 text-green-400 border-green-500/30">
                      171%
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-slate-700/50" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Health Factor</span>
                    <span className="text-green-400 font-medium">1.71</span>
                  </div>
                  <Progress value={85} className="h-2 bg-slate-700" />
                  <p className="text-xs text-green-400">
                    ✓ Healthy - Well above liquidation threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Liquidation Price</span>
                    <span className="text-red-400">$1,750 tDUST</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Current Price</span>
                    <span className="text-green-400">$2,000 tDUST</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            
            <Card className="bg-slate-800/50 backdrop-blur-xl w-1/2 border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                  Your Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Collateral</span>
                    <span className="font-medium text-white">$60,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Minted Stablecoins</span>
                    <span className="font-medium text-white">35,000 USC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Collateral Ratio</span>
                    <Badge className="bg-green-900/30 text-green-400 border-green-500/30">
                      171%
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-slate-700/50" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Health Factor</span>
                    <span className="text-green-400 font-medium">1.71</span>
                  </div>
                  <Progress value={85} className="h-2 bg-slate-700" />
                  <p className="text-xs text-green-400">
                    ✓ Healthy - Well above liquidation threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Liquidation Price</span>
                    <span className="text-red-400">$1,750 tDUST</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Current Price</span>
                    <span className="text-green-400">$2,000 tDUST</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-xl w-1/2 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Collateral Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {collateralTypes.map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-slate-700/50 rounded-lg bg-slate-700/20 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 bg-gradient-to-r ${asset.color} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                      >
                        {asset.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">
                          {asset.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {asset.balance}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {asset.value}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs border-slate-600 text-slate-300"
                      >
                        {asset.ratio}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
