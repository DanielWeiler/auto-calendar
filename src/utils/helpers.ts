import { google } from 'googleapis'
import moment from 'moment-timezone'
import oAuth2Client from '../configs/google-client.config'
import RefreshTokenModel from '../models/refresh_token'
const calendar = google.calendar('v3')

export let autoCalendarId = ''
export let userTimeZone = ''

/**
 * Sets the necessary info for a Google Calendar API request. The refresh token
 * of the user is set to the app's authorization. Also, the ID of the user's
 * Google calendar used by the app and the time zone of the user are stored
 * into variables to be used within the backend.
 * @param {string} user - The identifier of the user making requests.
 */
export async function setUserInfo(user: string): Promise<void> {
  const query = await RefreshTokenModel.find({ user: user })
  const refreshToken = query[0].refreshToken
  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  autoCalendarId = await getAutoCalendarId()
  userTimeZone = await getUserTimeZone()
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

/**
 * Adds the given time to the given date.
 * @param {string} time - A time in the format "hh:mm"
 * @param {Date | string} date - A Date object or a string representing a Date
 * object
 * @returns {Date} Returns the new Date object.
 */
export function addTimeToDate(time: string, date: Date | string): Date {
  // Sets the time to the date
  const dateTimeUTC = new Date(date)
  const t = parseTime(time)
  dateTimeUTC.setHours(t.hours, t.minutes)

  // Sets the user's time zone to the date
  const dateTimeWithTimeZone = setLocalTimeZone(dateTimeUTC)

  return dateTimeWithTimeZone
}

/**
 * Parses the given time string into hours and minutes.
 * @param {string} time - A time in the format "hh:mm"
 * @returns {{ hours: number; minutes: number }} Returns an object containing
 * the hours and minutes of the given time.
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const h = time.split(':')[0]
  const m = time.split(':')[1]

  const hours = Number(h)
  const minutes = Number(m)
  const t = { hours, minutes }

  return t
}

/**
 * Asserts that the given value is not null or undefined. If the value is
 * indeed null or undefined then it throws an error.
 * @param {T | null | undefined} value -
 */
export function assertDefined<T>(
  value: T | null | undefined
): asserts value is T {
  if (value == null) {
    throw new Error(`Fatal error: value ${value} must not be null/undefined.`)
  }
}

/**
 * Gets the next day of the week in the current week or the next week,
 * whichever is first.
 * @param {string} dayName - The name of the day of the week being searched for
 * @param {boolean} excludeToday - Whether the current day is included in the
 * search
 * @param {Date} refDate - The date from which the search begins
 * @returns {Date} The date of the next day of the week that is found
 */
export function getNextDayOfTheWeek(
  dayName: string,
  excludeToday = false,
  refDate = new Date()
): Date {
  const dayOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].indexOf(
    dayName.slice(0, 2)
  )
  refDate.setHours(0, 0, 0, 0)
  refDate.setDate(
    refDate.getDate() +
      +!!excludeToday +
      ((dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7)
  )
  return refDate
}

/**
 * Sets the user's time zone to the date without changing the value of the
 * date.
 * @param {Date} dateTime - A Date object
 * @returns {Date} Returns a new Date object with the user's time zone.
 */
export function setLocalTimeZone(dateTime: Date): Date {
  const dateTimeWithTimeZone = moment(dateTime.toISOString())
    .parseZone()
    .tz(userTimeZone, true)
    .toDate()

  return dateTimeWithTimeZone
}
