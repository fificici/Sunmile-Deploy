import app from '../src/server'
import { AppDataSource } from '../src/config/data-source'

export default async function handler(req: any, res: any) {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      console.log('Database initialized')
    }

    return app(req, res)
  } catch (error) {
    console.error('Error initializing database:', error)
    return res.status(500).json({ error: 'Internal Server Error'})
  }
}
