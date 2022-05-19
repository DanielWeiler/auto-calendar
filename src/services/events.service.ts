/**
 * This service handles all operations with regular events (excluding weekly
 * hours events) that are directly called by the events.controller. These
 * operations include getting, creating, rescheduling, and deleting events.
 */

import { google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import {
  EventDisplayData,
  EventFormData,
  RescheduleData,
  UserMessage,
} from '../types'
import { addTimeToDate, assertDefined } from '../utils/helpers'
import {
  convertMessageToString,
  updateDescription,
} from './schedule-helpers.service'
import { autoSchedule, manualSchedule } from './schedule.service'
import { autoCalendarId, userTimeZone } from './sign-in.service'
require('express-async-errors')
const calendar = google.calendar('v3')

/**
 * Gets the events from Google Calendar to be displayed in the app. The
 * calendar ID used by the app and the time zone of the user are also
 * initialized in this function.
 * @returns {EventDisplayData[]} Returns a list of event objects.
 */
async function getEvents(): Promise<EventDisplayData[]> {
  // Get the date 12 months from now
  const timeMax = new Date(new Date().setMonth(new Date().getMonth() + 12))

  // Gets the events from Google Calendar
  const events = await calendar.events.list({
    auth: oAuth2Client,
    calendarId: autoCalendarId,
    singleEvents: true,
    timeMax: timeMax.toISOString(),
    maxResults: 2500,
  })
  assertDefined(events.data.items)

  // Add colors and display options to the events
  const eventsData: EventDisplayData[] = []
  events.data.items.map((event) => {
    assertDefined(event.id)
    let color = 'LightSkyBlue'
    let display = 'auto'
    if (event.description === 'Unavailable hours') {
      color = 'Black'
      display = 'background'
      event.summary = 'UH'
    } else if (event.description === 'Working hours') {
      color = 'rgb(239 223 192)'
    } else if (event.description?.includes('Manually scheduled')) {
      color = 'rgb(243 210 50 / 93%)'
    } else if (event.description?.includes('Deadline')) {
      color = 'RoyalBlue'
    }

    const eventData: EventDisplayData = {
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime,
      end: event.end?.dateTime,
      extendedProps: { description: event.description },
      backgroundColor: color,
      display: display,
    }
    eventsData.push(eventData)
  })

  return eventsData
}

/**
 * Uses the data from the event form to decide if a manual or an auto event
 * should be scheduled. Creates a <schedulingSettings> string, which stores
 * preferences about the event's scheduling, such as a minimum start time
 * and/or a deadline.
 * @param {EventFormData} data - The data recieved from the frontend to
 * create the event.
 * @returns {string} Returns a string, which provides the user with a
 * message on the result of scheduling the event.
 */
async function createEvent(data: EventFormData): Promise<string> {
  const {
    summary,
    duration,
    manualDate,
    manualTime,
    minimumStartDate,
    minimumStartTime,
    deadlineDate,
    deadlineTime,
  } = data
  const durationNumber = parseInt(duration)

  let userMessage: UserMessage

  if (manualDate && manualTime) {
    userMessage = await manualSchedule(
      summary,
      manualDate,
      manualTime,
      durationNumber
    )
  } else {
    let minimumStart = null
    let deadline = null
    let schedulingSettings = ''

    if (minimumStartDate && minimumStartTime) {
      minimumStart = addTimeToDate(minimumStartTime, minimumStartDate)
    }
    if (deadlineDate && deadlineTime) {
      deadline = addTimeToDate(deadlineTime, deadlineDate)
    }

    if (minimumStartDate && minimumStartTime && deadlineDate && deadlineTime) {
      schedulingSettings = `Deadline: ${deadline} | Minimum start time: ${minimumStart}`
    } else if (minimumStartDate && minimumStartTime) {
      schedulingSettings = `Minimum start time: ${minimumStart}`
    } else if (deadlineDate && deadlineTime) {
      schedulingSettings = `Deadline: ${deadline}`
    }

    userMessage = await autoSchedule(
      summary,
      durationNumber,
      deadline,
      schedulingSettings,
      minimumStart
    )
  }

  const messageString = convertMessageToString(userMessage)

  return messageString
}

/**
 * Reschedules an event. Depending on the reschedule settings chosen by the
 * user, the event is scheduled at the set time or at the next open time slot
 * after the set time. The description of the event is also updated
 * to handle effects of rescheduling.
 * @param {RescheduleData} data - The data recieved from the frontend to
 * reschedule the event.
 * @returns {string} Returns a string to be set as a message to the
 * user with information on the result of the scheduling.
 */
async function rescheduleEvent(data: RescheduleData): Promise<string> {
  const {
    flexible,
    eventId,
    rescheduleTime,
    summary,
    duration,
    description,
    deadline,
  } = data
  const rescheduleTimeDate = new Date(rescheduleTime)
  let deadlineDate = null
  if (deadline) {
    deadlineDate = new Date(deadline)
  }

  await updateDescription(
    eventId,
    rescheduleTimeDate,
    flexible,
    deadlineDate,
    description
  )

  let userMessage: UserMessage

  if (flexible) {
    userMessage = await autoSchedule(
      summary,
      duration,
      deadlineDate,
      description,
      rescheduleTimeDate,
      eventId
    )
  } else {
    userMessage = await manualSchedule(
      summary,
      rescheduleTimeDate.toLocaleDateString(undefined, {
        timeZone: userTimeZone,
      }),
      rescheduleTimeDate.toLocaleTimeString(undefined, {
        timeZone: userTimeZone,
        hour12: false,
      }),
      duration,
      eventId
    )
  }

  const messageString = convertMessageToString(userMessage)

  return messageString
}

/**
 * Deletes an event from the Google calendar the app uses.
 * @param {string} eventId - The ID of an event.
 */
export async function deleteEvent(eventId: string): Promise<void> {
  await calendar.events.delete({
    auth: oAuth2Client,
    calendarId: autoCalendarId,
    eventId: eventId,
  })
}

export default {
  getEvents,
  createEvent,
  deleteEvent,
  rescheduleEvent,
}
