# Statera Smart Contract Documentation

## Overview

**Statera** is a privacy-preserving, over-collateralized stablecoin protocol built on the Midnight blockchain, inspired by Aave's lending mechanics. The protocol enables users to deposit collateral (ADA) privately and mint sUSD (Statera USD) tokens while maintaining complete privacy of their financial positions through zero-knowledge proofs.

### Key Features
- **Privacy-First**: All collateral amounts and debt positions are stored off-chain using witnesses
- **Over-Collateralized**: Requires collateral ratios above 100% to ensure stability
- **Liquidation Protection**: Stakers provide liquidity to cover liquidated positions
- **Decentralized**: No central authority controls user funds or positions

# DeFi Lending Protocol

A decentralized lending and borrowing protocol that allows users to deposit collateral, mint synthetic USD (sUSD) tokens, and participate in a stability pool for liquidation rewards.

## Overview

This protocol implements a collateralized debt position (CDP) system where users can:
- Deposit collateral to mint synthetic USD tokens (sUSD)
- Stake sUSD tokens in a stability pool to earn liquidation rewards
- Manage their debt positions through repayment and withdrawal
- Participate in the liquidation process of undercollateralized positions

## Key Features

### 🏦 Collateral Management
- **Multi-collateral support**: Accept various token types as collateral
- **Dynamic borrowing limits**: Calculate borrowing capacity based on collateral value and LTV ratios
- **Position tracking**: Monitor debt position status (inactive, active, closed, liquidated)

### 💰 Synthetic Token Minting
- **sUSD Token**: Mint synthetic USD tokens backed by collateral
- **Controlled supply**: Track total minted tokens and individual debt positions
- **Secure minting**: Private metadata validation and user authentication

### 🛡️ Stability Pool
- **Liquidation buffer**: Stakers provide sUSD to absorb liquidated debt
- **Reward distribution**: Earn proportional rewards from liquidated collateral
- **Risk mitigation**: Help maintain protocol stability during market volatility

### ⚡ Liquidation System
- **Health factor monitoring**: Track position health based on collateral ratios
- **Automated liquidation**: Liquidate undercollateralized positions
- **Reward distribution**: Distribute liquidated collateral to stability pool participants

## Contract Parameters

| Parameter | Description | Type |
|-----------|-------------|------|
| `liquidationThreshold` | Minimum collateral ratio to avoid liquidation (default: 80%) | `Uint<8>` |
| `LVT` | Maximum loan-to-value ratio for borrowing | `Uint<8>` |
| `totalMint` | Total amount of sUSD tokens minted | `Uint<128>` |
| `collateralRewardPerSUSD` | Liquidation reward tracking index | `Uint<128>` |

## Data Structures

### Depositor
```
struct Depositor {
    id: Bytes<32>;              // Unique user identifier
    metadataHash: Bytes<32>;    // Hash of private position data
    hFactor: Uint<4>;           // Health factor of the position
    position: DebtPositionStatus; // Current status of the position
    coinType: Bytes<32>;        // Type of collateral deposited
    borrowLimit: Uint<32>;      // Maximum borrowable amount
}
```

### Staker
```
struct Staker {
    id: Bytes<32>;                    // Unique staker identifier
    address: ZswapCoinPublicKey;      // Staker's public key
    stakeAmount: Uint<128>;           // Amount of sUSD staked
    entryCollateralRewardPerSUSD: Uint<128>;  // Index at stake entry
    pending_ADA: Uint<128>;           // Pending liquidation rewards
}
```

### Position Status
```
enum DebtPositionStatus {
    inactive,    // No debt taken
    active,      // Active debt position
    closed,      // Debt fully repaid
    liquidated   // Position liquidated
}
```

## Core Functions

### For Depositors

#### `depositToCollateralPool(coin: CoinInfo, _depositId: Bytes<32>)`
Deposit collateral tokens to create a new borrowing position.

