import TDUSTMockOracle from "../../lib/utils/statera-liquidation-api";

async function getOraclePrice() {
    const currentPrice = new TDUSTMockOracle()
    return currentPrice.getCurrentPrice();
}