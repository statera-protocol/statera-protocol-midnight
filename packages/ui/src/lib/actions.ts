import {
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  of,
  take,
  tap,
  throwError,
  timeout,
  catchError,
} from "rxjs";
import { pipe as fnPipe } from "fp-ts/function";
import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from "@midnight-ntwrk/dapp-connector-api";
import semver from "semver";


export const connectWallet = async (): Promise<{
  wallet: DAppConnectorWalletAPI;
  uris: ServiceUriConfig;
}> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = "1.x";
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => window.midnight?.mnLace),
      tap((connectorAPI) => {
        console.info(connectorAPI, "Check for wallet connector API");
      }),
      filter(
        (connectorAPI): connectorAPI is DAppConnectorAPI => !!connectorAPI
      ),
      concatMap((connectorAPI) =>
        semver.satisfies(
          connectorAPI.apiVersion,
          COMPATIBLE_CONNECTOR_API_VERSION
        )
          ? of(connectorAPI)
          : throwError(() => {
              console.error(
                {
                  expected: COMPATIBLE_CONNECTOR_API_VERSION,
                  actual: connectorAPI.apiVersion,
                },
                "Incompatible version of wallet connector API"
              );

              return new Error(
                `Incompatible version of Midnight Lace wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`
              );
            })
      ),
      tap((connectorAPI) => {
        console.info(
          connectorAPI,
          "Compatible wallet connector API found. Connecting."
        );
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            console.error("Could not find wallet connector API");

            return new Error(
              "Could not find Midnight Lace wallet. Extension installed?"
            );
          }),
      }),
      concatMap(async (connectorAPI) => {
        const isEnabled = await connectorAPI.isEnabled();

        console.info(isEnabled, "Wallet connector API enabled status");

        return connectorAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            console.error("Wallet connector API has failed to respond");

            return new Error(
              "Midnight Lace wallet has failed to respond. Extension enabled?"
            );
          }),
      }),
      concatMap(async (connectorAPI) => ({
        walletConnectorAPI: await connectorAPI.enable(),
        connectorAPI,
      })),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              console.error("Unable to enable connector API");
              return new Error("Application is not authorized");
            })
          : apis
      ),
      concatMap(async ({ walletConnectorAPI, connectorAPI }) => {
        const uris = await connectorAPI.serviceUriConfig();

        console.info(
          "Connected to wallet connector API and retrieved service configuration"
        );

        return { wallet: walletConnectorAPI, uris };
      })
    )
  );
};

export const calculateExpiryDate = (duration: number, creationDate: number) => {
  const millisecondsPerHour = 1000 * 60 * 60 * 24;
  const durationInMilliseconds = millisecondsPerHour * duration;
  const expiryDate = creationDate + durationInMilliseconds;

  const dateObject = new Date(expiryDate);
  return dateObject.toLocaleDateString();
};


// export const calculate_SPECK_per_tDUST