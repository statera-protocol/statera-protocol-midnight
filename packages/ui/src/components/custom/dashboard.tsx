import { useState } from "react";
import { Overview } from "./overview";
import { CollateralManager } from "./collateral-manager";
import { MintingInterface } from "./minting-interface";
import { StakingInterface } from "./staking-interface";
import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { Toaster } from "react-hot-toast";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return <Overview />;
      case "collateral":
        return <CollateralManager />;
      case "mint":
        return <MintingInterface />;
      case "stake":
        return <StakingInterface />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 p-6">{renderActiveSection()}</main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
};

export default Dashboard;
