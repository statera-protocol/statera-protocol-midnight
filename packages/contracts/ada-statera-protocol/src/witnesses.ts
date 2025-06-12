import {
  Ledger,
  MintMetadata,
} from "./managed/adaStateraProtocol/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export interface StateraPrivateState {
  readonly mintMetadata: MintMetadata;
  readonly secrete_key: Uint8Array;
  readonly divisionOutput?: [bigint, bigint];
}

export const createPrivateStateraState = (secrete_key: Uint8Array) => ({
  secrete_key,
});

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
  }: WitnessContext<Ledger, StateraPrivateState>): [
    StateraPrivateState,
    [bigint, bigint],
  ] => [privateState, privateState.divisionOutput as [bigint, bigint]],

  // Returns the user's secrete key stored offchain in their private state
  secrete_key: ({
    privateState,
  }: WitnessContext<Ledger, StateraPrivateState>): [
    StateraPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secrete_key],

  // Returns the user's mint-metadata stored offchain in their private state
  get_mintmetadata_private_state: ({
    privateState,
  }: WitnessContext<Ledger, StateraPrivateState>): [
    StateraPrivateState,
    MintMetadata,
  ] => [privateState, privateState.mintMetadata],
};
