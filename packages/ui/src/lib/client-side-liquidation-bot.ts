import type { MintMetadata } from "@statera/ada-statera-protocol";

export interface LiquidationPayload {
  id: Uint8Array;
  debt: bigint;
  collateral_amount: bigint;
}

interface LiquidationResponse {
  success: boolean;
  transactionHash?: string;
  message: string;
  error?: string;
}

export class ClientSideLiquidationBot {
  private readonly serverBotUrl: string;
  private isMonitoring: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private position: MintMetadata;

  constructor(
    protected server_bot_url: string,
    readonly mint_metadata: MintMetadata,
    private readonly liquidationThreshold: number,
    private readonly encodedPk: Uint8Array
  ) {
    this.serverBotUrl = server_bot_url;
    this.position = mint_metadata;
  }

  static async getPriceFeed(): Promise<number | null> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd"
      );
      const feed = await response.json();
      return feed.cardano.usd;
    } catch (error) {
      console.error("Failed to fetch price feed");
      return null;
    }
  }

  calculateHFactor(oraclePrice: number): number {
    const currentAssetPrice =
      Number(this.position.collateral) * oraclePrice;
    const hFactor =
      (currentAssetPrice * this.liquidationThreshold) /
      (Number(this.position.debt) * 100);
    return hFactor; // Placeholder return value
  }

  async requestLiquidation(): Promise<LiquidationResponse | null> {
    try {
      //Call the serverside liquidation bot
      const payload: LiquidationPayload = {
        id: this.encodedPk,
        collateral_amount: this.position.collateral,
        debt: this.position.debt,
      };

      const response = await fetch(this.serverBotUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result: LiquidationResponse = await response.json();
        console.log("✅ Server response:", result);
        return result;
      } else {
        console.error("❌ Server error:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Failed to request liquidation");
      return null;
    }
  }

  async checkLiquidationStatus() {
    try {
      const currentOraclePrice = await ClientSideLiquidationBot.getPriceFeed();

      const healthFactor = this.calculateHFactor(currentOraclePrice as number);
      if (healthFactor < 1.0) {
        console.log("🚨 LIQUIDATION NEEDED!");
        await this.requestLiquidation();
        this.stopMonitoring(); // Stop after liquidation request
      } else if (healthFactor < 1.2) {
        console.log("⚠️ Position risky");
      } else {
        console.log("✅ Safe");
      }
    } catch (error) {}
  }

  // Start monitoring
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log("Already monitoring...");
      return;
    }

    console.log("🚀 Starting client-side liquidation monitor");
    console.log(`💎 Collateral: ${this.position.collateral} tDUST`);
    console.log(`💰 Debt: $${this.position.debt}`);

    this.isMonitoring = true;

    // Check immediately
    this.checkLiquidationStatus();

    // Then check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkLiquidationStatus();
    }, 30000);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log("🛑 Stopping monitor");
    this.isMonitoring = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}


export default ClientSideLiquidationBot;