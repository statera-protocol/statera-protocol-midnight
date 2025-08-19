import mongoose from "mongoose";

enum OnchainEvent {
  Deposit = "Deposit",
  Collateral_Withdrawal = "Collateral_Withdrawal",
  Mint = "Mint",
  Stake = "Stake",
  Unstake = "Unstake",
  Repay = "Repay",
  Claim = "Claim",
  Liquidation = "Liquidation",
}

const TxBroadcastSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      require: true,
    },
    onchain_event: {
      type: OnchainEvent,
      require: true,
    },
    amount: {
      type: Number,
      require: false,
    },
    coin_type: {
      type: String,
      require: false,
    }
  },
  {
    timestamps: true,
  }
);

const TxBroadcast = mongoose.model("TxBroadcast", TxBroadcastSchema);

export default TxBroadcast;
