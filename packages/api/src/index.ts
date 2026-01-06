import { combineLatest, concat, from, map, Observable, tap } from "rxjs";
import {
  DeployedStateraOnchainContract,
  DerivedStateraContractState,
  StateraContract,
  StateraContractProviders,
  stateraPrivateStateId,
} from "./common-types.js";
import {
  ContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  ledger,
  StateraPrivateState,  
  witnesses,
  type ShieldedCoinInfo,
  createPrivateStateraState,
  Depositor,
} from "@statera/statera-protocol";
import { type Logger } from "pino";
import * as utils from "./utils.js";
import {
  encodeCoinPublicKey,
  encodeTokenType,
  nativeToken,
  tokenType,
} from "@midnight-ntwrk/ledger";

const StateraContractInstance: StateraContract = new Contract(witnesses);

export interface DeployedStateraAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state: Observable<DerivedStateraContractState>;
  depositToCollateralPool: (
    amount: number
  ) => Promise<FinalizedCallTxData<StateraContract, "depositToCollateralPool">>;
  depositToStakePool: (
    amount: number
  ) => Promise<FinalizedCallTxData<StateraContract, "depositToStabilityPool">>;
  withdrawStakeReward: (
    amountToWithdraw: number
  ) => Promise<FinalizedCallTxData<StateraContract, "withdrawStakeReward">>;
  withdrawStake: (
    amount: number
  ) => Promise<FinalizedCallTxData<StateraContract, "withdrawStake">>;
  mintSUSD: (
    mint_amount: number
  ) => Promise<FinalizedCallTxData<StateraContract, "mintSUSD">>;
  repay: (
    amount: number
  ) => Promise<FinalizedCallTxData<StateraContract, "repay">>;
  withdrawCollateral: (
    amountToWithdraw: number,
    _oraclePrice: number
  ) => Promise<FinalizedCallTxData<StateraContract, "withdrawCollateral">>;
  checkStakeReward: () => Promise<
    FinalizedCallTxData<StateraContract, "checkStakeReward">
  >;
  reset: (
    liquidation_threshold: number,
    LVT: number,
    MCR: number,
    cpk: string
  ) => Promise<FinalizedCallTxData<StateraContract, "resetProtocolConfig">>;
  addAdmin: (
    newUserCpk: string,
    cpk: string
  ) => Promise<FinalizedCallTxData<StateraContract, "addAdmin">>;
  setSUSDColor: (cpk: string) => Promise<
    FinalizedCallTxData<StateraContract, "setSUSDTokenType">
  >;
  transferSuperAdminRole: (
    newUserCpk: string,
    cpk: string
  ) => Promise<FinalizedCallTxData<StateraContract, "transferSuperAdminRole">>;
  addTrustedOracle: (
    oraclePk: string,
    cpk: string
  ) => Promise<FinalizedCallTxData<StateraContract, "addTrustedOracle">>;
  removeTrustedOracle: (
    oraclePk: string,
    cpk: string
  ) => Promise<FinalizedCallTxData<StateraContract, "removeTrustedOraclePk">>;
}

export class StateraAPI implements DeployedStateraAPI {
  deployedContractAddress: string;
  state: Observable<DerivedStateraContractState>;
  private readonly SCALE: number = 1_000_000;

