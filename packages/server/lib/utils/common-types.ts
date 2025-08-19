import {
  Contract,
  Witnesses,
  StateraPrivateState,
} from "@statera/ada-statera-protocol";
import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

export const stateraPrivateStateId = "stateraPrivateState";
export type StateraPrivateStateId = typeof stateraPrivateStateId;
export type StateraContract = Contract<
  StateraPrivateState,
  Witnesses<StateraPrivateState>
>;
export type TokenCircuitKeys = Exclude<
  keyof StateraContract["impureCircuits"],
  number | symbol
>;
export type StateraContractProviders = MidnightProviders<
  TokenCircuitKeys,
  StateraPrivateStateId,
  StateraPrivateState
>;
export type DeployedStateraOnchainContract = FoundContract<StateraContract>;

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

export interface LiquidationPayload {
  id: Uint8Array;
  debt: bigint;
  collateral_amount: bigint;
}

