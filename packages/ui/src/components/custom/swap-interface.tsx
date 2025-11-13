import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowDownUp, Settings, Info, TrendingUp, Zap, CheckCircle } from "lucide-react"

export function SwapInterface() {
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [fromToken, setFromToken] = useState("tDUST")
  const [toToken, setToToken] = useState("sUSD")
  const [slippage, setSlippage] = useState("0.5")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const tokens = [
    { symbol: "USDT", name: "Tether USD", balance: "12.5", icon: "T", color: "from-purple-500 to-blue-500" },
    { symbol: "USDC", name: "USD Coin", balance: "5,000", icon: "$", color: "from-green-500 to-emerald-500" },
    { symbol: "DAI", name: "Dai Stablecoin", balance: "0.75", icon: "◆", color: "from-orange-500 to-yellow-500" },
    { symbol: "sUSD", name: "Stater USD", balance: "35,000", icon: "$", color: "from-cyan-500 to-blue-500" },
    { symbol: "TDUST", name: "Dust Coin", balance: "2,500", icon: "₿", color: "from-yellow-500 to-orange-500" },
  ]

  const fromTokenData = tokens.find((t) => t.symbol === fromToken)
  const toTokenData = tokens.find((t) => t.symbol === toToken)

  const handleSwap = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    // Reset form or show success
  }

  const handleReverseTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount("")
    setToAmount("")
  }

  const handleMaxClick = () => {
    if (fromTokenData) {
      setFromAmount(fromTokenData.balance)
    }
  }

  const calculateToAmount = () => {
    if (!fromAmount || !fromTokenData || !toTokenData) return "0"
    // Mock calculation
    const baseRate = 1;
    return (Number.parseFloat(fromAmount) * baseRate).toFixed(4)
  }

  const priceImpact = fromAmount
    ? ((Number.parseFloat(fromAmount) * 0.005) / Number.parseFloat(fromAmount || "1")).toFixed(2)
    : "0"
  const estimatedFee = fromAmount ? (Number.parseFloat(fromAmount) * 0.003).toFixed(6) : "0"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Token Swap</h2>
        <p className="text-slate-400">Swap between supported tokens at the best rates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-white">Swap Tokens</CardTitle>
                <CardDescription className="text-slate-400">Exchange tokens instantly</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-slate-800 border-slate-700 w-56"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Slippage Tolerance</Label>
                      <div className="flex gap-2">
                        {["0.1", "0.5", "1"].map((value) => (
                          <Button
                            key={value}
                            size="sm"
                            variant={slippage === value ? "default" : "outline"}
                            onClick={() => setSlippage(value)}
                            className={
                              slippage === value
                                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0"
                                : "bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white"
                            }
                          >
                            {value}%
                          </Button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        placeholder="Custom"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <Separator className="bg-slate-700/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Expert Mode</span>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                        onChange={() => setShowAdvanced(!showAdvanced)}
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Token */}
              <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">You Send</Label>
                  {fromTokenData && <span className="text-xs text-slate-400">Balance: {fromTokenData.balance}</span>}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 text-lg"
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 gap-2 shadow-lg shadow-cyan-500/25">
                        <span className="text-lg">{fromTokenData?.icon}</span>
                        <span>{fromToken}</span>
                        <span className="text-xs">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      {tokens
                        .filter((t) => t.symbol !== toToken)
                        .map((token) => (
                          <DropdownMenuItem
                            key={token.symbol}
                            disabled={token.symbol != "TDUST"}
                            onClick={() => setFromToken(token.symbol)}
                            className={`text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer gap-2 ${token.symbol != "TDUST" ? "opacity-75" : ""}`}
                          >
                            <span className="text-lg">{token.icon}</span>
                            <div>
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-xs text-slate-400">{token.name}</div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMaxClick}
                  className="w-full bg-slate-700/30 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50"
                >
                  Max
                </Button>
              </div>

              {/* Swap Button */}
              <div className="relative flex justify-center -my-2 z-10">
                <Button
                  onClick={handleReverseTokens}
                  size="icon"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-4 border-slate-900 shadow-lg shadow-cyan-500/25 rounded-full"
                >
                  <ArrowDownUp className="w-4 h-4" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">You Receive</Label>
                  {toTokenData && <span className="text-xs text-slate-400">Balance: {toTokenData.balance}</span>}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={calculateToAmount()}
                    readOnly
                    className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 text-lg"
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 gap-2 shadow-lg shadow-cyan-500/25">
                        <span className="text-lg">{toTokenData?.icon}</span>
                        <span>{toToken}</span>
                        <span className="text-xs">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      {tokens
                        .filter((t) => t.symbol !== fromToken)
                        .map((token) => (
                          <DropdownMenuItem
                            key={token.symbol}
                            disabled={token.symbol != "sUSD"}
                            onClick={() => setToToken(token.symbol)}
                            className={`text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer gap-2 ${token.symbol != "sUSD" ? "opacity-75" : ""}`}
                          >
                            <span className="text-lg">{token.icon}</span>
                            <div>
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-xs text-slate-400">{token.name}</div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-slate-400 text-right">
                  1 {fromToken} ≈ 1 {toToken}
                </div>
              </div>

              {/* Swap Button */}
              <Button
                onClick={handleSwap}
                disabled={isLoading || !fromAmount}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25 h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Swap
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Swap Details */}
        <div className="space-y-6">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Swap Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Exchange Rate</span>
                  <span className="text-white font-medium">
                    1 {fromToken} = 1 {toToken}
                  </span>
                </div>

                <Separator className="bg-slate-700/50" />

                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Network Fee</span>
                  <span className="text-white font-medium">${estimatedFee}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Price Impact</span>
                  <span
                    className={`font-medium ${Number.parseFloat(priceImpact) > 5 ? "text-red-400" : "text-green-400"}`}
                  >
                    {priceImpact}%
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Slippage Tolerance</span>
                  <span className="text-white font-medium">{slippage}%</span>
                </div>

                <Separator className="bg-slate-700/50" />

                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Min. Received</span>
                  <span className="text-green-400 font-medium">
                    {fromAmount
                      ? (Number.parseFloat(fromAmount) * 1.5 * (1 - Number.parseFloat(slippage) / 100)).toFixed(4)
                      : "0"}{" "}
                    {toToken}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Price Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-slate-700/30 rounded-lg border border-slate-700/50 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-sm text-slate-400">24h Price Change</div>
                  <div className="text-2xl font-bold text-green-400">+2.45%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Quick Swap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { pair: "ETH → USC", rate: "1.5", popular: true },
                { pair: "USDC → ETH", rate: "0.67", popular: true },
                { pair: "WBTC → USC", rate: "42.5", popular: false },
              ].map((swap, index) => (
                <button
                  key={index}
                  className="w-full p-3 text-left rounded-lg bg-slate-700/30 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{swap.pair}</p>
                      <p className="text-xs text-slate-400">Rate: {swap.rate}</p>
                    </div>
                    {swap.popular && (
                      <Badge className="text-xs bg-cyan-900/30 text-cyan-400 border-cyan-500/30">Popular</Badge>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Alert className="bg-green-900/20 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              Best rates guaranteed with our advanced routing algorithm
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
