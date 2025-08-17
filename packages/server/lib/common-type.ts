export enum DebtPositionStatus {
  inactive = 0,
  active = 1,
  closed = 2,
}


export interface Position {
  id: string;
  metadataHash: string;
  hFactor: number;
  position: DebtPositionStatus;
  coinType: string;
  borrowLimit: number;
  collateral: number;
  debt: number;
}

