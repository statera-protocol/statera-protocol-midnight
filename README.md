# Statera over-collateralized stablecoin protocol (sUSD)
## Overview
**Statera** is a privacy-preserving, over-collateralized stablecoin protocol built on the Midnight blockchain, inspired by Aave's lending mechanics. The protocol enables users to deposit collateral (ADA) privately and mint sUSD (Statera USD) tokens while maintaining complete privacy of their financial positions through zero-knowledge proofs.

### Key Features
- **Privacy-First**: All collateral amounts and debt positions are stored off-chain using witnesses
- **Over-Collateralized**: Requires collateral ratios above 100% to ensure stability
- **Liquidation Protection**: Stakers provide liquidity to cover liquidated positions
- **Decentralized**: No central authority controls user funds or positions

## How to run the project locally
**Pre-requisite**

- Install compactc compiler (Guide): [https://docs.midnight.network/develop/tutorial/building/]#midnight-compact-compiler

- Install proof server from midnight: [https://docs.midnight.network/develop/tutorial/using/proof-server]

- Install prebaked proof server version (RECOMMENDED): [https://github.com/bricktowers/midnight-proof-server]

- Lace wallet setup: [https://docs.midnight.network/develop/tutorial/using/chrome-ext]

- Token Aquisation: [https://docs.midnight.network/develop/tutorial/using/proof-server]

- Contract Documentation: [https://github.com/codeBigInt/fundagoal/blob/main/packages/contract/README.md]

**NOTE**: This project is a monorepo that utilizes turborepo, i.e. All workspaces are dependent on each other and interact with eachother via a build version of the workspace.

```js
    /* Running the DApp locally */

    // Clone the repository locally
    git clone "https://github.com/LucentLabss/statera-protocol.git"
    // Ensure your have the latest version or node version >=22
    node -v
    // Install dependencies
    yarn install
    // Build each workspace as theis project is a monoreapo (BUikt using turbo repo)
    cd packages/contracts/ada-statera-protocol
    npx turbo run build // Compiles the smart contract and build using compactc copiler and builds the contract workspace

    // Build the api workspace
    cd .. && cd.. && cd packages/api
    npx turbo run build

    // To run the cli DApp instance
    cd .. && cd packages/cli
    npx turbo run build
    // You can either run the cli DApp testnet mode or in undeployed mode
    yarn testnet-remote // For testnet-mode
    yarn standalone // For undeployed mode without the need tDUST faucet
```

### Interact with the DApp from a UI
```ts
   /* To run the frontend user interface */
    
    /* 
    * Create a .env file in the root of the ui folder
    * Add these env variables, it is REQUIRED for the frontend to work 
    */
    VITE_NETWORK_ID=TestNet
    VITE_LOGGING_LEVEL=trace
    VITE_CONTRACT_ADDRESS=020099556574a5ada24fb9f772d4ef13df01056d8f5b9a67227bf9d0f4d52f803c5a
    VITE_INDEXER_URL="https://indexer.testnet-02.midnight.network/api/v1/graphql"
    VITE_INDEXER_WS_URL="wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws"
```

**Build and run the DApp**

```ts
    //Navigate into the ui folder
    cd .. && cd packages/ui
    npx turbo run build

    yarn start // Starts the application at https://localhost:8080 or https://127.0.0.1:8080
```
