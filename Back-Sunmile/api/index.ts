import app from "../src/server"
import { AppDataSource } from "../src/config/data-source"

let isInitialized = false

export default async (req, res) => {
  if (!isInitialized) {
    await AppDataSource.initialize()
    isInitialized = true
  }

  return app(req, res)
}
