import { DebtPositionStatus, Position } from "../../lib/common-type";

export enum LiquidationStatus {
  liquidated = 0,
  healthy = 1,
  inactive = 0,
}

async function getLiqudationStatus(
  position: Position,
  currentOraclePrice: number,
  onchain_liquidation_threshold: number
): Promise<LiquidationStatus> {
  if (position.position != DebtPositionStatus.active) {
    return LiquidationStatus.inactive;
  }

  const currentAssetPrice = position.collateral * currentOraclePrice;

  const liquidationThreshold =
    (currentAssetPrice * onchain_liquidation_threshold) / (position.debt * 100);

  return liquidationThreshold <= 1
    ? LiquidationStatus.liquidated
    : LiquidationStatus.healthy;
}


async function liquidate() {
    
}