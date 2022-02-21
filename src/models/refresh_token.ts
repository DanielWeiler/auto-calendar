import mongoose from 'mongoose'

interface RefreshToken {
  refreshToken: string
  user: string
}

const refreshTokenSchema = new mongoose.Schema<RefreshToken>({
  refreshToken: String,
  user: String,
})

const RefreshTokenModel = mongoose.model<RefreshToken>(
  'RefreshToken',
  refreshTokenSchema
)

export default RefreshTokenModel
