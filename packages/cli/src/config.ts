import path from 'node:path';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;

  setNetworkId: () => void;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export class TestnetLocalConfig implements Config {
  privateStateStoreName = "statera-private-state";
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-local', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contracts', 'ada-statera-protocol', 'dist', 'managed', 'adaStateraProtocol');
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';

  setNetworkId() {
    setNetworkId(NetworkId.TestNet);
  }
}

export class StandaloneConfig implements Config {
  privateStateStoreName = "statera-private-state"
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contracts', 'ada-statera-protocol', 'dist', 'managed', 'adaStateraProtocol');
  indexer = 'http://127.0.0.1:8088/api/v1/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v1/graphql/ws';
  node = 'http://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';

  setNetworkId() {
    setNetworkId(NetworkId.Undeployed);
  }
}

export class TestnetRemoteConfig implements Config {
  privateStateStoreName = "statera-private-state"
  logDir = path.resolve(currentDir, '..', 'logs', 'testnet-remote', `${new Date().toISOString()}.log`);
  zkConfigPath = path.resolve(currentDir, '..', '..', 'contracts', 'ada-statera-protocol', 'dist', 'managed', 'adaStateraProtocol');
  indexer = 'https://indexer-rs.testnet-02.midnight.network/api/v1/graphql';
  indexerWS = 'wss://indexer-rs.testnet-02.midnight.network/api/v1/graphql/ws';
  node = 'https://rpc.testnet-02.midnight.network';
  proofServer = 'http://13.53.62.251:6300/';

  setNetworkId() {
    setNetworkId(NetworkId.TestNet);
  }
}

//proof-server-1:   http://13.53.62.251:6300/

//proof-server-2:  http://51.20.55.91:6300/
