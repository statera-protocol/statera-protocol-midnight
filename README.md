# Statera Smart Contract Documentation

## Overview

**Statera** is a privacy-preserving, over-collateralized stablecoin protocol built on the Midnight blockchain, inspired by Aave's lending mechanics. The protocol enables users to deposit collateral (ADA) privately and mint sUSD (Statera USD) tokens while maintaining complete privacy of their financial positions through zero-knowledge proofs.

### Key Features
- **Privacy-First**: All collateral amounts and debt positions are stored off-chain using witnesses
- **Over-Collateralized**: Requires collateral ratios above 100% to ensure stability
- **Liquidation Protection**: Stakers provide liquidity to cover liquidated positions
- **Decentralized**: No central authority controls user funds or positions

## Architecture

The protocol consists of two main participant types:

1. **Depositors/Borrowers**: Deposit ADA collateral and mint sUSD tokens
2. **Stakers**: Stake sUSD tokens to earn rewards from liquidations

## Contract Structure

### Core Data Types

#### Enums
```compact
enum ReservePoolState { active, frozen }
enum CollateralPosition { inactive, active, closed, liquidated }
```

#### Key Structs
```compact
struct Depositor {
    id: Bytes<32>;              // Private user identifier
    metadataHash: Bytes<32>;    // Hash of private collateral data
    hFactor: Uint<4>;          // Health factor (1-15 scale)
    position: CollateralPosition // Current position status
}

struct Staker {
    id: Bytes<32>;                    // Private staker identifier
    address: ZswapCoinPublicKey;      // Public key for rewards
    stakeAmount: Uint<128>;           // Amount of sUSD staked
    entry_ADA_SUSD_index: Uint<128>;  // Entry point for reward calculation
    pending_ADA: Uint<128>            // Accumulated pending rewards
}

struct MintMetadata {
    depositId: Bytes<32>;    // Unique deposit identifier
    collateral: Uint<64>;    // Amount of ADA collateral (private)
    amountMinted: Uint<64>   // Amount of sUSD minted (private)
}
```

### Global State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `mintCounter` | Counter | Tracks total number of mint operations |
| `totalMint` | Uint<128> | Total sUSD tokens minted |
| `admin` | ZswapCoinPublicKey | Contract administrator |
| `liquidationThreshold` | Uint<8> | Liquidation threshold percentage (default: 80%) |
| `validAssetCoinType` | Bytes<32> | Valid collateral asset type (ADA) |
| `stakePoolTotal` | QualifiedCoinInfo | Total sUSD in stability pool |
| `reservePoolTotal` | QualifiedCoinInfo | Total ADA in reserve pool |
| `nonce` | Bytes<32> | Cryptographic nonce for token minting |
| `sUSDTokenType` | Bytes<32> | sUSD token type identifier |
| `collateralDepositors` | Map<Bytes<32>, Depositor> | All depositor positions |
| `stakers` | Map<Bytes<32>, Staker> | All staker positions |
| `ADA_sUSD_index` | Uint<128> | Global index for staker rewards |

## Core Functions

### Depositor/Borrower Functions

#### `depositToCollateralPool`
```compact
export circuit depositToCollateralPool(
    coin: CoinInfo, 
    _collateralId: Bytes<32>, 
    _current_price_per_ADA: Uint<32>
): []
```

**Purpose**: Allows users to deposit ADA collateral into the reserve pool.

**Process**:
1. Validates the collateral ID is unique
2. Confirms the coin type is valid ADA
3. Retrieves private metadata using witnesses
4. Verifies collateral amount matches the USD value
5. Adds collateral to the reserve pool
6. Creates a new `Depositor` entry with `inactive` status

**Privacy**: The actual collateral amount is stored off-chain and verified through zero-knowledge proofs.

#### `mint_sUSD`
```compact
export circuit mint_sUSD(
    mint_amount: Uint<64>, 
    _collateralId: Bytes<32>
): []
```

**Purpose**: Allows depositors to mint sUSD tokens against their collateral.

**Process**:
1. Verifies the caller owns the collateral position
2. Reconstructs and validates private metadata
3. Calculates health factor: `(collateral × liquidationThreshold) / (mintAmount × 100)`
4. Ensures health factor > 1 for safety
5. Mints sUSD tokens to the caller
6. Updates position status to `active`

**Health Factor**: Critical safety measure preventing over-leveraging.

#### `withdrawCollateral`
```compact
export circuit withdrawCollateral(
    _collateralId: Bytes<32>, 
    _amountToWithdraw: Uint<32>, 
    to: Bytes<32>
): []
```

