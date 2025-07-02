import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Coins, Shield, AlertTriangle, Activity } from "lucide-react"

export function Overview() {
  const stats = [
    {
      title: "Total Value Locked",
      value: "$12,450,000",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      highlight: true,
    },
    {
      title: "Stablecoins Minted",
      value: "8,750,000 USC",
      change: "+8.2%",
      trend: "up",
      icon: Coins,
    },
    {
      title: "Collateral Ratio",
      value: "165%",
      change: "-2.1%",
      trend: "down",
      icon: Shield,
    },
    {
      title: "Bad Debt",
      value: "$125,000",
      change: "-15.3%",
      trend: "up",
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Protocol Overview</h2>
        <p className="text-slate-400">Monitor key metrics and system health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`relative overflow-hidden backdrop-blur-xl border ${
              stat.highlight
                ? "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                : "bg-slate-800/50 border-slate-700/50"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.highlight ? "text-cyan-400" : "text-slate-400"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={stat.trend === "up" ? "text-green-400" : "text-red-400"}>{stat.change}</span>
                <span className="text-slate-500">from last month</span>
              </div>
            </CardContent>
            {stat.highlight && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 pointer-events-none" />
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              System Health
            </CardTitle>
            <CardDescription className="text-slate-400">Current protocol status and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Collateralization Ratio</span>
                <span className="text-white font-medium">165%</span>
              </div>
              <Progress value={82} className="h-2 bg-slate-700" />
              <p className="text-xs text-green-400">✓ Healthy - Above minimum threshold</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Liquidation Buffer</span>
                <span className="text-white font-medium">15%</span>
              </div>
              <Progress value={75} className="h-2 bg-slate-700" />
              <p className="text-xs text-yellow-400">⚠ Good - Sufficient buffer maintained</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Staking Pool Coverage</span>
                <span className="text-white font-medium">98.5%</span>
              </div>
              <Progress value={98} className="h-2 bg-slate-700" />
              <p className="text-xs text-green-400">✓ Excellent - Bad debt well covered</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">Latest protocol transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "Collateral Deposited",
                  amount: "1,500 ETH",
                  user: "0x1234...5678",
                  time: "2 min ago",
                  type: "deposit",
                },
                {
                  action: "Stablecoin Minted",
                  amount: "250,000 USC",
                  user: "0x8765...4321",
                  time: "5 min ago",
                  type: "mint",
                },
                {
                  action: "Stake Deposited",
                  amount: "50,000 USC",
                  user: "0x9876...1234",
                  time: "8 min ago",
                  type: "stake",
                },
                {
                  action: "Liquidation",
                  amount: "75,000 USC",
                  user: "0x5432...8765",
                  time: "12 min ago",
                  type: "liquidation",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "deposit"
                          ? "bg-green-400"
                          : activity.type === "mint"
                            ? "bg-blue-400"
                            : activity.type === "stake"
                              ? "bg-purple-400"
                              : "bg-red-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{activity.action}</p>
                      <p className="text-xs text-slate-400">{activity.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{activity.amount}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
