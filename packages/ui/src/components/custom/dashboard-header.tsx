"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Wallet, ChevronDown, User, Settings, Activity, Bell } from "lucide-react"

interface DashboardHeaderProps {
  isWalletConnected: boolean
  setIsWalletConnected: (connected: boolean) => void
  userRole: "user" | "admin"
  setUserRole: (role: "user" | "admin") => void
}

export function DashboardHeader({
  isWalletConnected,
  setIsWalletConnected,
  userRole,
  setUserRole,
}: DashboardHeaderProps) {
  const mockAddress = "0x1234...5678"

  return (
    <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-slate-300 hover:text-white" />
          <div>
            <h1 className="text-xl font-semibold text-white">Statera Dashboard</h1>
            <p className="text-sm text-slate-400">Manage your stablecoin positions</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-300">Network: Midnight</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Badge
            variant={userRole === "admin" ? "default" : "secondary"}
            className={
              userRole === "admin"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                : "bg-slate-700 text-slate-300"
            }
          >
            {userRole === "admin" ? "Admin" : "User"}
          </Badge>

          {isWalletConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0">
                  <Wallet className="w-4 h-4" />
                  {mockAddress}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem
                  onClick={() => setUserRole(userRole === "admin" ? "user" : "admin")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Switch to {userRole === "admin" ? "User" : "Admin"}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsWalletConnected(false)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setIsWalletConnected(true)}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
