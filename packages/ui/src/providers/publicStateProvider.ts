import type { ContractState } from "@midnight-ntwrk/compact-runtime";
import type {
  ContractAddress,
  TransactionId,
  ZswapChainState,
} from "@midnight-ntwrk/ledger";
import type {
  BlockHashConfig,
  BlockHeightConfig,
  ContractStateObservableConfig,
  FinalizedTxData,
  PublicDataProvider,
} from "@midnight-ntwrk/midnight-js-types";
import type { Logger } from "pino";
import { enableRetry } from "./enableRetry";
import type { Observable } from "rxjs";

export class WrappedPublicStateProvider implements PublicDataProvider {
  constructor(
    private readonly publicDataProvider: PublicDataProvider,
    private readonly logger: Logger
  ) {}
  // Watches for contract state change from the pub-sub-indexer
  watchForContractState(
    contractAddress: ContractAddress
  ): Promise<ContractState> {
    return enableRetry(
      () => this.publicDataProvider.watchForContractState(contractAddress),
      "watchContractState",
      this.logger
    );
  }

  // Watch fro transactions tht update the state of the contract
  watchForTxData(txId: TransactionId): Promise<FinalizedTxData> {
    return enableRetry(
      () => this.publicDataProvider.watchForTxData(txId),
      "watchForTxData",
      this.logger
    );
  }

  contractStateObservable(address: ContractAddress, config: ContractStateObservableConfig): Observable<ContractState> {
      return this.publicDataProvider.contractStateObservable(address, config);
  }

  // Watch for deployment of new transaction
  watchForDeployTxData(
    contractAddress: ContractAddress
  ): Promise<FinalizedTxData> {
    return enableRetry(
      () => this.publicDataProvider.watchForDeployTxData(contractAddress),
      "watchForDeployTxData",
      this.logger
    );
  }

  // Queries contract state from the pub-sub-indexer
  queryContractState(
    contractAddress: ContractAddress,
    config?: BlockHeightConfig | BlockHashConfig
  ): Promise<ContractState | null> {
    return enableRetry(
      () => this.publicDataProvider.queryContractState(contractAddress, config),
      "queryContractState",
      this.logger
    );
  }

  queryDeployContractState(
    contractAddress: ContractAddress
  ): Promise<ContractState | null> {
    return enableRetry(
      () => this.publicDataProvider.queryDeployContractState(contractAddress),
      "queryDeployContractState",
      this.logger
    );
  }

  queryZSwapAndContractState(
    contractAddress: ContractAddress,
    config?: BlockHeightConfig | BlockHashConfig
  ): Promise<[ZswapChainState, ContractState] | null> {
    return enableRetry(
      () =>
        this.publicDataProvider.queryZSwapAndContractState(
          contractAddress,
          config
        ),
      "queryZSwapAndContractState",
      this.logger
    );
  }
}
