import { Depositor, Staker } from "@statera/ada-statera-protocol";
import { Logger } from "pino";
import {parse as uuidParser} from "uuid"
import { DerivedDepositor, DerivedStaker } from "./common-types.js";
export const randomNonceBytes = (length: number, logger?: Logger): Uint8Array => {
    const newBytes = new Uint8Array(length);
    crypto.getRandomValues(newBytes);
    logger?.info("Random nonce bytes", newBytes)
    return newBytes;
}

export function uint8arraytostring<T extends Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray>(array: T) {
    const deocodedText = new TextDecoder().decode(array);
    return deocodedText.toString()
}

export function hexStringToUint8Array(hexStr: string) {
    const uuidBytes = uuidParser(hexStr);
    const padded = new Uint8Array(32);
    padded.set(uuidBytes);
    return padded;
}

export function createDerivedDepositorsArray(collateralDepositors: {
  isEmpty(): boolean;
  size(): bigint;
  member(key_0: Uint8Array): boolean;
  lookup(key_0: Uint8Array): Depositor;
  [Symbol.iterator](): Iterator<[Uint8Array, Depositor]>;
}): DerivedDepositor[] {
  return Array.from(collateralDepositors).map(([key, depositor]) => ({
    id: uint8arraytostring(key),
    depositor: depositor,
  }));
}

export function createDerivedStakersArray(stakers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Staker;
    [Symbol.iterator](): Iterator<[Uint8Array, Staker]>;
}): DerivedStaker[] {
  return Array.from(stakers).map(([key, staker]) => ({
    id: uint8arraytostring(key),
    staker: staker,
  }));
}


export default {randomNonceBytes, uint8arraytostring, createDerivedDepositorsArray, createDerivedStakersArray};