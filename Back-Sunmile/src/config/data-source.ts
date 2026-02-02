import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

import { User } from '../models/User'
import { Professional } from '../models/Professional'
import { ProPost } from '../models/ProPost'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  synchronize: process.env.NODE_ENV !== 'production',
  logging: true,

  entities: [User, Professional, ProPost],
})
