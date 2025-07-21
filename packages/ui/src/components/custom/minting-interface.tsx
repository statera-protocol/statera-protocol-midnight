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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Coins,
  ArrowRightLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import useDeployment from "@/hookes/useDeployment";
import toast from "react-hot-toast";
import { decodeCoinPublicKey } from "@midnight-ntwrk/compact-runtime";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import { parseCoinPublicKeyToHex } from "@midnight-ntwrk/midnight-js-utils";
import { getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

export function MintingInterface() {
  const [mintAmount, setMintAmount] = useState("");
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [isRepaying, setIsRepaying] = useState<boolean>(false);
  const deploymentCTX = useDeployment();
  const wallet = useMidnightWallet();
  const mintPosition =
    wallet &&
    deploymentCTX?.contractState?.collateralDepositors.find(
      (vault) =>
        decodeCoinPublicKey(vault.id) ==
        parseCoinPublicKeyToHex(
          wallet?.state.coinPublicKey as string,
          getZswapNetworkId()
        )
    );

  const minHFator = 1;

  const calculateHealthFactor = (amount: string, action: "mint" | "repay") => {
    if (!amount) return mintPosition?.depositor.hFactor;
    const numAmount = Number.parseFloat(amount);
    if (action === "mint") {
      return Math.round(
        (Number(deploymentCTX?.privateState?.mint_metadata.collateral) *
          Number(deploymentCTX?.contractState?.liquidationThreshold)) /
          (numAmount * 100)
      );
    } else {
      const balance =
        Number(deploymentCTX?.privateState?.mint_metadata.debt) -
        parseInt(amount);
      return Math.round(
        (Number(deploymentCTX?.privateState?.mint_metadata.collateral) *
          Number(deploymentCTX?.contractState?.liquidationThreshold)) /
          (balance * 100)
      );
    }
  };

  const handleMintOrRepaySUSD = async (
    amount: number,
    action: "mint" | "repay"
  ) => {
    action == "mint" ? setIsMinting(true) : setIsRepaying(true);
    try {
      if (action == "mint" && amount > Number(mintPosition?.depositor.borrowLimit)) {
        // handle case where amount is greater than debt
        toast.error("Mint greater than borrow limit is not allowed");
        return;
      }

      const result =
        action == "mint"
          ? await deploymentCTX?.stateraApi?.mint_sUSD(amount)
          : await deploymentCTX?.stateraApi?.repay(amount);
      action == "mint" ? setIsMinting(false) : setIsRepaying(false);
      if (result?.public.status === "SucceedEntirely") {
        toast.success(action == "mint" ? `Minted ${amount} sUSD successfully` : `Repayment successful`);
      } else {
        toast.error("Failed to Mint sUSD. Try again");
      }
    } catch (error) {
      setIsMinting(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not send mint request: Check your internet connection";
      toast.error(errorMessage);
    } finally {
      action == "mint" ? setIsMinting(false) : setIsRepaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Stablecoin Minting</h2>
        <p className="text-muted-foreground">
          Mint or repay sUSD stablecoins against your collateral
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle>Mint/Repay sUSD</CardTitle>
              <CardDescription>Manage your stablecoin position</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="mint" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                  <TabsTrigger value="mint" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">Mint sUSD</TabsTrigger>
                  <TabsTrigger value="repay" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">Repay sUSD</TabsTrigger>
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
                      Maximum mintable: {mintPosition?.depositor.borrowLimit}{" "}
                      sUSD
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMintAmount(
                          String(
                            0.25 * Number(mintPosition?.depositor.borrowLimit)
                          )
                        )
                      }
                    >
                      25%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMintAmount(
                          String(
                            0.5 * Number(mintPosition?.depositor.borrowLimit)
                          )
                        )
                      }
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMintAmount(
                          String(
                            0.75 * Number(mintPosition?.depositor.borrowLimit)
                          )
                        )
                      }
                    >
                      75%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMintAmount(
                          String(mintPosition?.depositor.borrowLimit as bigint)
                        )
                      }
                    >
                      Max
                    </Button>
                  </div>

                  {mintAmount &&
                    (calculateHealthFactor(mintAmount, "mint") as number) <
                      minHFator && (
                      <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                          This transaction would put your position below the
                          minimum health factor {minHFator}
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
                      <span>Minting Fee (0.0%)</span>
                      <span>
                        {mintAmount
                          ? (Number.parseFloat(mintAmount) * 0.0).toFixed(2)
                          : "0"}{" "}
                        sUSD
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>New Health Factor</span>
                      <span
                        className={
                          (calculateHealthFactor(
                            mintAmount <= "0" ? "1" : mintAmount,
                            "mint"
                          ) as number) < minHFator
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {calculateHealthFactor(mintAmount, "mint")}%
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
                    disabled={
                      !mintAmount ||
                      (calculateHealthFactor(mintAmount, "mint") as number) <
                        minHFator
                    }
                    onClick={() =>
                      handleMintOrRepaySUSD(parseInt(mintAmount), "mint")
                    }
                  >
                    {isMinting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 animate-spin h-5 mr-2" />
                        Minting sUSD...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 mr-2" />
                        Mint sUSD
                      </div>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="repay" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="repay-amount">Amount to Repay</Label>
                    <div className="flex gap-2">
                      <Input
                        id="repay-amount"
                        placeholder="0.00"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                      />
                      <Button variant="outline">sUSD</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Loan to repay: $
                      {deploymentCTX?.privateState?.mint_metadata.debt || 0}{" "}
                      sUSD
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Repay Benefits
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Repaying sUSD improves your collateral ratio and reduces
                      liquidation risk
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Repay Amount</span>
                      <span>{repayAmount || "0"} sUSD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>New Health Factor</span>
                      <span className="text-green-600">
                        {calculateHealthFactor(repayAmount, "repay")}%
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
                    disabled={!repayAmount}
                    onClick={() =>
                      handleMintOrRepaySUSD(parseInt(repayAmount), "repay")
                    }
                  >
                    {isRepaying ? (
                      <div className="flex gap-2 items-center">
                        <Loader2 className="w-5 animate-spin h-5 mr-2" />
                        Repaying debt...
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Repay sUSD
                      </div>
                    )}
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
                  <span className="font-medium">
                    ${deploymentCTX?.privateState?.mint_metadata.collateral}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Minted sUSD</span>
                  <span className="font-medium">
                    {deploymentCTX?.privateState?.mint_metadata.debt} sUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available to Mint</span>
                  <span className="font-medium text-green-600">
                    {mintPosition?.depositor.borrowLimit} sUSD
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Ratio</span>
                  <Badge variant="secondary">
                    {mintPosition?.depositor.hFactor}%
                  </Badge>
                </div>
                <Progress
                  value={
                    (Number(mintPosition?.depositor.hFactor) - minHFator) / 2
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {Number(mintPosition?.depositor.hFactor) - minHFator}% above
                  minimum
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
                  <span className="font-medium">
                    {deploymentCTX?.privateState?.mint_metadata.debt} sUSD
                  </span>
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
                  <span className="font-medium">
                    {deploymentCTX?.contractState?.totalMint} sUSD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Repayed Today</span>
                  <span className="font-medium">87,500 sUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Minted</span>
                  <span className="font-medium text-green-600">
                    +{deploymentCTX?.contractState?.totalMint} sUSD
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