  /**
   * @param allReadyDeployedContract
   * @param logger becomes accessible s if they were decleared as static properties as part of the class
   */
  private constructor(
    providers: StateraContractProviders,
    public readonly allReadyDeployedContract: DeployedStateraOnchainContract,
    private logger?: Logger
  ) {
    this.deployedContractAddress =
      allReadyDeployedContract.deployTxData.public.contractAddress;

    // Set the state property
    this.state = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStaeChanged: {
                  ledgerState: {
                    ...ledgerState,
                  },
                },
              })
            )
          ),
        concat(from(providers.privateStateProvider.get(stateraPrivateStateId))),
      ],
      (ledgerState, privateState) => {
        return {
          mintCounter: ledgerState.mintCounter,
          totalMint: ledgerState.totalMint,
          superAdmin: ledgerState.superAdmin,
          sUSDTokenType: ledgerState.sUSDTokenType,
          protocolStakeTVL: ledgerState.protocolStakeTVL.value,
          protocolReserveTVL: ledgerState.protocolReserveTVL.value,
          liquidationThreshold: ledgerState.liquidationThreshold,
          collateralDepositors: utils.createArrayFromLedgerMapping<Depositor>(
            ledgerState.depositors
          ),
          stakers: utils.createArrayFromLedgerMapping(ledgerState.stakers),
          noOfDepositors: ledgerState.depositors.size(),
          mintMetadata: privateState?.mint_metadata,
          secrete_key: privateState?.secrete_key,
          admins: utils.createDerivedAdminArray(ledgerState.admins),
          LVT: ledgerState.LTV,
          MCR: ledgerState.MCR,
          liquidationCount: ledgerState.liquidationCount,
          validCollateralType: ledgerState.validCollateralAssetType,
          trustedOracles: utils.createDerivedOraclesArray(
            ledgerState.trustedOracles
          ),
        };
      }
    );
  }

  static async deployStateraContract(
    providers: StateraContractProviders,
    logger?: Logger
  ): Promise<StateraAPI> {
    logger?.info("deploy contract");
    const initialPrivateState = await StateraAPI.getPrivateState(providers);
    
    const deployedContract = await deployContract<StateraContract>(providers, {
      contract: StateraContractInstance,
      initialPrivateState,
      privateStateId: stateraPrivateStateId,
      args: [
        utils.randomNonceBytes(32, logger),
        BigInt(1.10 * 1_000_000), //110% expressed as a bigint in units
        BigInt(0.80 * 1_000_000),
        BigInt(1.20 * 1_000_000),
        encodeTokenType(nativeToken()),
      ],
    });

    logger?.trace("Deployment successfull", {
      contractDeployed: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new StateraAPI(providers, deployedContract, logger);
  }

  static async joinStateraContract(
    providers: StateraContractProviders,
    contractAddress: string,
    logger?: Logger
  ): Promise<StateraAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const existingContract = await findDeployedContract<StateraContract>(
      providers,
      {
        contract: StateraContractInstance,
        contractAddress: contractAddress,
        privateStateId: stateraPrivateStateId,
        initialPrivateState: await StateraAPI.getPrivateState(providers),
      }
    );

    logger?.trace("Found Contract...", {
      contractJoined: {
        finalizedDeployTxData: existingContract.deployTxData.public,
      },
    });
    return new StateraAPI(providers, existingContract, logger);
  }

  coin(amount: number): ShieldedCoinInfo {
    return {
      color: encodeTokenType(nativeToken()),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  sUSD_coin(amount: number): ShieldedCoinInfo {
    return {
      color: encodeTokenType(
        tokenType(utils.pad("sUSD_token", 32), this.deployedContractAddress)
      ),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  async depositToCollateralPool(
    amount: number
  ): Promise<FinalizedCallTxData<StateraContract, "depositToCollateralPool">> {
    this.logger?.info(`Depositing collateral...`);
    // First update the private state for the minter
    const deposit_in_unit = amount * 1_000_000;
    const txData =
      await this.allReadyDeployedContract.callTx.depositToCollateralPool(
        this.coin(deposit_in_unit),
        utils.getTestComplianceToken(),
        BigInt(0.95 * this.SCALE)
      );

    this.logger?.trace("Collateral Deposit was successful", {
      transactionAdded: {
        circuit: "depositToCollateralPool",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  // Repays debtAsset
  async repay(
    amount: number
  ): Promise<FinalizedCallTxData<StateraContract, "repay">> {
    this.logger?.info("Repaying debt asset...");
    const amount_in_units = amount * this.SCALE;
    // Construct tx with dynamic coin data
    const txData = await this.allReadyDeployedContract.callTx.repay(
      this.sUSD_coin(amount_in_units),
      BigInt(amount_in_units)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "repay",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async setSUSDColor(cpk: string): Promise<
    FinalizedCallTxData<StateraContract, "setSUSDTokenType">
  > {
    const txData =
      await this.allReadyDeployedContract.callTx.setSUSDTokenType(encodeCoinPublicKey(cpk));

    this.logger?.trace({
      transactionAdded: {
        circuit: "setSUSDTokenType",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async reset(
    liquidation_threshold: number,
    LVT: number,
    MCR: number,
    cpk: string
  ): Promise<FinalizedCallTxData<StateraContract, "resetProtocolConfig">> {
    const LiquidationThresholdInPercentage = (liquidation_threshold / 100) * this.SCALE;
    const LVTInPercentage = (LVT / 100) * this.SCALE;
    const MCRInPercentage = (MCR / 100) * this.SCALE;

    const txData =
      await this.allReadyDeployedContract.callTx.resetProtocolConfig(
        BigInt(LiquidationThresholdInPercentage),
        BigInt(LVTInPercentage),
        BigInt(MCRInPercentage),
        encodeCoinPublicKey(cpk)
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "reset",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async addAdmin(
    newUserCpk: string,
    cpk: string
  ): Promise<FinalizedCallTxData<StateraContract, "addAdmin">> {
    const txData = await this.allReadyDeployedContract.callTx.addAdmin(
      encodeCoinPublicKey(newUserCpk),
      encodeCoinPublicKey(cpk)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "addAdmin",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async addTrustedOracle(
    oraclePk: string,
    cpk: string
  ): Promise<FinalizedCallTxData<StateraContract, "addTrustedOracle">> {
    const txData = await this.allReadyDeployedContract.callTx.addTrustedOracle(
      utils.hexStringToUint8Array(oraclePk),
      encodeCoinPublicKey(cpk)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "addAdmin",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async removeTrustedOracle(
    oraclePk: string,
    cpk: string
  ): Promise<FinalizedCallTxData<StateraContract, "removeTrustedOraclePk">> {
    const txData =
      await this.allReadyDeployedContract.callTx.removeTrustedOraclePk(
        utils.hexStringToUint8Array(oraclePk),
        encodeCoinPublicKey(cpk)
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "addAdmin",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async transferSuperAdminRole(
    newUserCpk: string,
    cpk: string
  ): Promise<FinalizedCallTxData<StateraContract, "transferSuperAdminRole">> {
    const txData = await this.allReadyDeployedContract.callTx.transferSuperAdminRole(
      encodeCoinPublicKey(newUserCpk),
      encodeCoinPublicKey(cpk)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "transferSuperAdminRole",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  // Repay debtAsset
  async withdrawCollateral(
    amountToWithdraw: number,
    _oraclePrice: number
  ): Promise<FinalizedCallTxData<StateraContract, "withdrawCollateral">> {
    this.logger?.info("Withdrawing collateral asset...");
    const amount_in_units = amountToWithdraw * this.SCALE;
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.withdrawCollateral(
        BigInt(amount_in_units),
        BigInt(_oraclePrice)
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "witdrawCollateral",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  // Mints sUSD
  async mintSUSD(
    mint_amount: number
  ): Promise<FinalizedCallTxData<StateraContract, "mintSUSD">> {
    this.logger?.trace(`Minting sUSD for your loan position...`);
    const amount_in_units = mint_amount * this.SCALE;
    const txData = await this.allReadyDeployedContract.callTx.mintSUSD(
      BigInt(amount_in_units)
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "mintSUSD",
        txHash: txData.public.txHash,
        mintValue: txData.public.tx.mint?.coin.value,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async depositToStakePool(
    amount: number
  ): Promise<FinalizedCallTxData<StateraContract, "depositToStabilityPool">> {
    this.logger?.info("Depositing to stake pool...");
    const amount_in_units = amount * this.SCALE;
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.depositToStabilityPool(
        this.sUSD_coin(amount_in_units)
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "depositToStabilityPool",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async checkStakeReward(): Promise<
    FinalizedCallTxData<StateraContract, "checkStakeReward">
  > {
    this.logger?.info("Checking your stake reward...");
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.checkStakeReward();

    this.logger?.trace({
      transactionAdded: {
        circuit: "checkStakeReward",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async withdrawStakeReward(amountToWithdraw: number) {
    this.logger?.info(
      `Withdrawing ${amountToWithdraw} of your stake reward...`
    );
    const amount_in_units = amountToWithdraw * this.SCALE;
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.withdrawStakeReward(
        BigInt(amount_in_units)
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "withdrawStakeReward",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async withdrawStake(
    amount: number
  ): Promise<FinalizedCallTxData<StateraContract, "withdrawStake">> {
    this.logger?.info(
      `Withdrawing ${amount} from your effective stake pool balance...`
    );
    const amount_in_units = amount * this.SCALE;
    // Construct tx with dynamic coin data
    const txData = await this.allReadyDeployedContract.callTx.withdrawStake(
      BigInt(amount_in_units)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "withdrawStake",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async swapForSUSD(
    swap_amt: number
  ): Promise<FinalizedCallTxData<StateraContract, "swapForsUSD">> {
    const amount_in_units = swap_amt * this.SCALE;
    const txData = await this.allReadyDeployedContract.callTx.swapForsUSD(
      this.coin(amount_in_units)
    );
    this.logger?.info(`Swapping ${swap_amt} of stablecoin to sUSD...`);
    this.logger?.trace({
      transactionAdded: {
        circuit: "swapForSUSD",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async swapSUSDForStableCoin(
    swap_amt: number
  ): Promise<FinalizedCallTxData<StateraContract, "swapsUSDForToken">> {
    const amount_in_units = swap_amt * this.SCALE;
    const txData = await this.allReadyDeployedContract.callTx.swapsUSDForToken(
      this.coin(amount_in_units),
      encodeTokenType(nativeToken())
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "swapSUSDForStableCoin",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  // Used to get the private state from the wallets privateState Provider
  private static async getPrivateState(
    providers: StateraContractProviders
  ): Promise<StateraPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      stateraPrivateStateId
    );
    return (
      existingPrivateState ?? {
        secrete_key: createPrivateStateraState(utils.randomNonceBytes(32))
          .secrete_key,
        mint_metadata: {
          collateral: BigInt(0),
          debt: BigInt(0),
          borrowLimit: BigInt(0),
        },
      }
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";
