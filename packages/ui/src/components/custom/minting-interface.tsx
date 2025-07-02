import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Coins, ArrowRightLeft, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

export function MintingInterface() {
  const [mintAmount, setMintAmount] = useState("")
  const [burnAmount, setBurnAmount] = useState("")

  const currentCollateralRatio = 171
  const minCollateralRatio = 150
  const maxMintable = 5000

  const calculateNewRatio = (amount: string, action: "mint" | "burn") => {
    if (!amount) return currentCollateralRatio
    const numAmount = Number.parseFloat(amount)
    if (action === "mint") {
      return Math.round(currentCollateralRatio - (numAmount / 1000) * 5)
    } else {
      return Math.round(currentCollateralRatio + (numAmount / 1000) * 5)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Stablecoin Minting</h2>
        <p className="text-muted-foreground">Mint or burn sUSD stablecoins against your collateral</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Mint/Burn sUSD</CardTitle>
              <CardDescription>Manage your stablecoin position</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mint" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mint">Mint sUSD</TabsTrigger>
                  <TabsTrigger value="burn">Burn sUSD</TabsTrigger>
                </TabsList>

                <TabsContent value="mint" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mint-amount">Amount to Mint</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mint-amount"
                        placeholder="0.00"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                      />
                      <Button variant="outline">sUSD</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum mintable: {maxMintable.toLocaleString()} sUSD
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setMintAmount("1250")}>
                      25%
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setMintAmount("2500")}>
                      50%
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setMintAmount("3750")}>
                      75%
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setMintAmount(maxMintable.toString())}>
                      Max
                    </Button>
                  </div>

                  {mintAmount && calculateNewRatio(mintAmount, "mint") < minCollateralRatio && (
                    <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        This transaction would put your position below the minimum collateral ratio of{" "}
                        {minCollateralRatio}%
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Mint Amount</span>
                      <span>{mintAmount || "0"} sUSD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Minting Fee (0.5%)</span>
                      <span>{mintAmount ? (Number.parseFloat(mintAmount) * 0.005).toFixed(2) : "0"} sUSD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>New Collateral Ratio</span>
                      <span
                        className={
                          calculateNewRatio(mintAmount, "mint") < minCollateralRatio ? "text-red-600" : "text-green-600"
                        }
                      >
                        {calculateNewRatio(mintAmount, "mint")}%
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!mintAmount || calculateNewRatio(mintAmount, "mint") < minCollateralRatio}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Mint sUSD
                  </Button>
                </TabsContent>

                <TabsContent value="burn" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="burn-amount">Amount to Burn</Label>
                    <div className="flex gap-2">
                      <Input
                        id="burn-amount"
                        placeholder="0.00"
                        value={burnAmount}
                        onChange={(e) => setBurnAmount(e.target.value)}
                      />
                      <Button variant="outline">sUSD</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Available to burn: 35,000 sUSD</p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Burn Benefits</span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Burning sUSD improves your collateral ratio and reduces liquidation risk
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Burn Amount</span>
                      <span>{burnAmount || "0"} sUSD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>New Collateral Ratio</span>
                      <span className="text-green-600">{calculateNewRatio(burnAmount, "burn")}%</span>
                    </div>
                  </div>

                  <Button className="w-full" disabled={!burnAmount}>
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Burn sUSD
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Position Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Collateral</span>
                  <span className="font-medium">$60,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Minted sUSD</span>
                  <span className="font-medium">35,000 sUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available to Mint</span>
                  <span className="font-medium text-green-600">{maxMintable.toLocaleString()} sUSD</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Ratio</span>
                  <Badge variant="secondary">{currentCollateralRatio}%</Badge>
                </div>
                <Progress value={(currentCollateralRatio - minCollateralRatio) / 2} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {currentCollateralRatio - minCollateralRatio}% above minimum
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>sUSD Token Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Price</span>
                  <span className="font-medium">$1.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>24h Change</span>
                  <span className="text-green-600">+0.02%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Supply</span>
                  <span className="font-medium">8.75M sUSD</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Balance</span>
                  <span className="font-medium">2,500 sUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Your Debt</span>
                  <span className="font-medium">35,000 sUSD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Minting Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Minted Today</span>
                  <span className="font-medium">125,000 sUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Burned Today</span>
                  <span className="font-medium">87,500 sUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Minted</span>
                  <span className="font-medium text-green-600">+37,500 sUSD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
