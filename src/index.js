import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import { connectDb } from "./utils/connectDb.js"
import userRouter from "./routes/userRoute.js"
import eventRouter from "./routes/eventRoute.js";

dotenv.config()

const app = express();
const PORT = process.env.PORT || 8000

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true               
}))

app.use("/api/user",userRouter);
app.use("/api/event",eventRouter);


app.listen(PORT,()=>{
  connectDb();
  console.log(`App is listening on PORT ${PORT}`)
})