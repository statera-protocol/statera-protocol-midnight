import {
  APIResponse,
  DeployedStateraAPI,
  LiquidationPayload,
} from "../../lib/utils/statera-liquidation-api";
import { Request, Response } from "express";


export async function handleLiquidation(
  req: Request,
  res: Response,
  currentStateraApi: DeployedStateraAPI,
) {
  const { id, debt, collateral_amount } = req.body;
  try {
    const result = await currentStateraApi.liquidatePosition({
      id,
      debt,
      collateral_amount
    } );

    if (result.public.status === "SucceedEntirely") {
      const txResponse: APIResponse<LiquidationPayload> = {
        message: "Liquidation succeeded",
        data: {
          collateral_amount,
          debt,
          id,
        },
      };
      res.status(200).send(txResponse);
      return txResponse;
    } else {
      const errorResponse: APIResponse<LiquidationPayload> = {
        message: "Liquidation failed",
      };
      res.status(400).send(errorResponse);
      return errorResponse;
    }
  } catch (error) {
      res.status(500).send("Internal Server Error");
      const errorMessage = error instanceof Error ? error.message : "Liquidation Failed";
      console.error(errorMessage);
  }
}
