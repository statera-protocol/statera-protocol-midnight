import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";

dotenv.config();
const app = express();
const io = new Server();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(express.json());

app.get("/api/v1", (req, res) => {
  res.send("Welcome ot statera v1 API");
});

io.on("connected", (socket) => {
    socket.on
})

app.listen(PORT, (error) => {
  console.log(`Server Listening at ${PORT}`);
});
