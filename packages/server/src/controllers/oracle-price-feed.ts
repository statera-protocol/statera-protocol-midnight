import TDUSTMockOracle from "../../lib/utils/mock-oracle";

async function getOraclePrice() {
    const currentPrice = new TDUSTMockOracle()
    return currentPrice.getCurrentPrice();
}