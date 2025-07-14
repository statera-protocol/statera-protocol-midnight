import {
  Ledger,
  MintMetadata,
} from "./managed/adaStateraProtocol/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export interface StateraPrivateState {
  readonly secrete_key: Uint8Array;
  readonly mint_metadata: MintMetadata;
}

export const createPrivateStateraState = (secrete_key: Uint8Array) => ({
  secrete_key,
});

export const witnesses = {
  division: (
    { privateState }: WitnessContext<Ledger, StateraPrivateState>,
    dividend: bigint,
    divisor: bigint
  ): [StateraPrivateState, [bigint, bigint]] => {
    if (divisor == 0n) throw "Invaid arithemetic operation";

    const quotient = BigInt(Math.round(Number(dividend / divisor)));
    const remainder = dividend % divisor;

    return [privateState, [quotient, remainder]];
  },

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
  ] => {
    return [privateState, privateState.mint_metadata];
  },

  /* Sets mint_metadata in private state*/
  set_mint_metadata: (
    { privateState }: WitnessContext<Ledger, StateraPrivateState>,
    newMetadata: Partial<MintMetadata>
  ): [StateraPrivateState, []] => {
    const newPrivateState = {
      ...privateState,
      mint_metadata: {
        ...privateState.mint_metadata,
        ...newMetadata,
      },
    };

    return [newPrivateState, []];
  },
};
