import { Ledger } from "./managed/adaStateraProtocol/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export interface StateraPrivateState {
  readonly mintMetadata: {
    collateral: bigint;
    amountToMint: bigint;
  };
  readonly secreteKey: Uint8Array;
  readonly divisionOutPut: [bigint, bigint]
}

export function divisionFn(
  dividend: number,
  divisor: number
): [bigint, bigint] {
  const quotient = BigInt(dividend / divisor);
  const reminder = BigInt(dividend % divisor);

  return [quotient, reminder];
}

export const witness = {
  division: ({
    privateState,
  }: WitnessContext<Ledger, StateraPrivateState>): [StateraPrivateState, [bigint, bigint]] => [
    privateState,
    privateState.divisionOutPut
  ],
  // Returns the user's secrete key stored offchain in their private state
  secrete_key: ({
    privateState,
  }: WitnessContext<Ledger, StateraPrivateState>): [
    StateraPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secreteKey],
  // Returns the user's mint-metadata stored offchain in their private state
  getget_mintmetadata_private_state: ({
    privateState,
  }: WitnessContext<Ledger, StateraPrivateState>): [
    StateraPrivateState,
    {
      collateral: bigint;
      amountToMint: bigint;
    },
  ] => [privateState, privateState.mintMetadata],
};
