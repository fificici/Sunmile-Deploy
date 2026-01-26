import { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/server'
import { AppDataSource } from '../src/config/data-source'

let isInitialized = false

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {

    if (!isInitialized) {
      await AppDataSource.initialize()
      isInitialized = true
      console.log('Database initialized successfully')
    }
    
    app(req as any, res as any)
    
  } catch (error) {
    console.error('Error in handler:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
