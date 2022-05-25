/**
 * This service queries the busy times that are used to find availability when
 * scheduling auto events.
 */

import { calendar_v3, google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import { assertDefined, autoCalendarId, userTimeZone } from '../utils/helpers'
import { getEventsInTimePeriod } from './schedule-helpers.service'
const calendar = google.calendar('v3')

/**
 * Gets a list of the high priority events during the given query time.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @returns {calendar_v3.Schema$Event[]} Returns a list of high
 * priority event objects.
 */
export async function getHighPriorityEvents(
  queryStartTime: Date,
  queryEndTime: Date
): Promise<calendar_v3.Schema$Event[]> {
  const events = await getEventsInTimePeriod(queryStartTime, queryEndTime)

  const highPriorityEvents = []
  for (let i = 0; i < events.length; i++) {
    const event = events[i]

    // Check if there is anything in the description that would make the event
    // a high priority event.
    if (event.description) {
      if (
        event.description.includes('Unavailable hours') ||
        event.description.includes('Working hours') ||
        event.description.includes('Manually scheduled') ||
        event.description.includes('Deadline')
      ) {
        highPriorityEvents.push(event)
      }
    }
  }

  return highPriorityEvents
}

/**
 * Gets a list of all the busy times during the given query time.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @returns {calendar_v3.Schema$TimePeriod[]} Returns a list of busy
 * time objects.
 */
export async function getAllBusyTimes(
  queryStartTime: Date,
  queryEndTime: Date
): Promise<calendar_v3.Schema$TimePeriod[]> {
  const availabilityQuery = await calendar.freebusy.query({
    auth: oAuth2Client,
    requestBody: {
      timeMin: queryStartTime.toISOString(),
      timeMax: queryEndTime.toISOString(),
      timeZone: userTimeZone,
      items: [
        {
          id: autoCalendarId,
        },
      ],
    },
  })
  assertDefined(availabilityQuery.data.calendars)

  const busyTimes = availabilityQuery.data.calendars[autoCalendarId].busy
  assertDefined(busyTimes)

  return busyTimes
}
