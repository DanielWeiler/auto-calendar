/**
 * This service handles the scheduling of events and determines what time an
 * event will be scheduled.
 */

import { google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import { UserMessage } from '../types'
import { addTimeToDate, assertDefined } from '../utils/helpers'
import {
  checkTimeDuration,
  findAvailability,
  findAvailabilityBeforeDeadline,
} from './availability.service'
import {
  getEndTime,
  getEventsInTimePeriod,
  parsePotentialDescription,
} from './schedule-helpers.service'
import { autoCalendarId, userTimeZone } from './sign-in.service'
const calendar = google.calendar('v3')

/**
 * Schedules an event at the time given by the user. Data about the scheduling
 * is stored in the event description. Rescheduable events occuring during this
 * event will be rescheduled to a sutiable time.
 * @param {string} summary - The summary of an event.
 * @param {string} manualDate - The date of an event.
 * @param {string} manualTime - The time of an event.
 * @param {number} durationNumber - The duration of an event.
 * @param {string} eventId - The ID of an event.
 * @returns {UserMessage} Returns an object containing details about
 * the message that will be provided to the user about the results of
 * scheduling the event.
 */
export async function manualSchedule(
  summary: string,
  manualDate: string,
  manualTime: string,
  durationNumber: number,
  eventId = ''
): Promise<UserMessage> {
  const userMessage: UserMessage = {
    eventBeingScheduled: 'Manually scheduled',
    conflictingEvents: '',
  }

  const startDateTime = addTimeToDate(manualTime, manualDate)
  const endDateTime = getEndTime(startDateTime, durationNumber)
  const description = 'Manually scheduled'

  await scheduleEvent(summary, startDateTime, endDateTime, description, eventId)
  userMessage.conflictingEvents = await rescheduleConflictingEvents(
    startDateTime,
    endDateTime,
    summary
  )

  return userMessage
}

/**
 * Schedules an event according to calendar availability. The start time of the
 * event is found according to the <deadline> and <minimumStartTime> variables.
 * @param {string} summary - The summary of an event.
 * @param {number} durationNumber - The duration of an event.
 * @param {Date | null} deadline - The possible deadline of an event.
 * @param {string} schedulingSettings - Data of the preferences about the
 * event's scheduling, such as a minimum start time and/or a deadline.
 * @param {Date | null} minimumStartTime - The possible minimum start time of an event.
 * @param {string} eventId - The ID of an event.
 * @returns {UserMessage} Returns an object containing details about
 * the message that will be provided to the user about the results of
 * scheduling the event.
 */
export async function autoSchedule(
  summary: string,
  durationNumber: number,
  deadline: Date | null = null,
  schedulingSettings = '',
  minimumStartTime: Date | null = null,
  eventId = ''
): Promise<UserMessage> {
  let userMessage: UserMessage = {
    eventBeingScheduled: '',
    conflictingEvents: '',
  }

  const startDateTime = await findAvailability(
    durationNumber,
    deadline,
    minimumStartTime
  )

  // If an available time could be found, the event is scheduled.
  if (startDateTime) {
    const endDateTime = getEndTime(startDateTime, durationNumber)
    // It must be checked if the available time is before the event deadline
    if (deadline) {
      // If the available time found on the day of the deadline is past the
      // time of the deadline, a high priority available time is queried for
      // the event before it's deadline.
      if (endDateTime > deadline) {
        userMessage = await findAvailabilityBeforeDeadline(
          durationNumber,
          deadline,
          minimumStartTime,
          summary,
          schedulingSettings,
          eventId
        )
      } else {
        await scheduleEvent(
          summary,
          startDateTime,
          endDateTime,
          schedulingSettings,
          eventId
        )
        userMessage.eventBeingScheduled = startDateTime.toString()
      }
    } else {
      await scheduleEvent(
        summary,
        startDateTime,
        endDateTime,
        schedulingSettings,
        eventId
      )
      userMessage.eventBeingScheduled = startDateTime.toString()
    }
  }
  // If not, it is because a time could not be found before the given event
  // deadline and a high priority available time is queried for the event
  // before it's deadline.
  else {
    assertDefined(deadline)
    userMessage = await findAvailabilityBeforeDeadline(
      durationNumber,
      deadline,
      minimumStartTime,
      summary,
      schedulingSettings,
      eventId
    )
  }

  return userMessage
}

/**
 * Schedules an event to the Google calendar the app uses. If an event ID is
 * given, the event is patched. Otherwise, a new event is scheduled.
 * @param {string} summary - The summary of the event.
 * @param {Date} startDateTime - The start time of the event.
 * @param {Date} endDateTime - The end time of the event.
 * @param {string} description - The description of the event.
 * @param {string} eventId - The ID of an event.
 */
export async function scheduleEvent(
  summary: string,
  startDateTime: Date,
  endDateTime: Date,
  description = '',
  eventId = ''
): Promise<void> {
  if (eventId) {
    await calendar.events.patch({
      auth: oAuth2Client,
      calendarId: autoCalendarId,
      eventId: eventId,
      requestBody: {
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: userTimeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: userTimeZone,
        },
      },
    })
  } else {
    await calendar.events.insert({
      auth: oAuth2Client,
      calendarId: autoCalendarId,
      requestBody: {
        summary: summary,
        colorId: '7',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: userTimeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: userTimeZone,
        },
        description: description,
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 30 }],
        },
      },
    })
  }
}

