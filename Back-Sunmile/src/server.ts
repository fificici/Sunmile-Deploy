import express, { Application } from "express"
import authRoutes from "./routes/authRoutes"
import userRoutes from "./routes/userRoutes"
import professionalRoutes from "./routes/professionalRoutes"
import proPostRoutes from "./routes/proPostRoutes"
import * as dotenv from "dotenv"
import cors from "cors"

dotenv.config()

const app: Application = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({
  origin: "https://sunmile.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use("/sunmile", authRoutes)
app.use("/sunmile", userRoutes)
app.use("/sunmile", professionalRoutes)
app.use("/sunmile", proPostRoutes)

export default app