**Parameters:**
- `coin`: Collateral token information
- `_depositId`: Unique identifier for the deposit position

**Requirements:**
- Deposit ID must be unique
- Sufficient collateral amount must be provided

#### `mint_sUSD(mint_amount: Uint<64>, _depositId: Bytes<32>)`
Mint synthetic USD tokens against deposited collateral.

**Parameters:**
- `mint_amount`: Amount of sUSD to mint
- `_depositId`: Existing deposit position ID

**Requirements:**
- Valid deposit position must exist
- User must own the position
- Mint amount must not exceed borrow limit

#### `withdrawCollateral(_depositId: Bytes<32>, _amountToWithdraw: Uint<32>, to: Bytes<32>)`
Withdraw collateral from a position.

**Parameters:**
- `_depositId`: Deposit position ID
- `_amountToWithdraw`: Amount of collateral to withdraw
- `to`: Recipient address

**Requirements:**
- Position must be inactive or closed
- User must own the position
- Sufficient collateral must be available

#### `repay(coin: CoinInfo, _depositId: Bytes<32>, _amountToRepay: Uint<32>)`
Repay minted sUSD tokens to reduce debt.

**Parameters:**
- `coin`: sUSD tokens to repay
- `_depositId`: Deposit position ID
- `_amountToRepay`: Amount of debt to repay

**Requirements:**
- Position must be active
- Must provide valid sUSD tokens
- Repay amount must not exceed debt

### For Stakers

#### `depositToStabilityPool(coin: CoinInfo)`
Stake sUSD tokens in the stability pool to earn liquidation rewards.

**Parameters:**
- `coin`: sUSD tokens to stake

**Requirements:**
- Must provide valid sUSD tokens
- User cannot have existing stake position

#### `checkStakeReward()`
Check available liquidation rewards for a staking position.

**Returns:**
- `Uint<128>`: Total available rewards
- `Staker`: Updated staker information

#### `withdrawStakeReward(_amount: Uint<128>)`
Withdraw earned liquidation rewards.

**Parameters:**
- `_amount`: Amount of rewards to withdraw

**Requirements:**
- Must have active stake position
- Withdrawal amount must not exceed available rewards

### For Liquidators

#### `liquidateDebtPosition(_collateralAmt: Uint<64>, _depositId: Bytes<32>, _debtdebt: Uint<64>, _currentHFactor: Uint<4>)`
Liquidate an undercollateralized debt position.

**Parameters:**
- `_collateralAmt`: Amount of collateral to liquidate
- `_depositId`: Position to liquidate
- `_debtdebt`: Amount of debt to burn
- `_currentHFactor`: Current health factor

**Requirements:**
- Position must exist
- Position must be undercollateralized

### Admin Functions

#### `resetLiquidationThreshold(_liquidationThreshold: Uint<8>, _LVT: Uint<8>)`
Update protocol parameters (admin only).

**Parameters:**
- `_liquidationThreshold`: New liquidation threshold
- `_LVT`: New loan-to-value ratio

## Security Features

### Private State Management
- **Metadata hashing**: Sensitive position data is hashed for privacy
- **User authentication**: Secret key verification for position ownership
- **State validation**: Metadata integrity checks prevent manipulation

### Risk Management
- **Collateralization ratios**: Maintain healthy collateral-to-debt ratios
- **Liquidation thresholds**: Automatic liquidation of risky positions
- **Health factor monitoring**: Continuous position health assessment

### Access Control
- **Owner verification**: Users can only modify their own positions
- **Admin functions**: Critical parameters protected by admin-only access
- **Position status validation**: State-dependent function access

## Contract Compilation
```ts
  // Run the command below to build and compile the contract with the contracts/st
  npx turbo run build
```

## Contributing

This protocol is designed for educational and development purposes. When implementing in production:

- Conduct thorough security audits
- Implement comprehensive testing
- Consider oracle integration for price feeds
- Add emergency pause mechanisms
- Implement governance features

## License

[Add appropriate license information]

---
