import mongoose from 'mongoose'
import { RefreshToken } from '../types'

const refreshTokenSchema = new mongoose.Schema<RefreshToken>({
  refreshToken: String,
  user: String,
})

const RefreshTokenModel = mongoose.model<RefreshToken>(
  'RefreshToken',
  refreshTokenSchema
)

export default RefreshTokenModel
