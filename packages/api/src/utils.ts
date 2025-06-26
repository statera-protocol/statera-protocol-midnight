import { Depositor, Staker } from "@statera/ada-statera-protocol";
import { Logger } from "pino";
import {parse as uuidParser} from "uuid"
import { DerivedDepositor, DerivedReservedPoolTotal, DerivedStaker } from "./common-types.js";
export const randomNonceBytes = (length: number, logger?: Logger): Uint8Array => {
    const newBytes = new Uint8Array(length);
    crypto.getRandomValues(newBytes);
    logger?.info("Random nonce bytes", newBytes)
    return newBytes;
}

export function uint8arraytostring<T extends Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray>(array: T) {
    const deocodedText = new TextDecoder("utf-8").decode(array);
    return deocodedText
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


export function createDeriveReservePoolArray(reservePoolTotal: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): {
        nonce: Uint8Array;
        color: Uint8Array;
        value: bigint;
        mt_index: bigint;
    };
    [Symbol.iterator](): Iterator<[Uint8Array, {
        nonce: Uint8Array;
        color: Uint8Array;
        value: bigint;
        mt_index: bigint;
    }]>;
}): DerivedReservedPoolTotal[] {
  return Array.from(reservePoolTotal).map(([key, reserve]) => ({
    id: uint8arraytostring(key),
    pool_balance: reserve,
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


export function pad(s: string, n: number): Uint8Array {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(s);
  if (n < utf8Bytes.length) {
    throw new Error(`The padded length n must be at least ${utf8Bytes.length}`);
  }
  const paddedArray = new Uint8Array(n);
  paddedArray.set(utf8Bytes);
  return paddedArray;
}


export default {randomNonceBytes, uint8arraytostring, createDerivedDepositorsArray, createDerivedStakersArray, pad  };