**Purpose**: Allows users to withdraw collateral from closed or inactive positions.

**Restrictions**:
- Only available for `closed` or `inactive` positions
- Cannot withdraw from `active` or `liquidated` positions
- Must not exceed available collateral

#### `repay`
```compact
export circuit repay(
    coin: CoinInfo, 
    _collateralId: Bytes<32>, 
    _amountToRepay: Uint<32>
): []
```

**Purpose**: Allows borrowers to repay their sUSD debt.

**Process**:
1. Validates the caller owns the position
2. Confirms the position is `active`
3. Burns the repaid sUSD tokens
4. Updates the debt balance
5. Changes position to `closed` if fully repaid

### Staker Functions

#### `depositToStabilityPool`
```compact
export circuit depositToStabilityPool(coin: CoinInfo): []
```

**Purpose**: Allows users to stake sUSD tokens in the stability pool.

**Benefits**:
- Earns rewards from liquidations
- Helps maintain protocol stability
- Provides liquidity for debt coverage

#### `checkStakeReward`
```compact
export circuit checkStakeReward(): [Uint<128>, Staker]
```

**Purpose**: Calculates accumulated staking rewards.

**Formula**: 
```
earned_ADA = user_sUSD × (current_ADA_per_sUSD - user_entry_ADA_per_sUSD) + pending_balance
```

#### `withdrawStakeReward`
```compact
export circuit withdrawStakeReward(_amount: Uint<128>): []
```

**Purpose**: Allows stakers to withdraw their earned ADA rewards.

### Liquidation System

#### `liquidateCollateralPosition`
```compact
export circuit liquidateCollateralPosition(
    _collateralAmt: Uint<64>, 
    _collateralId: Bytes<32>, 
    _debtAmountMinted: Uint<64>,
    _currentHFactor: Uint<4>
): []
```

**Purpose**: Liquidates unhealthy positions (health factor < 1).

**Process**:
1. Burns equivalent sUSD from the stability pool
2. Updates the global ADA/sUSD index for reward distribution
3. Marks the position as `liquidated`

**Automation**: Designed to be called by off-chain monitoring systems.

## Privacy Features

### Witness Functions
The contract leverages Midnight's witness system for privacy:

- `secrete_key()`: Returns user's private key for ID generation
- `get_mintmetadata_private_state()`: Retrieves private collateral data
- `division()`: Performs private arithmetic operations

### Data Shielding
- Collateral amounts are never stored on-chain
- Debt positions remain private
- Only cryptographic hashes and commitments are public

## Security Measures

### Access Control
- User ID generation: `persistentHash(["susd:user", hash(secretKey, contractAddress)])`
- Metadata validation through cryptographic hashes
- Position ownership verification

### Economic Safety
- **Liquidation Threshold**: Default 80% prevents under-collateralization
- **Health Factor Monitoring**: Continuous assessment of position safety
- **Over-Collateralization**: Requires >100% collateral ratio

### Technical Safeguards
- Input validation on all parameters
- State consistency checks
- Atomic operations for fund transfers

## Usage Examples

### For Depositors
1. **Deposit Collateral**: Call `depositToCollateralPool` with ADA
2. **Mint sUSD**: Call `mint_sUSD` to borrow against collateral
3. **Monitor Health**: Ensure health factor stays above 1
4. **Repay Debt**: Use `repay` to return sUSD and close position
5. **Withdraw**: Call `withdrawCollateral` to retrieve ADA

### For Stakers
1. **Stake sUSD**: Call `depositToStabilityPool`
2. **Check Rewards**: Use `checkStakeReward` to view earnings
3. **Withdraw Rewards**: Call `withdrawStakeReward` to claim ADA

## Risk Considerations

### For Users
- **Liquidation Risk**: Positions with health factor < 1 face liquidation
- **Market Risk**: ADA price volatility affects collateral value
- **Smart Contract Risk**: Potential bugs or exploits

### For Stakers
- **Impermanent Loss**: Staked sUSD may be burned during liquidations
- **Reward Volatility**: Earnings depend on liquidation frequency

## Technical Requirements

- **Blockchain**: Midnight Network
- **Language**: Compact (Midnight's smart contract language)
- **Privacy**: Zero-knowledge proofs for sensitive data
- **Indexer**: GraphQL endpoint for off-chain data queries
- Empty staker and depositor pools

---

*This documentation covers the core functionality of the Statera protocol. For implementation details and advanced usage, refer to the contract source code and Midnight blockchain documentation.*
