import {
  Ledger,
  MintMetadata,
} from "./managed/adaStateraProtocol/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export interface StateraPrivateState {
  readonly secrete_key: Uint8Array;
  readonly depositPositions: {
    depositId: Uint8Array;
    mint_metadata: MintMetadata;
  }[];
}

export const createPrivateStateraState = (secrete_key: Uint8Array) => ({
  secrete_key,
});

// Checks if two Uint8Arrays equal each other
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const witnesses = {
  division: (
    { privateState }: WitnessContext<Ledger, StateraPrivateState>,
    dividend: bigint,
    divisor: bigint
  ): [StateraPrivateState, [bigint, bigint]] => {
    if (divisor == 0n) throw "Invaid arithemetic operation";

    const quotient = dividend / divisor;
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

  // Returns the user's mint-metadata stored offchain in their private state using the depositId
  get_mintmetadata_private_state: (
    { privateState }: WitnessContext<Ledger, StateraPrivateState>,
    depositId: Uint8Array
  ): [StateraPrivateState, MintMetadata] => {
    const privateStateById = privateState.depositPositions.find((state) =>
      arraysEqual(state.depositId, depositId)
    );

    return [privateState, privateStateById?.mint_metadata as MintMetadata];
  },

  /* Sets mint_metadata for a particular debt position in private state*/
  set_mint_metadata: (
    { privateState }: WitnessContext<Ledger, StateraPrivateState>,
    depositId: Uint8Array,
    newMetadata: Partial<MintMetadata>
  ): [StateraPrivateState, []] => {
    const newPrivateState = {
      ...privateState,
      depositPositions: privateState.depositPositions.map((position) => {
        if (arraysEqual(position.depositId, depositId)) {
          return {
            ...position,
            mint_metadata: { ...position.mint_metadata, ...newMetadata },
          };
        }

        return position;
      }),
    };

    return [newPrivateState, []];
  },
};
