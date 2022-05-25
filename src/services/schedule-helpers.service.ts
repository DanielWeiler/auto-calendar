/**
 * This service aids in performing scheduling operations.
 */

import { calendar_v3, google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import { DescriptionInfo, UserMessage } from '../types'
import { assertDefined, autoCalendarId, userTimeZone } from '../utils/helpers'
const calendar = google.calendar('v3')

/**
 * Finds the end time of an event by adding the duration of minutes of the
 * event to the start time of the event.
 * @param {Date} date - The date of an event.
 * @param {number} minutes - The duration of an event in minutes.
 * @returns {Date} Returns a date, which is the end time of an event.
 */
export function getEndTime(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

/**
 * Gets the events in the given time period.
 * @param {Date} queryStartTime - The start time of the time period.
 * @param {Date} queryEndTime - The end time of the time period.
 * @returns {calendar_v3.Schema$Event[]} Returns a list of event objects.
 */
export async function getEventsInTimePeriod(
  queryStartTime: Date,
  queryEndTime: Date
): Promise<calendar_v3.Schema$Event[]> {
  const eventsList = await calendar.events.list({
    auth: oAuth2Client,
    calendarId: autoCalendarId,
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: queryStartTime.toISOString(),
    timeMax: queryEndTime.toISOString(),
    timeZone: userTimeZone,
  })
  assertDefined(eventsList.data.items)

  return eventsList.data.items
}

/**
 * Converts the message for the user from an object to a string
 * @param {UserMessage} userMessage - An object containing details about the
 * message that will be provided to the user about the results of scheduling
 * the event.
 * @returns {string} Returns a message that will be provided to the
 * user about the results of scheduling the event.
 */
export function convertMessageToString(userMessage: UserMessage): string {
  let messageString = ''
  if (
    userMessage.eventBeingScheduled !==
      'There was no time slot available for this event before its deadline. Free some space in your calendar and try again.' &&
    userMessage.eventBeingScheduled !== 'Manually scheduled'
  ) {
    const dateString = new Date(
      userMessage.eventBeingScheduled
    ).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: userTimeZone,
    })
    const timeString = new Date(
      userMessage.eventBeingScheduled
    ).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimeZone,
    })

    messageString = `Scheduled on ${dateString} at ${timeString}. 
      ${userMessage.conflictingEvents}`
  } else {
    messageString =
      userMessage.eventBeingScheduled + userMessage.conflictingEvents
  }

  return messageString
}

/**
 * Parses info in the description of an event, if the description exists. If an
 * event has a deadline or a minimumStartTime, they are stored in the
 * description.
 * @param {string | null | undefined} description - The description of the
 * event.
 * @returns {DescriptionInfo} Returns empty values, or, if this info exists,
 * returns the schedulingSettings, (which is the description storing a possible
 * deadline and a possible minimum start time), the deadline, and the
 * minimumStartTime.
 */
export function parsePotentialDescription(
  description: string | null | undefined
): DescriptionInfo {
  let schedulingSettings = undefined
  let deadline = null
  let minimumStartTime = null
  if (description) {
    schedulingSettings = description
    if (
      description.includes('Deadline') &&
      description.includes('Minimum start time')
    ) {
      const deadlineInfo = description.split('|')
      deadline = new Date(deadlineInfo[0])
      minimumStartTime = new Date(deadlineInfo[1])
    } else if (description.includes('Deadline')) {
      deadline = new Date(description)
    } else if (description.includes('Minimum start time')) {
      minimumStartTime = new Date(description)
    }
  }

  return { schedulingSettings, deadline, minimumStartTime }
}

/**
 * Updates an event's description, which affects how the event is effected when
 * it is rescheduled or when other events are scheduled on top of it. The
 * description stores information on the scheduling settings of the event.
 * @param {string} eventId - The ID of an event.
 * @param {Date} rescheduleTimeDate - The time an event will be rescheduled to
 * or thereafter.
 * @param {boolean} flexible - Determines whether the event will be rescheduled
 * at the selected time or after the selected time depending on availability.
 * @param {Date | null} deadline - The deadline of an event.
 * @param {string | undefined} description - The description of an event
 * containing info on its deadline or if it was manually scheduled.
 */
export async function updateDescription(
  eventId: string,
  rescheduleTimeDate: Date,
  flexible: boolean,
  deadline: Date | null,
  description: string | undefined
): Promise<void> {
  if (deadline) {
    // Check if the time selected for the reschedule is after the event's
    // deadline. If it is, the description storing the deadline will be
    // modified.
    if (rescheduleTimeDate > deadline) {
      if (flexible) {
        // The deadline will be deleted and the reschedule time will be stored
        // in the description to be referenced as a minimum start time.
        await calendar.events.patch({
          auth: oAuth2Client,
          calendarId: autoCalendarId,
          eventId: eventId,
          requestBody: {
            description: `Minimum start time: ${rescheduleTimeDate}`,
          },
        })
      } else {
        // The deadline will be deleted but the description will be modified
        // so the event will not be able to be rescheduled if it conflicts
        // with another event.
        await calendar.events.patch({
          auth: oAuth2Client,
          calendarId: autoCalendarId,
          eventId: eventId,
          requestBody: {
            description: 'Manually scheduled',
          },
        })
      }
    } else {
      if (flexible) {
        // The description will be modified so the event will be able to be
        // rescheduled if another event is scheduled on top of it. The
        // reschedule time will be stored in the description to be referenced
        // as a minimum start time.
        await calendar.events.patch({
          auth: oAuth2Client,
          calendarId: autoCalendarId,
          eventId: eventId,
          requestBody: {
            description: `Deadline: ${deadline} | Minimum start time: ${rescheduleTimeDate}`,
          },
        })
      } else {
        // The description will be modified so the event will not be able to be
        // rescheduled if it conflicts with another event.
        await calendar.events.patch({
          auth: oAuth2Client,
          calendarId: autoCalendarId,
          eventId: eventId,
          requestBody: {
            description: 'Manually scheduled - ' + description,
          },
        })
      }
    }
  } else {
    if (description === 'Manually scheduled') {
      if (flexible) {
        // The description will be modified so the event will be able to be
        // rescheduled if another event is scheduled on top of it. The
        // reschedule time will be stored in the description to be referenced
        // as a minimum start time.
        await calendar.events.patch({
          auth: oAuth2Client,
          calendarId: autoCalendarId,
          eventId: eventId,
          requestBody: {
            description: `Minimum start time: ${rescheduleTimeDate}`,
          },
        })
      }
    } else {
      // This event will not have a deadline and will not have been manually
      // scheduled.
      if (flexible) {
        // The reschedule time will be stored in the description to be
        // referenced as a minimum start time.
        await calendar.events.patch({
          auth: oAuth2Client,
          calendarId: autoCalendarId,
          eventId: eventId,
          requestBody: {
            description: `Minimum start time: ${rescheduleTimeDate}`,
          },
        })
      } else {
        // A description will be added so the event will not be able to be
        // rescheduled if it conflicts with another event.
        await calendar.events.patch({
          auth: oAuth2Client,
          calendarId: autoCalendarId,
          eventId: eventId,
          requestBody: {
            description: 'Manually scheduled',
          },
        })
      }
    }
  }
}
