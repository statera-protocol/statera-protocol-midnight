// server.ts (your main server file)
import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import liquidationRouter from "./routes/liquidation_route.js";
import { initializeWalletAndAPI } from "../lib/utils/wallet-service.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());
app.use("/api/v1", liquidationRouter);

app.get("/api/v1", (req, res) => {
  res.send("Welcome to statera v1 API");
});

// Initialize wallet and API before starting the server
async function startServer() {
  try {
    console.log("Initializing wallet and Statera API...");
    await initializeWalletAndAPI();
    console.log("Wallet and API initialized successfully");
    
    app.listen(PORT, () => {
      console.log(`Server Listening at ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

startServer();