import { useCallback, useState } from "react";
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
  Loader2,
} from "lucide-react";
import useDeployment from "@/hookes/useDeployment";
import toast from "react-hot-toast";
import useMidnightWallet from "@/hookes/useMidnightWallet";
import { decodeCoinPublicKey } from "@midnight-ntwrk/compact-runtime";
import { parseCoinPublicKeyToHex } from "@midnight-ntwrk/midnight-js-utils";
import { getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { DebtPositionStatus } from "@statera/ada-statera-protocol";

export function CollateralManager() {
  const [depositAmount, setDepositAmount] = useState("");
  const deploymentCTX = useDeployment();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const walletContext = useMidnightWallet();
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

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

  const depositPosition = useCallback(() => {
    if (
      !deploymentCTX?.privateState ||
      !deploymentCTX?.contractState?.collateralDepositors
    )
      return;
    const walletAddressHex = parseCoinPublicKeyToHex(
      walletContext?.state.coinPublicKey as string,
      getZswapNetworkId()
    );
    const vault = deploymentCTX.contractState.collateralDepositors.find(
      (vault) => decodeCoinPublicKey(vault.id) == walletAddressHex
    );
    console.log("vault", vault);
    if (!vault) return;
    return vault;
  }, [
    deploymentCTX?.privateState,
    walletContext?.state,
    deploymentCTX?.contractState?.collateralDepositors,
  ])();

  const handleCreateOrWithdrawFromPosition = async (
    amount: number,
    action: "deposit" | "withdraw",
    orace_price?: number
  ) => {
    action == "deposit" ? setIsDepositing(true) : setIsWithdrawing(true);
    try {
      if (!walletContext) return;
      const tx =
        action == "deposit"
          ? await deploymentCTX?.stateraApi?.depositToCollateralPool(
              Math.round(amount)
            )
          : await deploymentCTX?.stateraApi?.withdrawCollateral(
              amount,
              orace_price as number
            );
      action == "deposit" ? setIsDepositing(false) : setIsWithdrawing(false);

      if (tx?.public.status === "SucceedEntirely") {
        toast.success("Created vault successfully");
      } else {
        toast.error("Failed to create vault");
      }
    } catch (error) {
      toast.error("Failed to create vault");
    } finally {
      action == "deposit" ? setIsDepositing(false) : setIsWithdrawing(false);
    }
  };

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
                    <div className="space-y-2">
                      <Label
                        htmlFor="deposit-amount"
                        className="text-slate-300"
                      >
                        Amount to Deposit
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          name="deposit-amount"
                          id="deposit-amount"
                          placeholder="0.00"
                          value={depositAmount}
                          step={1}
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
                      <p className="text-xs text-slate-400">
                        Approx. deposit: {depositAmount || 0} tDUST ($
                        {Math.round(Number(depositAmount))})
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("1")}
                        className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("5")}
                        className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("7")}
                        className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount("10")}
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
                                Number.parseFloat(depositAmount) * 20
                              ).toLocaleString()
                            : "0"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                          New Health Factor
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
                      onClick={() =>
                        handleCreateOrWithdrawFromPosition(
                          Number(depositAmount),
                          "deposit"
                        )
                      }
                    >
                      {isDepositing ? (
                        <div className="flex gap-2 items-center">
                          <Loader2 className="text-white animate-spin w-5 h-5" />
                          <span>Depositing....</span>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <ArrowDownCircle className="w-4 h-4 mr-2" />
                          <span>Deposit Collateral</span>
                        </div>
                      )}
                    </Button>
                  </div>
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
                      Available to withdraw:{" "}
                      {deploymentCTX?.privateState?.mint_metadata.collateral}{" "}
                      tDUST (~$
                      {deploymentCTX?.privateState?.mint_metadata.collateral})
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
                    onClick={() =>
                      handleCreateOrWithdrawFromPosition(
                        parseInt(withdrawAmount),
                        "withdraw",
                        1
                      )
                    }
                  >
                    {isWithdrawing ? (
                      <div className="flex gap-2 items-center">
                        <Loader2 className="text-white animate-spin w-5 h-5" />
                        <span>Withdrawing....</span>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        <span>Withdraw Collateral</span>
                      </div>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {depositPosition ? (
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                    Your Position
                  </div>
                  <Badge variant="secondary">{depositPosition.depositor.position == DebtPositionStatus.inactive ? "Inactive" : (depositPosition.depositor.position == DebtPositionStatus.active ? "Active" : "Closed")}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Total Collateral</span>
                    <span className="font-medium text-white">
                      {deploymentCTX?.privateState?.mint_metadata.collateral}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Minted Stablecoins</span>
                    <span className="font-medium text-white">
                      {deploymentCTX?.privateState?.mint_metadata.debt} SUSD
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Borrow Limit</span>
                    <Badge className="bg-green-900/30 text-green-400 border-green-500/30">
                      {depositPosition.depositor.borrowLimit}
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-slate-700/50" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Health Factor</span>
                    <span className="text-green-400 font-medium">
                      {depositPosition.depositor.hFactor}
                    </span>
                  </div>
                  <Progress value={85} className="h-2 bg-slate-700" />
                  <p className="text-xs text-green-400">
                    ✓ Healthy - Well above liquidation threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Liquidation Price</span>
                    <span className="text-red-400">
                      $
                      {(Number(
                        deploymentCTX?.privateState?.mint_metadata.collateral
                      ) *
                        Number(
                          deploymentCTX?.contractState?.liquidationThreshold
                        )) /
                        100}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Current Price</span>
                    <span className="text-green-400">
                      ${deploymentCTX?.privateState?.mint_metadata.collateral}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="w-full border-slate-700/50 rounded-lg border items-center gap-2 flex flex-col py-20 text-center">
              <h1 className="text-slate-300 text-2xl font-semibold">
                You have no vaults available
              </h1>
              <p className="text-sm text-slate-400">
                Create a deposit position to be able to mint SUSD
              </p>
              <Wallet size={40} className="fill-blue-600" />
            </div>
          )}

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
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
