import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Shield, AlertTriangle, Users, DollarSign, Activity, Lock, Unlock } from "lucide-react"

export function AdminPanel() {
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [mintingPaused, setMintingPaused] = useState(false)
  const [newCollateralRatio, setNewCollateralRatio] = useState("")

  const systemMetrics = [
    { label: "Total Users", value: "1,247", change: "+12%" },
    { label: "Active Positions", value: "892", change: "+8%" },
    { label: "Liquidations (24h)", value: "23", change: "-15%" },
    { label: "Protocol Revenue", value: "$45,230", change: "+22%" },
  ]

  const recentActions = [
    { action: "Collateral ratio updated", user: "Admin", time: "2 hours ago" },
    { action: "Emergency mode disabled", user: "Admin", time: "1 day ago" },
    { action: "New collateral type added", user: "Admin", time: "3 days ago" },
    { action: "Fee structure updated", user: "Admin", time: "1 week ago" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
        <p className="text-muted-foreground">Manage protocol settings and monitor system health</p>
      </div>

      {emergencyMode && (
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Emergency mode is active. All user operations are paused.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, index) => (
          <Card
            key={index}
            className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{metric.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Protocol Controls</CardTitle>
              <CardDescription>Manage critical protocol parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="emergency" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  <TabsTrigger value="fees">Fees</TabsTrigger>
                </TabsList>

                <TabsContent value="emergency" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Emergency Mode</Label>
                        <p className="text-sm text-muted-foreground">Pause all protocol operations</p>
                      </div>
                      <Switch checked={emergencyMode} onCheckedChange={setEmergencyMode} />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Pause Minting</Label>
                        <p className="text-sm text-muted-foreground">Temporarily disable new minting</p>
                      </div>
                      <Switch checked={mintingPaused} onCheckedChange={setMintingPaused} />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Emergency Actions</Label>
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm">
                          <Lock className="w-4 h-4 mr-2" />
                          Lock All Positions
                        </Button>
                        <Button variant="outline" size="sm">
                          <Unlock className="w-4 h-4 mr-2" />
                          Force Liquidations
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="parameters" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="collateral-ratio">Minimum Collateral Ratio (%)</Label>
                      <Input
                        id="collateral-ratio"
                        placeholder="150"
                        value={newCollateralRatio}
                        onChange={(e) => setNewCollateralRatio(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Current: 150%</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Liquidation Threshold</Label>
                      <Input placeholder="120" />
                      <p className="text-xs text-muted-foreground">Current: 120%</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Maximum Debt Ceiling</Label>
                      <Input placeholder="10000000" />
                      <p className="text-xs text-muted-foreground">Current: $10,000,000</p>
                    </div>

                    <Button>
                      <Settings className="w-4 h-4 mr-2" />
                      Update Parameters
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="fees" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Minting Fee (%)</Label>
                      <Input placeholder="0.5" />
                      <p className="text-xs text-muted-foreground">Current: 0.5%</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Liquidation Fee (%)</Label>
                      <Input placeholder="5" />
                      <p className="text-xs text-muted-foreground">Current: 5%</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Staking Reward Rate (%)</Label>
                      <Input placeholder="12.5" />
                      <p className="text-xs text-muted-foreground">Current: 12.5% APY</p>
                    </div>

                    <Button>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Update Fee Structure
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Protocol Health</span>
                  <Badge variant="secondary" className="text-green-600">
                    Healthy
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Oracle Status</span>
                  <Badge variant="secondary" className="text-green-600">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Liquidation Engine</span>
                  <Badge variant="secondary" className="text-green-600">
                    Running
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Emergency Mode</span>
                  <Badge variant={emergencyMode ? "destructive" : "secondary"}>
                    {emergencyMode ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{action.action}</p>
                      <p className="text-xs text-muted-foreground">{action.user}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Positions at Risk</span>
                <span className="font-medium text-yellow-600">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg. Collateral Ratio</span>
                <span className="font-medium">168%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bad Debt Coverage</span>
                <span className="font-medium text-green-600">1,960%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
