import {
  Contract,
  Witnesses,
  StateraPrivateState,
  Depositor,
  Staker,
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
export type DerivedStateraContractState = {
  readonly mintCounter: bigint;
  readonly totalMint: bigint;
  readonly admin: Uint8Array;
  readonly nonce: Uint8Array;
  readonly sUSDTokenType: Uint8Array;
  readonly stakePoolTotal: bigint;
  readonly reservePoolTotal: bigint;
  readonly liquidationThreshold: bigint;
  readonly collateralDepositors: DerivedDepositor[];
  readonly stakers: DerivedStaker[];
  readonly validAssetCoinType: Uint8Array;
  readonly noOfDepositors: bigint;
};

export type DerivedDepositor = {
  id: string,
  depositor: Depositor
}

export type DerivedStaker = {
  id: string,
  staker: Staker
}