/**
 * This function is called when a manually scheduled event or a high priority
 * event is scheduled to check if there are any conflicting events that need
 * rescheduling. Any reschedulable events that create conflicts will be
 * rescheduled to a suitable time.
 * @param {Date} highPriorityEventStart - The start of the event that other
 * events may be conflicting with.
 * @param {Date} highPriorityEventEnd - The end of the event that other
 * events may be conflicting with.
 * @param {string} highPriorityEventSummary - The summary of the event that
 * other events may be conflicting with.
 * @returns {string} Returns a string, which will be used to created a
 * message for the user about the result of scheduling an event.
 */
export async function rescheduleConflictingEvents(
  highPriorityEventStart: Date,
  highPriorityEventEnd: Date,
  highPriorityEventSummary = ''
): Promise<string> {
  let conflictingEventsMessage = ''
  let deadlineIssue = false

  const conflictingEvents = await getEventsInTimePeriod(
    highPriorityEventStart,
    highPriorityEventEnd
  )

  // Length will always be at least 1 because the array contains the event
  // creating the conflict(s)
  if (conflictingEvents.length === 1) {
    return conflictingEventsMessage
  }

  for (let i = 0; i < conflictingEvents.length; i++) {
    const event = conflictingEvents[i]

    // These if statements disregard events not concerned with conflicts since
    // manually scheduled events can be scheduled at any time, regardless of
    // what else is on the calendar at that time. These events will not be
    // disregarded for auto scheduled events because auto scheduled events are
    // never scheduled over these events. This statement also skips over the
    // high priority event that created the conflict(s).
    if (event.summary === highPriorityEventSummary) {
      continue
    } else if (event.description?.includes('Manually scheduled')) {
      conflictingEventsMessage =
        'Another manually scheduled event is scheduled during this time.'
      continue
    } else if (event.description === 'Working hours') {
      conflictingEventsMessage =
        'This event was scheduled during working hours.'
      continue
    } else if (event.description === 'Unavailable hours') {
      conflictingEventsMessage =
        'This event was scheduled outside of available hours.'
      continue
    }

    assertDefined(event.summary)
    assertDefined(event.id)
    assertDefined(event.start?.dateTime)
    assertDefined(event.end?.dateTime)

    const eventStart = new Date(event.start?.dateTime)
    const eventEnd = new Date(event.end?.dateTime)
    const durationNumber = checkTimeDuration(eventStart, eventEnd)

    const { schedulingSettings, deadline, minimumStartTime } =
      parsePotentialDescription(event.description)

    // Try to reschedule the conflicting event
    const conflictingEventMessage = await autoSchedule(
      event.summary,
      durationNumber,
      deadline,
      schedulingSettings,
      minimumStartTime,
      event.id
    )

    // Check if the event was successfully rescheduled and set the corresponding
    // message
    if (
      conflictingEventMessage.eventBeingScheduled ===
      'There was no time slot available for this event before its deadline. Free some space in your calendar and try again.'
    ) {
      deadlineIssue = true
    } else {
      conflictingEventsMessage = 'Conflicting events rescheduled.'
    }
  }

  // If one or more of the conflicting events could not be rescheduled before
  // their deadline, the corresponding message is set.
  if (deadlineIssue) {
    conflictingEventsMessage =
      'One or more conflicting events could not be rescheduled before their deadline. These events were not changed.'
  }

  return conflictingEventsMessage
}
