import { combineLatest, concat, from, map, Observable, tap } from "rxjs";
import {
  contractAddress,
  DeployedStateraOnchainContract,
  DerivedStateraContractState,
  StateraContract,
  StateraContractProviders,
  stateraPrivateStateId,
} from "./common-types.js";
import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  ledger,
  StateraPrivateState,
  witnesses,
  type CoinInfo,
  createPrivateStateraState,
  MintMetadata,
  arraysEqual,
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
    collateralId: string,
    amount: number,
    providers: StateraContractProviders
  ) => void;
  liquidatePosition: (
    collateralId: string,
    providers: StateraContractProviders
  ) => void;
  depositToStakePool: (
    amount: number,
    tokenType: string,
    stakeId: string
  ) => void;
  withdrawStakeReward: (amountToWithdraw: number) => void;
  withdrawStake: (amount: number) => void;
  mint_sUSD: (mint_amount: number, collateralId: string) => void;
  repay: (
    amount: number,
    _collateralId: string,
    contractAddress: string
  ) => void;
  withdrawCollateral: (
    amountToWithdraw: number,
    _collateralId: string,
    _oraclePrice: number
  ) => void;
  checkStakeReward: () => void;
}
/**
 * NB: Declaring a class implements a given type, means it must contain all defined properties and methods, then take on other extra properties or class
 */

export class StateraAPI implements DeployedStateraAPI {
  deployedContractAddress: string;
  state: Observable<DerivedStateraContractState>;

  // Within the constructor set the two properties of the API Class Object
  // Using access modifiers on parameters create a property instances for that parameter and stores it as part of the object
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
          admin: ledgerState.admin.bytes,
          nonce: ledgerState.nonce,
          sUSDTokenType: ledgerState.sUSDTokenType,
          stakePoolTotal: ledgerState.stakePoolTotal.value,
          reservePoolTotal: ledgerState.reservePoolTotal,
          liquidationThreshold: ledgerState.liquidationThreshold,
          collateralDepositors: utils.createDerivedDepositorsArray(
            ledgerState.depositors
          ),
          stakers: utils.createDerivedStakersArray(ledgerState.stakers),
          noOfDepositors: ledgerState.depositors.size(),
          mintMetadata: privateState?.depositPositions,
          secrete_key: privateState?.secrete_key,
          division: privateState,
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
        90n,
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
    collateralId: string,
    amount: number,
    providers: StateraContractProviders
  ) {
    this.logger?.info(`Depositing collateral...`);
    // First update the private state for the minter
    const currentPrivaState = await providers.privateStateProvider.get(
      stateraPrivateStateId
    );

    let newPrivateState: StateraPrivateState | null;
    
    const existingDepositiPosition =
      currentPrivaState &&
      currentPrivaState?.depositPositions.find((state) =>
        arraysEqual(utils.hexStringToUint8Array(collateralId), state.depositId)
      );

    if (existingDepositiPosition) {
       newPrivateState = {
        ...currentPrivaState,
        depositPositions: currentPrivaState.depositPositions.map((state) => {
          if (
            arraysEqual(
              state.depositId,
              utils.hexStringToUint8Array(collateralId)
            )
          ) {
            const newMintMetadata = {
              ...state,
              mint_metadata: {
                ...state.mint_metadata,
                collateral: state.mint_metadata.collateral + BigInt(amount),
              },
            };

            return newMintMetadata;
          }

          return state;
        }),
      };
    }else{
      newPrivateState = currentPrivaState && {
        ...currentPrivaState,
        depositPositions: [
          ...currentPrivaState?.depositPositions,
          {
            depositId: utils.hexStringToUint8Array(collateralId),
            mint_metadata: {
              collateral: BigInt(amount),
              debt: BigInt(0),
            },
          },
        ],
      };

    }


    await StateraAPI.setPrivateState(
      providers,
      newPrivateState as StateraPrivateState
    );

    const txData =
      await this.allReadyDeployedContract.callTx.depositToCollateralPool(
        this.coin(amount),
        utils.hexStringToUint8Array(collateralId)
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
  }

  // Repays debtAsset
  async repay(amount: number, _collateralId: string) {
    this.logger?.info("Repaying debt asset...");
    // Construct tx with dynamic coin data
    const txData = await this.allReadyDeployedContract.callTx.repay(
      this.sUSD_coin(amount),
      utils.hexStringToUint8Array(_collateralId),
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
  }

  async setSUSDTokenType() {
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
  }

  // Repay debtAsset
  async withdrawCollateral(
    amountToWithdraw: number,
    _collateralId: string,
    _oraclePrice: number
  ) {
    this.logger?.info("Withdrawing collateral asset...");
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.withdrawCollateral(
        utils.hexStringToUint8Array(_collateralId),
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
  }

  // Mints sUSD
  async mint_sUSD(mint_amount: number, collateralId: string) {
    this.logger?.trace(
      `Minting sUSD for your loan position at ${collateralId}`
    );

    const txData = await this.allReadyDeployedContract.callTx.mint_sUSD(
      BigInt(mint_amount),
      utils.hexStringToUint8Array(collateralId)
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "mint_sUSD",
        txHash: txData.public.txHash,
        mintValue: txData.public.tx.mint?.coin.value,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
  }

  async depositToStakePool(amount: number) {
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
  }

  async checkStakeReward() {
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
  }

  async withdrawStake(amount: number) {
    this.logger?.info(
      `Withdrawing ${amount} from your effective stake pool balance...`
    );
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.withdrawStake(
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
  }

  async liquidatePosition(
    collateralId: string,
    providers: StateraContractProviders
  ) {
    this.logger?.info(
      `Liquidating colateral position with ID: ${collateralId}...`
    );
    const privateState = await providers.privateStateProvider.get(
      "stateraPrivateState"
    );
    const privateStateToLiquidate = privateState?.depositPositions.find(
      (state) =>
        arraysEqual(state.depositId, utils.hexStringToUint8Array(collateralId))
    );
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.liquidateDebtPosition(
        privateStateToLiquidate?.mint_metadata.collateral as bigint,
        utils.hexStringToUint8Array(collateralId),
        privateStateToLiquidate?.mint_metadata.debt as bigint
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "liquidateCollateralPosition",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
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
        depositPositions: [],
      }
    );
  }

  // Used to set the private state in the wallets privateState Provider
  private static async setPrivateState(
    providers: StateraContractProviders,
    privateState: StateraPrivateState
  ) {
    await providers.privateStateProvider.set(
      stateraPrivateStateId,
      privateState
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";
