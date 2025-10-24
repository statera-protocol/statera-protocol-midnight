import {
  CircuitContext,
  CircuitResults,
  constructorContext,
  QueryContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  CoinInfo,
  ComplianceToken,
  Contract,
  ledger,
  Ledger,
  Witnesses,
} from "../src/managed/adaStateraProtocol/contract/index.cjs";
import { StateraPrivateState, witnesses } from "../src/witnesses";
import {
  encodeTokenType,
  nativeToken,
  sampleContractAddress,
  tokenType,
} from "@midnight-ntwrk/ledger";
import { hexStringToUint8Array, pad, randomBytes } from "./utils";

export type StateraContract = Contract<
  StateraPrivateState,
  Witnesses<StateraPrivateState>
>;

export class StateraProtocolSimulator {
  readonly contract: StateraContract;
  turnContext: CircuitContext<StateraPrivateState>;
  updateUserPrivateState: (newPrivateState: StateraPrivateState) => void;
  readonly scaleFactor: number;
  readonly contractAddress: string;
  userPrivateState: StateraPrivateState;
  readonly testComplianceToken: ComplianceToken;
  private testOraclPrice: number;

  constructor(privateState: StateraPrivateState) {
    this.contract = new Contract(witnesses);
    const {
      currentContractState,
      currentPrivateState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(privateState, "0".repeat(64)),
      randomBytes(32),
      110n,
      80n,
      120n,
      encodeTokenType(nativeToken())
    );
    this.contractAddress = sampleContractAddress();
    this.updateUserPrivateState = (newPrivateState: StateraPrivateState) => {};
    this.turnContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        this.contractAddress
      ),
    };
    this.userPrivateState = {
      secrete_key: randomBytes(32),
      mint_metadata: {
        collateral: 0n,
        debt: 0n,
        borrowLimit: 0n,
      },
    };
    this.scaleFactor = 1_000_000;
    this.testOraclPrice = 0.91 * this.scaleFactor;
    this.testComplianceToken = {
      oracleSignature: hexStringToUint8Array(
        "165c55a1-55dd-47af-b4cf-19091045ac1b"
      ),
      tokenData: {
        did: hexStringToUint8Array("b80a1cef-cd22-4114-a40b-ff952f557652"),
        oraclePk: hexStringToUint8Array("66c31cd2-d251-4315-8980-68f5b0005ba1"),
        userPk: hexStringToUint8Array("c12f9a9b-302a-4ace-b854-489b9679a018"),
        validityRange: {
          duration: BigInt(3),
          creationDate: BigInt(Date.now()),
        },
      },
    };
  }

  //Mock deploy of statera contract
  static deployStaterContract(): StateraProtocolSimulator {
    return new StateraProtocolSimulator({
      secrete_key: randomBytes(32),
      mint_metadata: {
        collateral: 0n,
        debt: 0n,
        borrowLimit: 0n,
      },
    });
  }

  public buildTurnContext(
    currentPrivateState: StateraPrivateState
  ): CircuitContext<StateraPrivateState> {
    return {
      ...this.turnContext,
      currentPrivateState,
    };
  }

  getLedgerState(): Ledger {
    return ledger(this.turnContext.transactionContext.state);
  }

  getPrivateState(): StateraPrivateState {
    return this.turnContext.currentPrivateState;
  }

  private updateStateAndGetLedgerState<T>(
    circuitResult: CircuitResults<StateraPrivateState, T>
  ): Ledger {
    this.turnContext = circuitResult.context;
    this.updateUserPrivateState(circuitResult.context.currentPrivateState);
    return this.getLedgerState();
  }

  updateOraclePrice(currentPrice: number): number {
    this.testOraclPrice = currentPrice;
    return currentPrice;
  }

  coin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(nativeToken()),
      nonce: randomBytes(32),
      value: BigInt(amount),
    };
  }

  sUSD_coin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(
        tokenType(pad("sUSD_token", 32), this.contractAddress)
      ),
      nonce: randomBytes(32),
      value: BigInt(amount),
    };
  }

  depositCollateral(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.depositToCollateralPool(
        this.turnContext,
        this.coin(amount * this.scaleFactor),
        this.testComplianceToken,
        BigInt(this.testOraclPrice)
      )
    );
  }

  mintSUSD(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.mintSUSD(this.turnContext, BigInt(amount))
    );
  }

  repay(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.repay(
        this.turnContext,
        this.coin(amount * this.scaleFactor),
        BigInt(amount)
      )
    );
  }

  withdrawCollateral(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.withdrawCollateral(
        this.turnContext,
        BigInt(amount),
        BigInt(this.testOraclPrice)
      )
    );
  }

  liquidatePosition(
    id: Uint8Array,
    collateralAmt: number,
    debt: number
  ): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.liquidateDebtPosition(
        this.turnContext,
        BigInt(collateralAmt),
        id,
        BigInt(debt),
        BigInt(this.testOraclPrice)
      )
    );
  }

  reset(newLT: number, newLTV: number, newMCR: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.resetProtocolConfig(
        this.turnContext,
        BigInt(newLT),
        BigInt(newLTV),
        BigInt(newMCR)
      )
    );
  }

  setSUSDTokenTYpe(): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.setSUSDTokenType(this.turnContext)
    );
  }

  addTrustedOracle(oraclePk: Uint8Array): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.addTrustedOracle(this.turnContext, oraclePk)
    );
  }

  addAdmin(cPK: Uint8Array): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.addAdmin(this.turnContext, cPK)
    );
  }

  removeTrustedOraclePk(oraclePk: Uint8Array): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.removeTrustedOraclePk(
        this.turnContext,
        oraclePk
      )
    );
  }

  //   addAcceptedStableToken(oraclePk: Uint8Array){
  //     return this.updateStateAndGetLedgerState(
  //         this.contract.impureCircuits.(
  //             this.turnContext,
  //             oraclePk
  //         )
  //     )
  //   }

  transferSuperAdminRole(cPK: Uint8Array): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.transferAdminRole(this.turnContext, cPK)
    );
  }

  swapForSUSD(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.swapForsUSD(
        this.turnContext,
        this.coin(amount * this.scaleFactor)
      )
    );
  }
  swapsUSDForStableCoin(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.swapsUSDForToken(
        this.turnContext,
        this.coin(amount * this.scaleFactor),
        encodeTokenType(nativeToken())
      )
    );
  }

  stake(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.depositToStabilityPool(
        this.turnContext,
        this.sUSD_coin(amount * this.scaleFactor)
      )
    );
  }

  unstake(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.withdrawStake(
        this.turnContext,
        BigInt(amount * this.scaleFactor)
      )
    );
  }

  checkStakeReward(): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.checkStakeReward(this.turnContext)
    );
  }

  withdrawStakeReward(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.withdrawStakeReward(
        this.turnContext,
        BigInt(amount * this.scaleFactor)
      )
    );
  }
}
