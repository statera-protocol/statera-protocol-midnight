import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { StateraProtocolSimulator } from "./adaStateraProtocol-setup";
import {
  convertMapToArray,
  hexStringToUint8Array,
  randomBytes,
  uint8arraytostring,
} from "./utils";
import { StateraPrivateState } from "../src/witnesses";
import { LedgerMapItem } from "./common-types";
import {
  DebtPositionStatus,
  Depositor,
  QualifiedCoinInfo,
  Staker,
} from "../src/managed/adaStateraProtocol/contract/index.cjs";

const positionStatus = ["inactive", "active", "liquidated"];

const createStateraProtocol = (testName: string): StateraProtocolSimulator => {
  const simulator = StateraProtocolSimulator.deployStaterContract();
  const ledgerState = simulator.getLedgerState();
  simulator.addTrustedOracle(
    hexStringToUint8Array("66c31cd2-d251-4315-8980-68f5b0005ba1")
  );
  simulator.setSUSDTokenTYpe();
  console.log(`${testName} deployment successful 🎉`);
  console.log(
    "==============================================================================================================="
  );
  //   const initPrivateState = simulator.getPrivateState();
  expect(ledgerState.liquidationThreshold).toBe(1100000n);
  expect(ledgerState.LTV).toBe(800000n);
  expect(ledgerState.MCR).toBe(1200000n);
  expect(ledgerState.sUSDTokenType).toHaveLength(32);

  return simulator;
};

describe("Depositor Action Simulation", () => {
  it("Should simulate deposit, minting, repayment, redepositing and liquidation", () => {
    let privateState: StateraPrivateState;
    let protocolReserveTVL: LedgerMapItem<QualifiedCoinInfo>[];
    let depoistors: LedgerMapItem<Depositor>[];

    const simulator = createStateraProtocol("Depositor test contract");
    // Deposit collateral
    const depositLedgerState = simulator.depositCollateral(3);
    privateState = simulator.getPrivateState();
    protocolReserveTVL = convertMapToArray<QualifiedCoinInfo>(
      depositLedgerState.protocolReserveTVL
    );
    depoistors = convertMapToArray<Depositor>(depositLedgerState.depositors);

    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* DEPOSIT tDUST ***************************************************/"
    );
    console.log("After successful deposit 🏦");
    console.log(
      "==========================================================================================================="
    );
    const { state: depositor, key: id } = depoistors[0];
    const { state: dTVL } = protocolReserveTVL[0];

    console.log("- Deposit ID:", id);
    console.log("- Collateral:", privateState.mint_metadata.collateral);
    console.log("- Borrow Limit:", privateState.mint_metadata.borrowLimit);
    console.log("- TVL size:", depositLedgerState.protocolReserveTVL.size());
    console.log("- Debt:", privateState.mint_metadata.debt);
    console.log("- Current depositor:", depositor);
    console.log("- Current pool status:", positionStatus[depositor.position]);
    console.log("- Current reserver tvl balance", dTVL.value);

    expect(depositLedgerState.protocolReserveTVL.size()).toBe(1n);
    expect(dTVL.value).toBe(3_000_000n);
    expect(privateState.mint_metadata.collateral).toBe(3_000_000n);
    expect(depositor.position).toBe(DebtPositionStatus.inactive);

    // Mint sUSD
    const mintLedgerState = simulator.mintSUSD(2);
    privateState = simulator.getPrivateState();
    depoistors = convertMapToArray<Depositor>(mintLedgerState.depositors);

    const { state: mintState } = depoistors[0];
    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* MINT sUSD ***************************************************/"
    );
    console.log("After successful minting 🤑");
    console.log(
      "==========================================================================================================="
    );
    console.log("- Collateral:", privateState.mint_metadata.collateral);
    console.log("- Borrow Limit:", privateState.mint_metadata.borrowLimit);
    console.log("- TVL size:", depositLedgerState.protocolReserveTVL.size());
    console.log("- Debt:", privateState.mint_metadata.debt);
    console.log("- Current depositor", mintState);
    console.log("- Current deposit status", positionStatus[mintState.position]);

    expect(mintLedgerState.totalMint).toBe(2_000_000n);
    expect(privateState.mint_metadata.debt).toBe(2_000_000n);

    const repaymentLedgerState = simulator.repay(2);
    privateState = simulator.getPrivateState();
    depoistors = convertMapToArray<Depositor>(repaymentLedgerState.depositors);

    const { state: repaymentState } = depoistors[0];

    // Expectations
    expect(privateState.mint_metadata.debt).toBe(0n);
    expect(privateState.mint_metadata.borrowLimit).toBe(2_400_000n);

    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* REPAY sUSD ***************************************************/"
    );
    console.log("After successful repayment 💸");
    console.log(
      "==========================================================================================================="
    );
    console.log("- Collateral:", privateState.mint_metadata.collateral);
    console.log("- Borrow Limit:", privateState.mint_metadata.borrowLimit);
    console.log("- TVL size:", repaymentLedgerState.protocolReserveTVL.size());
    console.log("- Debt:", privateState.mint_metadata.debt);
    console.log("- Current depositor", repaymentState);
    console.log(
      "- Current deposit status",
      positionStatus[repaymentState.position]
    );

    const withdrawLedgerState = simulator.withdrawCollateral(3);
    privateState = simulator.getPrivateState();
    depoistors = convertMapToArray<Depositor>(repaymentLedgerState.depositors);
    protocolReserveTVL = convertMapToArray<QualifiedCoinInfo>(
      withdrawLedgerState.protocolReserveTVL
    );

    const { state: withdrawalState } = depoistors[0];

    expect(privateState.mint_metadata.borrowLimit).toBe(0n);
    expect(privateState.mint_metadata.debt).toBe(0n);
    expect(privateState.mint_metadata.collateral).toBe(0n);
    expect(withdrawLedgerState.protocolReserveTVL.size()).toBe(0n);

    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* WITHDRAW tDUST ***************************************************/"
    );
    console.log("After successful collateral withdrawal 💸");
    console.log(
      "==========================================================================================================="
    );
    console.log("- Collateral:", privateState.mint_metadata.collateral);
    console.log("- Borrow Limit:", privateState.mint_metadata.borrowLimit);
    console.log("- TVL size:", withdrawLedgerState.protocolReserveTVL.size());
    console.log("- Debt:", privateState.mint_metadata.debt);
    console.log("- Current depositor", withdrawalState);
    console.log(
      "- Current deposit status",
      positionStatus[withdrawalState.position]
    );
  });
});

