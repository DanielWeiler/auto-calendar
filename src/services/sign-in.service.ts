/**
 * This service handles signing in the user and initializing Auto Calendar for
 * their Google account. The calendar used by the app will be created on their
 * first sign in and the calendar ID and user time zone variables will be
 * initialized to be used with the Google Calendar API in the app.
 */

import { google } from 'googleapis'
import jwtDecode, { JwtPayload } from 'jwt-decode'
import oAuth2Client from '../configs/google-client.config'
import RefreshTokenModel from '../models/refresh_token'
import { assertDefined, setUserInfo, userTimeZone } from '../utils/helpers'
require('express-async-errors')
const calendar = google.calendar('v3')

/**
 * Signs in the user with Google sign in. A database is checked for a user's
 * refresh token. If there is no refresh token, the newly given refresh token
 * is saved to the database. On the first sign in, the Google calendar used
 * by the app is created on the user's account.
 * @param {string} code - The data recieved from the frontend to sign in.
 * @returns {string} Returns the identifier of the user to be used for API
 * requests.
 */
async function signIn(code: string): Promise<string> {
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

  // Initialize the calendar used by the app
  await createAutoCalendar(signedInUser)

  return signedInUser
}

/**
 * Creates the Google calendar used by the app.
 * @param {string} user - The identifier of the user making the request.
 */
async function createAutoCalendar(user: string): Promise<void> {
  await setUserInfo(user)
  const calendars = await calendar.calendarList.list({
    auth: oAuth2Client,
  })
  assertDefined(calendars.data.items)

  // Checks if the calendar has already been created
  let calendarCreated = false
  for (let i = 0; i < calendars.data.items.length; i++) {
    const calendar = calendars.data.items[i]
    if (calendar.summary === 'Auto Calendar') {
      calendarCreated = true
    }
  }

  if (!calendarCreated) {
    await calendar.calendars.insert({
      auth: oAuth2Client,
      requestBody: {
        summary: 'Auto Calendar',
        timeZone: userTimeZone,
      },
    })
  }
}

export default { signIn }
