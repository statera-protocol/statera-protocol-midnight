import { BarChart3, Coins, Settings, TrendingUp, Wallet, Zap } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  userRole: "user" | "admin"
}

const menuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    id: "overview",
    roles: ["user", "admin"],
  },
  {
    title: "Collateral",
    icon: Wallet,
    id: "collateral",
    roles: ["user", "admin"],
  },
  {
    title: "Mint Stablecoin",
    icon: Coins,
    id: "mint",
    roles: ["user", "admin"],
  },
  {
    title: "Stake & Earn",
    icon: TrendingUp,
    id: "stake",
    roles: ["user", "admin"],
  },
  {
    title: "Admin Panel",
    icon: Settings,
    id: "admin",
    roles: ["admin"],
  },
]

export function AppSidebar({ activeSection, setActiveSection, userRole }: AppSidebarProps) {
  const filteredItems = menuItems.filter((item) => item.roles.includes(userRole))

  return (
    <Sidebar className="border-r border-slate-800/50 bg-slate-900/95 backdrop-blur-xl">
      <SidebarHeader className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Statera</h2>
            <p className="text-xs text-slate-400">DeFi Protocol</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full justify-start px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800/50">
        <div className="text-xs text-slate-500 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Protocol v1.0.0</span>
          </div>
          <p>Secured by blockchain</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
