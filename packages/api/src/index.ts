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
  encodeCoinPublicKey,
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
  type CoinInfo,
  createPrivateStateraState,
} from "@statera/ada-statera-protocol";
import { type Logger } from "pino";
import * as utils from "./utils.js";
import {
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
    MCR: number
  ) => Promise<FinalizedCallTxData<StateraContract, "resetProtocolConfig">>;
  addAdmin: (
    addrs: string
  ) => Promise<FinalizedCallTxData<StateraContract, "addAdmin">>;
  setSUSDColor: () => Promise<
    FinalizedCallTxData<StateraContract, "setSUSDTokenType">
  >;
  transferSuperAdminRole: (
    addrs: string
  ) => Promise<FinalizedCallTxData<StateraContract, "transferAdminRole">>;
  addTrustedOracle: (
    oraclePk: string
  ) => Promise<FinalizedCallTxData<StateraContract, "addTrustedOracle">>;
  removeTrustedOracle: (
    oraclePk: string
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
          protocolReserveTVL: utils.createDerivedReservedPoolArray(ledgerState.protocolReserveTVL),
          liquidationThreshold: ledgerState.liquidationThreshold,
          collateralDepositors: utils.createDerivedDepositorsArray(
            ledgerState.depositors
          ),
          stakers: utils.createDerivedStakersArray(ledgerState.stakers),
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
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const deployedContract = await deployContract<StateraContract>(providers, {
      contract: StateraContractInstance,
      initialPrivateState: await StateraAPI.getPrivateState(providers),
      privateStateId: stateraPrivateStateId,
      args: [
        utils.randomNonceBytes(32, logger),
        110n,
        80n,
        120n,
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

  coin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(nativeToken()),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  sUSD_coin(amount: number): CoinInfo {
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
    const deposit_unit_specks = amount * 1_000_000;
    const txData =
      await this.allReadyDeployedContract.callTx.depositToCollateralPool(
        this.coin(deposit_unit_specks),
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
    // Construct tx with dynamic coin data
    const txData = await this.allReadyDeployedContract.callTx.repay(
      this.sUSD_coin(amount),
      BigInt(amount)
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

  async setSUSDColor(): Promise<
    FinalizedCallTxData<StateraContract, "setSUSDTokenType">
  > {
    const txData =
      await this.allReadyDeployedContract.callTx.setSUSDTokenType();

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
    MCR: number
  ): Promise<FinalizedCallTxData<StateraContract, "resetProtocolConfig">> {
    const txData =
      await this.allReadyDeployedContract.callTx.resetProtocolConfig(
        BigInt(liquidation_threshold),
        BigInt(LVT),
        BigInt(MCR)
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
    addrs: string
  ): Promise<FinalizedCallTxData<StateraContract, "addAdmin">> {
    const txData = await this.allReadyDeployedContract.callTx.addAdmin(
      encodeCoinPublicKey(addrs)
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
    oraclePk: string
  ): Promise<FinalizedCallTxData<StateraContract, "addTrustedOracle">> {
    const txData = await this.allReadyDeployedContract.callTx.addTrustedOracle(
      utils.hexStringToUint8Array(oraclePk)
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
    oraclePk: string
  ): Promise<FinalizedCallTxData<StateraContract, "removeTrustedOraclePk">> {
    const txData =
      await this.allReadyDeployedContract.callTx.removeTrustedOraclePk(
        utils.hexStringToUint8Array(oraclePk)
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
    addrs: string
  ): Promise<FinalizedCallTxData<StateraContract, "transferAdminRole">> {
    const txData = await this.allReadyDeployedContract.callTx.transferAdminRole(
      encodeCoinPublicKey(addrs)
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
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.withdrawCollateral(
        BigInt(amountToWithdraw),
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

    const txData = await this.allReadyDeployedContract.callTx.mintSUSD(
      BigInt(mint_amount)
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
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.depositToStabilityPool(
        this.sUSD_coin(amount)
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
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.withdrawStakeReward(
        BigInt(amountToWithdraw)
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
    // Construct tx with dynamic coin data
    const txData = await this.allReadyDeployedContract.callTx.withdrawStake(
      BigInt(amount)
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
    const txData = await this.allReadyDeployedContract.callTx.swapForsUSD(
      this.coin(swap_amt)
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
    const txData = await this.allReadyDeployedContract.callTx.swapsUSDForToken(
      this.coin(swap_amt),
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
