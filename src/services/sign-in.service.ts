import jwtDecode, { JwtPayload } from 'jwt-decode'
import RefreshTokenModel from '../models/refresh_token'
import { SignInData } from '../types'
import oAuth2Client from '../configs/google-client.config'
import { assertDefined } from '../utils/helpers'
require('express-async-errors')

async function signIn(data: SignInData): Promise<void> {
  const { code } = data
  const { tokens } = await oAuth2Client.getToken(code)

  // According to the Google OAuth 2.0 documentation, the "sub" field of the
  // ID token is the unique-identifier key for Google users.
  assertDefined(tokens.id_token)
  const jwtObject = jwtDecode<JwtPayload>(tokens.id_token)
  const signedInUser = jwtObject.sub
  assertDefined(signedInUser)

  // The refresh token of a user needs to be saved for authorization of
  // actions of a user. It is only given when a new one is needed.
  console.log('Signed in!')
  if (tokens.refresh_token !== undefined) {
    await RefreshTokenModel.find({ user: signedInUser }).deleteOne()
    console.log('Any old refresh token deleted')

    await new RefreshTokenModel({
      refreshToken: tokens.refresh_token,
      user: signedInUser,
    }).save()
    console.log('New refresh token saved')
  }

  const query = await RefreshTokenModel.find({ user: signedInUser })
  const refreshToken = query[0].refreshToken
  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  })
}

export default { signIn }
