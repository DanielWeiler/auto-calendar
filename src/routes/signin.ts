import express from 'express'
require('express-async-errors')
import { SignInRequest } from '../types'
import oAuth2Client from '../utils/authorization'
import { assertDefined } from '../utils/helpers'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import RefreshTokenModel from '../models/refresh_token'

export const router = express.Router()

export let signedInUser: string | undefined = ''

router.post('/', (req: SignInRequest, _res) => {
  void (async () => {
    const { code } = req.body
    const { tokens } = await oAuth2Client.getToken(code)

    // According to the Google OAuth 2.0 documentation, the "sub" field of the
    // ID token is the unique-identifier key for Google users.
    assertDefined(tokens.id_token)
    const jwtObject = jwtDecode<JwtPayload>(tokens.id_token)
    signedInUser = jwtObject.sub

    // The refresh token of a user needs to be saved for authorization of
    // actions of a user. It is only given when a new one is needed.
    console.log('refresh token:')
    tokens.refresh_token
      ? console.log('--> GIVEN')
      : console.log('--> NOT GIVEN')

    if (tokens.refresh_token !== undefined) {
      await RefreshTokenModel.find({ user: signedInUser }).deleteOne()
      console.log('any old refresh token deleted')

      await new RefreshTokenModel({
        refreshToken: tokens.refresh_token,
        user: signedInUser,
      }).save()
      console.log('new refresh token saved')
    }
  })()
})
