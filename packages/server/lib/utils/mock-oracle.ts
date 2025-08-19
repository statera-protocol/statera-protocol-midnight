// ADA Oracle Mock Data Generator for DeFi Liquidation Testing

export interface OraclePrice {
  asset: string;
  price: number;
  timestamp: number;
  confidence: number;
  source: string;
  blockNumber: number;
  roundId: number;
}

export interface PriceUpdate {
  price: number;
  timestamp: number;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'sideways';
}

export enum MarketCondition {
  NORMAL = 'normal',
  VOLATILE = 'volatile',
  CRASH = 'crash',
  PUMP = 'pump',
  LIQUIDATION_CASCADE = 'liquidation_cascade'
}

export class TDUSTMockOracle {
  private currentPrice: number = 0.45; // Starting ADA price in USD
  private baseVolatility: number = 0.02; // 2% base volatility
  private blockNumber: number = 1000000;
  private roundId: number = 1;
  private priceHistory: PriceUpdate[] = [];
  
  constructor(initialPrice: number = 0.45) {
    this.currentPrice = initialPrice;
    this.initializePriceHistory();
  }

  /**
   * Initialize with some historical data
   */
  private initializePriceHistory(): void {
    const now = Date.now();
    for (let i = 100; i >= 0; i--) {
      const timestamp = now - (i * 60000); // 1 minute intervals
      const price = this.currentPrice * (1 + (Math.random() - 0.5) * 0.02);
      this.priceHistory.push({
        price,
        timestamp,
        volatility: this.baseVolatility,
        trend: 'sideways'
      });
    }
  }

  /**
   * Generate realistic price movement based on market conditions
   */
  private generatePriceMovement(condition: MarketCondition = MarketCondition.NORMAL): number {
    let volatility = this.baseVolatility;
    let drift = 0;

    switch (condition) {
      case MarketCondition.NORMAL:
        volatility = this.baseVolatility;
        drift = (Math.random() - 0.5) * 0.001; // Small random drift
        break;
      
      case MarketCondition.VOLATILE:
        volatility = this.baseVolatility * 3;
        drift = (Math.random() - 0.5) * 0.002;
        break;
      
      case MarketCondition.CRASH:
        volatility = this.baseVolatility * 5;
        drift = -0.02; // Strong downward pressure
        break;
      
      case MarketCondition.PUMP:
        volatility = this.baseVolatility * 2;
        drift = 0.015; // Strong upward pressure
        break;
      
      case MarketCondition.LIQUIDATION_CASCADE:
        volatility = this.baseVolatility * 8;
        drift = -0.05; // Extreme downward pressure
        break;
    }

    // Generate price change using geometric Brownian motion
    const randomComponent = (Math.random() - 0.5) * volatility;
    const priceChange = drift + randomComponent;
    
    return this.currentPrice * (1 + priceChange);
  }

  /**
   * Get current oracle price data
   */
  getCurrentPrice(): OraclePrice {
    return {
      asset: 'ADA',
      price: this.currentPrice,
      timestamp: Date.now(),
      confidence: 0.99, // 99% confidence
      source: 'MockOracle',
      blockNumber: this.blockNumber,
      roundId: this.roundId
    };
  }

  /**
   * Simulate price update - call this periodically
   */
  updatePrice(condition: MarketCondition = MarketCondition.NORMAL): OraclePrice {
    const newPrice = this.generatePriceMovement(condition);
    
    // Ensure price doesn't go negative
    this.currentPrice = Math.max(newPrice, 0.001);
    this.blockNumber++;
    this.roundId++;

    // Update history
    const priceUpdate: PriceUpdate = {
      price: this.currentPrice,
      timestamp: Date.now(),
      volatility: this.baseVolatility,
      trend: this.determineTrend()
    };
    
    this.priceHistory.push(priceUpdate);
    
    // Keep only last 1000 entries
    if (this.priceHistory.length > 1000) {
      this.priceHistory.shift();
    }

    return this.getCurrentPrice();
  }

  /**
   * Determine current trend based on recent price history
   */
  private determineTrend(): 'bullish' | 'bearish' | 'sideways' {
    if (this.priceHistory.length < 10) return 'sideways';
    
    const recent10 = this.priceHistory.slice(-10);
    const avgRecent = recent10.reduce((sum, p) => sum + p.price, 0) / 10;
    const previous10 = this.priceHistory.slice(-20, -10);
    const avgPrevious = previous10.reduce((sum, p) => sum + p.price, 0) / 10;
    
    const change = (avgRecent - avgPrevious) / avgPrevious;
    
    if (change > 0.02) return 'bullish';
    if (change < -0.02) return 'bearish';
    return 'sideways';
  }

  /**
   * Simulate multiple oracle sources with slight variations
   */
  getMultiSourcePrices(): OraclePrice[] {
    const basePrice = this.currentPrice;
    const timestamp = Date.now();
    
    return [
      {
        asset: 'ADA',
        price: basePrice,
        timestamp,
        confidence: 0.99,
        source: 'Chainlink',
        blockNumber: this.blockNumber,
        roundId: this.roundId
      },
      {
        asset: 'ADA',
        price: basePrice * (1 + (Math.random() - 0.5) * 0.002), // ±0.1% variation
        timestamp: timestamp - 1000,
        confidence: 0.98,
        source: 'Band Protocol',
        blockNumber: this.blockNumber - 1,
        roundId: this.roundId - 1
      },
      {
        asset: 'ADA',
        price: basePrice * (1 + (Math.random() - 0.5) * 0.0015), // ±0.075% variation
        timestamp: timestamp - 2000,
        confidence: 0.97,
        source: 'API3',
        blockNumber: this.blockNumber - 2,
        roundId: this.roundId - 2
      }
    ];
  }