describe("Liquidation & Stake Simulation", () => {
  it("Should deposit, mint, stake and liquidate", () => {
    let privateState: StateraPrivateState;
    let protocolReserveTVL: LedgerMapItem<QualifiedCoinInfo>[];
    let protocolStakeTVL: QualifiedCoinInfo;
    let depoistors: LedgerMapItem<Depositor>[];
    let stakers: LedgerMapItem<Staker>[];

    const simulator = createStateraProtocol(
      "Liquidation & stake test contract"
    );
    // Deposit collateral
    const depositLedgerState = simulator.depositCollateral(3);
    privateState = simulator.getPrivateState();
    protocolReserveTVL = convertMapToArray<QualifiedCoinInfo>(
      depositLedgerState.protocolReserveTVL
    );
    depoistors = convertMapToArray<Depositor>(depositLedgerState.depositors);

    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* DEPOSIT tDUST ***************************************************/"
    );
    console.log("After successful deposit 🏦");
    console.log(
      "==========================================================================================================="
    );
    const { state: depositor, key: id } = depoistors[0];
    const { state: dTVL } = protocolReserveTVL[0];

    console.log("- Deposit ID:", id);
    console.log("- Collateral:", privateState.mint_metadata.collateral);
    console.log("- Borrow Limit:", privateState.mint_metadata.borrowLimit);
    console.log("- TVL size:", depositLedgerState.protocolReserveTVL.size());
    console.log("- Debt:", privateState.mint_metadata.debt);
    console.log("- Current depositor:", depositor);
    console.log("- Current pool status:", positionStatus[depositor.position]);
    console.log("- Current reserver tvl balance", dTVL.value);

    expect(depositLedgerState.protocolReserveTVL.size()).toBe(1n);
    expect(dTVL.value).toBe(3_000_000n);
    expect(privateState.mint_metadata.collateral).toBe(3_000_000n);
    expect(depositor.position).toBe(DebtPositionStatus.inactive);

    // Mint sUSD
    const mintLedgerState = simulator.mintSUSD(2);
    privateState = simulator.getPrivateState();
    depoistors = convertMapToArray<Depositor>(mintLedgerState.depositors);

    const { state: mintState } = depoistors[0];
    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* MINT sUSD ***************************************************/"
    );
    console.log("After successful minting 🤑");
    console.log(
      "==========================================================================================================="
    );
    console.log("- Collateral:", privateState.mint_metadata.collateral);
    console.log("- Borrow Limit:", privateState.mint_metadata.borrowLimit);
    console.log("- TVL size:", depositLedgerState.protocolReserveTVL.size());
    console.log("- Debt:", privateState.mint_metadata.debt);
    console.log("- Current depositor", mintState);
    console.log("- Current deposit status", positionStatus[mintState.position]);
    console.log(
      "- sUSD token type",
      uint8arraytostring(mintLedgerState.sUSDTokenType)
    );

    expect(mintLedgerState.totalMint).toBe(2_000_000n);
    expect(privateState.mint_metadata.debt).toBe(2_000_000n);

    // Stake sUSD
    const stakeLedgerState = simulator.stake(5);
    stakers = convertMapToArray<Staker>(stakeLedgerState.stakers);
    protocolStakeTVL = stakeLedgerState.protocolStakeTVL;

    const { state: staker, key: stakeId } = stakers[0];

    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* STAKE sUSD ***************************************************/"
    );
    console.log("After successful staking 🗳️");
    console.log(
      "==========================================================================================================="
    );
    console.log("- Stake TVL:", protocolStakeTVL.value);
    console.log("- Current staker", staker);
    console.log("- Current cumulative scale factor", stakeLedgerState.cumulativeScalingFactor);
    console.log("- Current staker's ID", stakeId);
    console.log(
      "- sUSD token type",
      uint8arraytostring(stakeLedgerState.sUSDTokenType)
    );

    expect(protocolStakeTVL.value).toBe(5_000_000n);
    expect(staker.effective_user_balance).toBe(5_000_000n);

    // Liquidate position
    const liquidationLedgerState = simulator.liquidatePosition(
      hexStringToUint8Array(id),
      3_000_000,
      2_000_000,
      0.35
    );
    depoistors = convertMapToArray<Depositor>(
      liquidationLedgerState.depositors
    );
    protocolStakeTVL = liquidationLedgerState.protocolStakeTVL;

    const { state: liquidatedDepositor } = depoistors[0];

    expect(liquidatedDepositor.position).toBe(DebtPositionStatus.liquidated);
    expect(protocolStakeTVL.value).toBe(3_000_000n);
    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* LIQUIDATE POSITION ***************************************************/"
    );
    console.log("After successful liquidation 💣");
    console.log(
      "==========================================================================================================="
    );
    console.log("- Liquidated deposit ID:", id);
    console.log("- Current depositor:", liquidatedDepositor);
    console.log("- Current pool status:", positionStatus[liquidatedDepositor.position]);

    // Check stake reward
    const checkStakeLedgerState = simulator.checkStakeReward();
    stakers = convertMapToArray<Staker>(checkStakeLedgerState.stakers);
    protocolStakeTVL = checkStakeLedgerState.protocolStakeTVL;
    const { state: stakeChecker } = stakers[0];
    console.log(
      "==========================================================================================================="
    );
    console.log(
      "/************************************* CHECK STAKE REWARD 🎁 ***************************************************/"
    );
    console.log("After successfully checking stake reward 🎁");
    console.log(
      "==========================================================================================================="
    );
    console.log("- Current staker", stakeChecker);
    console.log("- Current cummulative scaling factor", checkStakeLedgerState.cumulativeScalingFactor);
    console.log("- Current stake pool balance", protocolStakeTVL.value);

    expect(stakeChecker.effective_user_balance).toBe(2_000_000n);
    expect(stakeChecker.stake_reward).toBe(3_000_000n);
  });
});
