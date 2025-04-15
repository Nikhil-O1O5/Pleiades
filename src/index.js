import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDb } from "./utils/connectDb.js";
import userRouter from "./routes/userRoute.js";
import eventRouter from "./routes/eventRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/user", userRouter);
app.use("/api/event", eventRouter);

const startServer = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`App is listening on PORT ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  }
};

startServer();