  /**
   * Generate liquidation scenario data
   */
  generateLiquidationScenario(): {
    priceDrops: OraclePrice[];
    criticalLevels: number[];
  } {
    const currentPrice = this.currentPrice;
    const priceDrops: OraclePrice[] = [];
    const criticalLevels = [0.85, 0.80, 0.75, 0.70, 0.65]; // Common liquidation thresholds
    
    // Simulate 20% price drop over 10 updates
    for (let i = 1; i <= 10; i++) {
      const dropPercentage = (i / 10) * 0.20; // Gradual 20% drop
      const newPrice = currentPrice * (1 - dropPercentage);
      
      priceDrops.push({
        asset: 'ADA',
        price: newPrice,
        timestamp: Date.now() + (i * 60000), // 1 minute intervals
        confidence: 0.99,
        source: 'MockOracle',
        blockNumber: this.blockNumber + i,
        roundId: this.roundId + i
      });
    }
    
    return { priceDrops, criticalLevels };
  }

  /**
   * Get historical price data for backtesting
   */
  getPriceHistory(hours: number = 24): PriceUpdate[] {
    const hoursInMs = hours * 60 * 60 * 1000;
    const cutoffTime = Date.now() - hoursInMs;
    
    return this.priceHistory.filter(p => p.timestamp >= cutoffTime);
  }

  /**
   * Simulate oracle failure scenarios
   */
  simulateOracleFailure(): {
    stalePrices: OraclePrice[];
    invalidPrices: OraclePrice[];
    noConfidence: OraclePrice[];
  } {
    const timestamp = Date.now();
    
    return {
      stalePrices: [{
        asset: 'ADA',
        price: this.currentPrice,
        timestamp: timestamp - 3600000, // 1 hour old
        confidence: 0.99,
        source: 'StaleOracle',
        blockNumber: this.blockNumber - 300,
        roundId: this.roundId - 300
      }],
      
      invalidPrices: [{
        asset: 'ADA',
        price: -1, // Invalid negative price
        timestamp,
        confidence: 0.99,
        source: 'FaultyOracle',
        blockNumber: this.blockNumber,
        roundId: this.roundId
      }],
      
      noConfidence: [{
        asset: 'ADA',
        price: this.currentPrice,
        timestamp,
        confidence: 0.1, // Very low confidence
        source: 'UnreliableOracle',
        blockNumber: this.blockNumber,
        roundId: this.roundId
      }]
    };
  }

  /**
   * Generate test data for specific liquidation threshold testing
   */
  generateThresholdTestData(thresholds: number[]): Map<number, OraclePrice[]> {
    const testData = new Map<number, OraclePrice[]>();
    const basePrice = this.currentPrice;
    
    thresholds.forEach(threshold => {
      const prices: OraclePrice[] = [];
      
      // Generate prices around the threshold
      for (let i = -5; i <= 5; i++) {
        const priceMultiplier = threshold + (i * 0.01); // ±5% around threshold
        const price = basePrice * priceMultiplier;
        
        prices.push({
          asset: 'ADA',
          price: Math.max(price, 0.001), // Ensure positive price
          timestamp: Date.now() + (i * 60000),
          confidence: 0.99,
          source: 'ThresholdTestOracle',
          blockNumber: this.blockNumber + i,
          roundId: this.roundId + i
        });
      }
      
      testData.set(threshold, prices);
    });
    
    return testData;
  }

  /**
   * Reset oracle to initial state
   */
  reset(initialPrice: number = 0.45): void {
    this.currentPrice = initialPrice;
    this.blockNumber = 1000000;
    this.roundId = 1;
    this.priceHistory = [];
    this.initializePriceHistory();
  }
}

// Usage example and test scenarios
export class LiquidationTestScenarios {
  private oracle: TDUSTMockOracle;

  constructor() {
    this.oracle = new TDUSTMockOracle();
  }

  /**
   * Test scenario: Normal market conditions
   */
  async normalMarketTest(): Promise<OraclePrice[]> {
    const prices: OraclePrice[] = [];
    
    for (let i = 0; i < 100; i++) {
      const price = this.oracle.updatePrice(MarketCondition.NORMAL);
      prices.push(price);
      
      // Simulate 1-minute intervals
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return prices;
  }

  /**
   * Test scenario: Market crash triggering liquidations
   */
  crashScenario(): OraclePrice[] {
    const prices: OraclePrice[] = [];
    
    // Start with normal conditions
    for (let i = 0; i < 20; i++) {
      prices.push(this.oracle.updatePrice(MarketCondition.NORMAL));
    }
    
    // Sudden crash
    for (let i = 0; i < 30; i++) {
      prices.push(this.oracle.updatePrice(MarketCondition.CRASH));
    }
    
    // Recovery
    for (let i = 0; i < 20; i++) {
      prices.push(this.oracle.updatePrice(MarketCondition.VOLATILE));
    }
    
    return prices;
  }

  /**
   * Test scenario: Liquidation cascade
   */
  liquidationCascadeScenario(): OraclePrice[] {
    const prices: OraclePrice[] = [];
    
    // Gradual decline
    for (let i = 0; i < 50; i++) {
      prices.push(this.oracle.updatePrice(MarketCondition.VOLATILE));
    }
    
    // Liquidation cascade
    for (let i = 0; i < 20; i++) {
      prices.push(this.oracle.updatePrice(MarketCondition.LIQUIDATION_CASCADE));
    }
    
    return prices;
  }

  getOracle(): TDUSTMockOracle {
    return this.oracle;
  }
}

// Export for use in tests
export default TDUSTMockOracle;