import type {
  ContractAddress,
  SigningKey,
} from "@midnight-ntwrk/compact-runtime";
import type {
  PrivateStateId,
  PrivateStateProvider,
} from "@midnight-ntwrk/midnight-js-types";
import type { Logger } from "pino";

export class PrivateStateProviderWrapper<PSI extends PrivateStateId, PS = any>
  implements PrivateStateProvider<PSI, PS>
{
  constructor(
    private readonly privateStateProvider: PrivateStateProvider<PSI, PS>,
    private readonly logger: Logger
  ) {}

  set(privateStateId: PSI, state: PS): Promise<void> {
    this.logger.info(`Setting private state....`);
    return this.privateStateProvider.set(privateStateId, state);
  }

  get(privateStateId: PSI): Promise<PS | null> {
    this.logger.info("Retrieving private state...");
    return this.privateStateProvider.get(privateStateId);
  }

  clear(): Promise<void> {
    this.logger.info("Clearing private state...");
    return this.privateStateProvider.clear();
  }
  remove(privateStateId: PSI): Promise<void> {
    this.logger.info("Removing private state...");
    return this.privateStateProvider.remove(privateStateId);
  }
  setSigningKey(
    address: ContractAddress,
    signingKey: SigningKey
  ): Promise<void> {
    this.logger.info("SEtting signing key...");
    return this.privateStateProvider.setSigningKey(address, signingKey);
  }
  getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
    this.logger.info("Fetching signiing keys");
    return this.privateStateProvider.getSigningKey(address);
  }

  removeSigningKey(address: ContractAddress): Promise<void> {
    this.logger.info("Fetching signiing keys");
    return this.privateStateProvider.removeSigningKey(address);
  }
  clearSigningKeys(): Promise<void> {
    this.logger.info("Fetching signiing keys");
    return this.privateStateProvider.clearSigningKeys();
  }
}
