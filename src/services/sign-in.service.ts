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
import { assertDefined } from '../utils/helpers'
require('express-async-errors')
const calendar = google.calendar('v3')

export let autoCalendarId = ''
export let userTimeZone = ''

/**
 * Signs in the user with Google sign in. A database is checked for a user's
 * refresh token. If there is no refresh token, the newly given refresh token
 * is saved to the database. On following sign in's, the refresh token is
 * retrieved from the database. On the first sign in, the Google calendar used
 * by the app is created on the user's account.
 * @param {string} code - The data recieved from the frontend to sign in.
 */
async function signIn(code: string): Promise<void> {
  console.log('Authenticating')
  const { tokens } = await oAuth2Client.getToken(code)
  console.log('Authentication complete')

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

  // Get the user's time zone from their primary calendar
  userTimeZone = await getUserTimeZone()

  // Initialize the calendar used by the app
  await createAutoCalendar()

  // Initialize the calendar ID variable
  autoCalendarId = await getAutoCalendarId()
}

/**
 * Gets the time zone of the user's calendar.
 * @returns {string} Returns a string that is the time zone's name.
 */
 async function getUserTimeZone(): Promise<string> {
  const cal = await calendar.calendars.get({
    auth: oAuth2Client,
    calendarId: 'primary',
  })
  assertDefined(cal.data.timeZone)

  return cal.data.timeZone
}

/**
 * Creates the Google calendar used by the app.
 */
async function createAutoCalendar(): Promise<void> {
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
        timeZone: userTimeZone
      },
    })
  }
}

/**
 * Gets the ID of the Google calendar the app uses.
 * @returns {string} Returns a string that is the calendar ID.
 */
async function getAutoCalendarId(): Promise<string> {
  const calendars = await calendar.calendarList.list({
    auth: oAuth2Client,
  })
  assertDefined(calendars.data.items)

  let autoCalendarId = null
  for (let i = 0; i < calendars.data.items.length; i++) {
    const calendar = calendars.data.items[i]
    if (calendar.summary === 'Auto Calendar') {
      autoCalendarId = calendar.id
      break
    }
  }
  assertDefined(autoCalendarId)

  return autoCalendarId
}

export default { signIn }
