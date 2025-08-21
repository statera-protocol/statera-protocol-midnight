import {
  DeployedStateraOnchainContract,
  LiquidationPayload,
  StateraContract,
  StateraContractProviders,
  stateraPrivateStateId,
} from "./common-types.js";
import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  StateraPrivateState,
  witnesses,
  createPrivateStateraState,
} from "@statera/ada-statera-protocol";
import { type Logger } from "pino";
import * as utils from "./utils.js";

const StateraContractInstance: StateraContract = new Contract(witnesses);

export interface DeployedStateraAPI {
  readonly deployedContractAddress: ContractAddress;
  liquidatePosition: (
    position: LiquidationPayload
  ) => Promise<FinalizedCallTxData<StateraContract, "liquidateDebtPosition">>;
}

export class StateraAPI implements DeployedStateraAPI {
  deployedContractAddress: string;

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

  async liquidatePosition(position: LiquidationPayload): Promise<FinalizedCallTxData<StateraContract, "liquidateDebtPosition">> {
    // Construct tx with dynamic coin data
    const txData =
      await this.allReadyDeployedContract.callTx.liquidateDebtPosition(
        BigInt(position.collateral_amount),
        utils.hexStringToUint8Array(position.id),
        BigInt(position.debt)
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
        },
      }
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";
