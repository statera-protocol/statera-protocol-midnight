import { Toaster } from "react-hot-toast";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/custom/app-sidebar";
import { DashboardHeader } from "./components/custom/dashboard-header";
import { Overview } from "./components/custom/overview";
import { CollateralManager } from "./components/custom/collateral-manager";
import { MintingInterface } from "./components/custom/minting-interface";
import { StakingInterface } from "./components/custom/staking-interface";
import { AdminPanel } from "./components/custom/admin-panel";
import { useState } from "react";

function App() {
   const [activeSection, setActiveSection] = useState("overview")
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [userRole, setUserRole] = useState<"user" | "admin">("user")

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return <Overview />
      case "collateral":
        return <CollateralManager />
      case "mint":
        return <MintingInterface />
      case "stake":
        return <StakingInterface />
      case "admin":
        return userRole === "admin" ? <AdminPanel /> : <Overview />
      default:
        return <Overview />
    }
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar activeSection={activeSection} setActiveSection={setActiveSection} userRole={userRole} />
          <div className="flex-1 flex flex-col">
            <DashboardHeader
              isWalletConnected={isWalletConnected}
              setIsWalletConnected={setIsWalletConnected}
              userRole={userRole}
              setUserRole={setUserRole}
            />
            <main className="flex-1 p-6">{renderActiveSection()}</main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}

export default App;
