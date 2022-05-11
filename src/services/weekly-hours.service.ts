/**
 * This service handles all operations to set the unavailable hours and working
 * hours of the user. These operations include scheduling the weekly events
 * that represent these hours and handling changing of these hours, which
 * requires deleting the previously set hours and rescheduling conflicting
 * events with the newly set hours.
 */

import { google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import { WeeklyHoursData } from '../types'
import {
  addTimeToDate,
  assertDefined,
  getNextDayOfTheWeek,
} from '../utils/helpers'
import { deleteEvent } from './events.service'
import { getEventsInTimePeriod } from './schedule-helpers.service'
import { rescheduleConflictingEvents } from './schedule.service'
import { autoCalendarId, userTimeZone } from './sign-in.service'
const calendar = google.calendar('v3')

/**
 * Sets the unavailable hours for the calendar. Any previous unavailable hours
 * will be deleted. Any rescheduable events that occur during the new
 * unavailable hours are rescheduled to a suitable time.
 * @param {WeeklyHoursData} weeklyHours - The data of the unavailable hours set by
 * the user.
 */
async function setUnavailableHours(
  weeklyHours: WeeklyHoursData
): Promise<void> {
  await deletePreviousWeeklyHours('Unavailable hours')

  // Schedule the new unavailable hours
  Object.entries(weeklyHours.data).map(async (day) => {
    const eventName = 'Unavailable hours'
    const colorId = '8'
    const weekDay = day[0]
    const date = getNextDayOfTheWeek(weekDay)

    const startUnavailableHoursNumber = date.setHours(0, 0, 0, 0)
    const startUnavailableHours = new Date(startUnavailableHoursNumber)

    const endUnavailableHoursNumber = date.setHours(23, 59, 0, 0)
    const endUnavailableHours = new Date(endUnavailableHoursNumber)

    // Check if the day was given available hours and if not then the whole
    // day is set as unavailable
    if (day[1].startTime && day[1].endTime) {
      const startAvailableHours = addTimeToDate(day[1].startTime, date)
      const endAvailableHours = addTimeToDate(day[1].endTime, date)

      await scheduleWeeklyEvent(
        eventName,
        colorId,
        startUnavailableHours,
        startAvailableHours,
        weekDay
      )

      await scheduleWeeklyEvent(
        eventName,
        colorId,
        endAvailableHours,
        endUnavailableHours,
        weekDay
      )

      await rescheduleWeeklyHoursConflicts(
        startUnavailableHours,
        startAvailableHours
      )

      await rescheduleWeeklyHoursConflicts(
        endAvailableHours,
        endUnavailableHours
      )
    } else {
      await scheduleWeeklyEvent(
        eventName,
        colorId,
        startUnavailableHours,
        endUnavailableHours,
        weekDay
      )

      await rescheduleWeeklyHoursConflicts(
        startUnavailableHours,
        endUnavailableHours
      )
    }
  })
}

/**
 * Sets the working hours for the calendar. Any previous working hours will be
 * deleted. Any rescheduable events that occur during the new working hours are
 * rescheduled to a suitable time.
 * @param {WeeklyHoursData} weeklyHours - The data of the working hours set by
 * the user.
 */
async function setWorkingHours(weeklyHours: WeeklyHoursData): Promise<void> {
  await deletePreviousWeeklyHours('Working hours')

  // Schedule the new working hours
  Object.entries(weeklyHours.data).map(async (day) => {
    const eventName = 'Working hours'
    const colorId = '5'
    const weekDay = day[0]
    const date = getNextDayOfTheWeek(weekDay)

    // Check if the day was given working hours
    if (day[1].startTime && day[1].endTime) {
      const startWorkingHours = addTimeToDate(day[1].startTime, date)
      const endWorkingHours = addTimeToDate(day[1].endTime, date)

      await scheduleWeeklyEvent(
        eventName,
        colorId,
        startWorkingHours,
        endWorkingHours,
        weekDay
      )

      await rescheduleWeeklyHoursConflicts(startWorkingHours, endWorkingHours)
    }
  })
}

/**
 * Deletes the previous weekly hours.
 * @param {string} eventName - The name of the weekly hours event (Either
 * 'Working hours' or 'Unavailable hours').
 */
async function deletePreviousWeeklyHours(eventName: string): Promise<void> {
  const list = await getEventsInTimePeriod(
    new Date(),
    new Date(new Date().setDate(new Date().getDate() + 8)) // A week following
  )

  for (let i = 0; i < list.length; i++) {
    const event = list[i]
    if (event.description === eventName) {
      assertDefined(event.recurringEventId)
      try {
        await deleteEvent(event.recurringEventId)
      } catch (error) {
        // Catch any instances of the same recurring event that have already
        // been deleted.
        if (
          error instanceof Error &&
          error.message === 'Resource has been deleted'
        ) {
          continue
        }
      }
    }
  }
}

/**
 * Schedules a weekly event to the Google calendar the app uses. This would
 * either be working hours or unavailable hours.
 * @param {string} summary - The summary of the event.
 * @param {string} colorId - The color ID of the event.
 * @param {Date} startDateTime - The start time of the event.
 * @param {Date} endDateTime - The end time of the event.
 * @param {string} weekDay - The day of the week of the event.
 */
async function scheduleWeeklyEvent(
  summary: string,
  colorId: string,
  startDateTime: Date,
  endDateTime: Date,
  weekDay: string
): Promise<void> {
  await calendar.events.insert({
    auth: oAuth2Client,
    calendarId: autoCalendarId,
    requestBody: {
      summary: summary,
      colorId: colorId,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: userTimeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: userTimeZone,
      },
      description: summary,
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${weekDay.slice(0, 2)}`],
    },
  })
}

/**
 * Reschedules reschedulable events conflicting with weekly hours events. Only
 * the next 6 months (27 weeks) are searched for conflicts to limit the amount
 * of Google Calendar api calls.
 * @param {Date} startWeeklyHours - The start time of the weekly event.
 * @param {Date} endWeeklyHours - The end time of the weekly event.
 */
async function rescheduleWeeklyHoursConflicts(
  startWeeklyHours: Date,
  endWeeklyHours: Date
): Promise<void> {
  // The events are rescheduled one week at a time.
  for (let week = 0; week < 27; week++) {
    const startTime = new Date(startWeeklyHours)
    const endTime = new Date(endWeeklyHours)

    await rescheduleConflictingEvents(
      new Date(startTime.setDate(startTime.getDate() + 7 * week)),
      new Date(endTime.setDate(endTime.getDate() + 7 * week))
    )
  }
}

export default {
  setWorkingHours,
  setUnavailableHours,
}
