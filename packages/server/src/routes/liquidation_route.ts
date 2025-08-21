// routes/liquidation_route.ts
import { Request, Response, Router } from "express";
import { handleLiquidation } from "src/controllers/liquidator";
import { getStateraAPI, isWalletInitialized } from "../../lib/utils/wallet-service";

const router = Router();

router.post("/liquidate", async (req: Request, res: Response) => {
  try {
    // Check if wallet is initialized
    if (!isWalletInitialized()) {
      return res.status(503).json({ 
        error: "Service unavailable. Wallet is still initializing." 
      });
    }

    // Get the pre-initialized StateraAPI
    const stateraAPI = getStateraAPI();

    // Handle the liquidation with the initialized API
    await handleLiquidation(req, res, stateraAPI);
  } catch (error) {
    console.error("Liquidation route error:", error);
    res.status(500).json({ error: "Internal server error during liquidation" });
  }
});

export default router;