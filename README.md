# Statera Protocol

A privacy-preserving, over-collateralized stablecoin protocol built on the Midnight blockchain.

## Overview
The protocol enables users to deposit collateral (e.g ADA) privately and mint sUSD (Statera USD) tokens while maintaining complete privacy of their financial positions through zero-knowledge proofs.

The protocol uses a modular and upgradeable architecture that separates core logic into different smart contracts to enhance security, flexibility, and maintainability. This is on course for when Midnight supports smart contract calls using contract addresses.
Key Features
Privacy-First: All collateral amounts and debt positions are stored off-chain using witnesses
Over-Collateralized: Requires collateral ratios above 100% to ensure stability
Liquidation Protection: Liquidators/Stakers provide liquidity to cover liquidated positions
Decentralized: No central authority controls user funds or positions.
Oracle integration: For price feeds to enhance seamless and trustless liquidation.
Governance: Statera takes a community first approach by laying a strong foundation for governance participation.
Architecture
The protocol consists of three main participant types:
Depositors/Borrowers: Deposit supported collateral and mint sUSD tokens.
Stakers/Liquidators: Stake sUSD tokens to repay liquidatable positions and earn bonuses from liquidations.
Governance Stakers: Stake Statera native token ($STAT) to earn a share of protocol usage fee and participate in governance.