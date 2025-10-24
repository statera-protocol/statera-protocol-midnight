import { DebtPositionStatus } from "../src/managed/adaStateraProtocol/contract/index.cjs";
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { StateraProtocolSimulator } from "./adaStateraProtocol-setup";
import { hexStringToUint8Array, randomBytes } from "./utils";
import { decodeCoinPublicKey } from "@midnight-ntwrk/ledger";

const createStateraProtocol = (): StateraProtocolSimulator => {
  const simulator = StateraProtocolSimulator.deployStaterContract();
  const ledgerState = simulator.getLedgerState();
  simulator.addTrustedOracle(
    hexStringToUint8Array("66c31cd2-d251-4315-8980-68f5b0005ba1")
  );
  simulator.setSUSDTokenTYpe();
  //   const initPrivateState = simulator.getPrivateState();
  expect(ledgerState.liquidationThreshold).toBe(110n);
  expect(ledgerState.LTV).toBe(80n);
  expect(ledgerState.MCR).toBe(120n);
  expect(ledgerState.sUSDTokenType).toHaveLength(32);

  return simulator;
};

describe("Creating vault position, minting against collateral, repay and withdrawCollateral", () => {
  it("Should allow depositing of assets and miting of sUSD against deposit vault position", () => {
    const simulator = createStateraProtocol();

    // Deposit collateral
    const ledgerState = simulator.depositCollateral(3);
    let privateState = simulator.getPrivateState();

    console.log("After deposit:");
    console.log("- Collateral:", privateState.mint_metadata.collateral);
    console.log("- Borrow Limit:", privateState.mint_metadata.borrowLimit);
    console.log("- TVL size:", ledgerState.protocolReserveTVL.size());

    expect(ledgerState.protocolReserveTVL.size()).toBe(1n);
    expect(privateState.mint_metadata.collateral).toBe(3000000n);

    // Mint sUSD
    console.log("\nAttempting to mint 2 sUSD...");
    const mintState = simulator.mintSUSD(2);
    privateState = simulator.getPrivateState();

    console.log("After mint:");
    console.log("- Total Mint (ledger):", mintState.totalMint);
    console.log("- Debt (private):", privateState.mint_metadata.debt);
    console.log(
      "- Collateral (private):",
      privateState.mint_metadata.collateral
    );
    console.log(
      "- Borrow Limit (private):",
      privateState.mint_metadata.borrowLimit
    );

    expect(mintState.totalMint).toBe(2000000n);
    expect(privateState.mint_metadata.debt).toBe(2000000n);

    // ... rest of test
  });
});
