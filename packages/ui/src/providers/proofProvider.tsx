import type { UnprovenTransaction } from "@midnight-ntwrk/ledger";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import type {
  ProofProvider,
  ProveTxConfig,
} from "@midnight-ntwrk/midnight-js-types";
import type { UnbalancedTransaction } from "@midnight-ntwrk/midnight-js-types";

export const proofClient = <K extends string>(
  url: string
): ProofProvider<K> => {
  const httpClientProvider = httpClientProofProvider(url.trim());

  return {
    proveTx: (tx: UnprovenTransaction, profConfig?: ProveTxConfig<K>) =>
      httpClientProvider.proveTx(tx, profConfig),
  };
};

export const noProofClient = <K extends string>(): ProofProvider<K> => {
  return {
    proveTx(
      tx: UnprovenTransaction,
      proveTxConfig?: ProveTxConfig<K>
    ): Promise<UnbalancedTransaction> {
      return Promise.reject(
        new Error(`Proof server not available: ${proveTxConfig}, ${tx}`)
      );
    },
  };
};
