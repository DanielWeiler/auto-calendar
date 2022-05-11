/**
 * This service finds a suitable available time for auto events to be
 * scheduled.
 */

import { UserMessage } from '../types'
import { assertDefined } from '../utils/helpers'
import { getAllBusyTimes, getHighPriorityEvents } from './busy-times.service'
import { getEndTime } from './schedule-helpers.service'
import { rescheduleConflictingEvents, scheduleEvent } from './schedule.service'

/**
 * Finds the next available time slot on the user's calendar for an event to be
 * scheduled.
 * @param {number} eventDuration - The duration of an event.
 * @param {Date | null} deadline - The deadline of an event.
 * @param {Date | null} minimumStartTime - The minimum start time of an event.
 * @param {boolean} highPriority - Determines if the event is high priority.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
export async function findAvailability(
  eventDuration: number,
  deadline: Date | null = null,
  minimumStartTime: Date | null = null,
  highPriority = false
): Promise<Date | undefined> {
  // Begin loop to iterate over the following days from the given start time
  let findingAvailability = true
  let queryDayCount = 0
  while (findingAvailability) {
    // <queryStartTime> is initiated at the beginning of every iteration of
    // the loop so that the current day being queried can be correctly
    // calculated.
    let queryStartTime = new Date()
    if (minimumStartTime) {
      // The minimum start time is only used if it is in the future.
      if (minimumStartTime > new Date()) {
        queryStartTime = new Date(minimumStartTime)
      }
    }

    // Set <queryStartTime> to current day being queried for availability
    queryStartTime.setDate(queryStartTime.getDate() + queryDayCount)

    // Enables searching from the given time on the given day and from the
    // beginning of the day on following days
    if (queryDayCount > 0) {
      queryStartTime.setHours(0, 0, 0, 0)
      if (deadline) {
        // Ends the loop as soon as the current day being queried is past the
        // event deadline
        if (queryStartTime > deadline) {
          break
        }
      }
    }

    const queryEndTime = new Date(queryStartTime)
    queryEndTime.setHours(24, 0, 0, 0)

    const availableTime = await getDayAvailability(
      highPriority,
      queryStartTime,
      queryEndTime,
      eventDuration
    )
    if (availableTime) {
      findingAvailability = false
      return availableTime
    }
    queryDayCount += 1
  }
  return
}

/**
 * Finds the next available time slot on the user's calendar for an event with
 * a deadline to be scheduled. If no empty time slots long enough for an event
 * could be found before its deadline, this function is called. This function
 * disreguards auto events without deadlines when searching for availability.
 * If the event is scheduled, the conflicting events will be rescheduled to a
 * suitable time.
 * @param {number} durationNumber - The duration of an event.
 * @param {Date} deadline - The deadline of an event.
 * @param {Date | null} minimumStartTime - The minimum start time of an event.
 * @param {string} summary - The summary of an event.
 * @param {string} schedulingSettings - Data of the preferences about the
 * event's scheduling, such as a minimum start time and/or a deadline.
 * @param {string} eventId - The ID of an event.
 * @returns {UserMessage} Returns an object containing details about
 * the message that will be provided to the user about the results of
 * scheduling the event.
 */
export async function findAvailabilityBeforeDeadline(
  durationNumber: number,
  deadline: Date,
  minimumStartTime: Date | null = null,
  summary: string,
  schedulingSettings: string,
  eventId = ''
): Promise<UserMessage> {
  const userMessage: UserMessage = {
    eventBeingScheduled: '',
    conflictingEvents: '',
  }

  const highpriority = true
  const startDateTime = await findAvailability(
    durationNumber,
    deadline,
    minimumStartTime,
    highpriority
  )

  const warningMessage =
    'There was no time slot available for this event before its deadline. Free some space in your calendar and try again.'

  // If an available time could be found before the deadline, the event is
  // scheduled.
  if (startDateTime) {
    const endDateTime = getEndTime(startDateTime, durationNumber)
    // If the available time found on the day of the deadline is past the
    // time of the deadline, the event cannot be not scheduled and the user is
    // notified.
    if (endDateTime > deadline) {
      userMessage.eventBeingScheduled = warningMessage
    } else {
      await scheduleEvent(
        summary,
        startDateTime,
        endDateTime,
        schedulingSettings,
        eventId
      )
      userMessage.eventBeingScheduled = startDateTime.toString()
      userMessage.conflictingEvents = await rescheduleConflictingEvents(
        startDateTime,
        endDateTime,
        summary
      )
    }
  }
  // If not, it is because either 1) every time slot between now and the
  // deadline was already filled with a high priority event or 2) there was not
  // enough time between high priority events to schedule this event. And the
  // event is not scheduled and the user is notified.
  else {
    userMessage.eventBeingScheduled = warningMessage
  }

  return userMessage
}

/**
 * Finds the next available time slot for the given day for the event that
 * availability is being searched for.
 * @param {boolean} highPriority - Determines if the event is high priority.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @param {number} eventDuration - The duration of the event that availability
 * is being searched for.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
async function getDayAvailability(
  highPriority: boolean,
  queryStartTime: Date,
  queryEndTime: Date,
  eventDuration: number
): Promise<Date | undefined> {
  if (highPriority) {
    const startDateTime = await findHighPriorityAvailability(
      queryStartTime,
      queryEndTime,
      eventDuration
    )
    return startDateTime
  } else {
    const startDateTime = await findLowPriorityAvailability(
      queryStartTime,
      queryEndTime,
      eventDuration
    )
    return startDateTime
  }
}

/**
 * This function finds a time slot long enough within the queried time for a
 * high priority event during the times of auto events without deadlines. High
 * priority event times are considered busy and the times of auto events
 * without deadlines are considered available.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @param {number} eventDuration - The duration of the event that availability
 * is being searched for.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
async function findHighPriorityAvailability(
  queryStartTime: Date,
  queryEndTime: Date,
  eventDuration: number
): Promise<Date | undefined> {
  const busyTimes = await getHighPriorityEvents(queryStartTime, queryEndTime)

  // Check if there are any busy times within the queried time slot
  if (busyTimes.length === 0) {
    return queryStartTime
  } else {
    // Begin loop to iterate over the busy times in the <busyTimes> array to
    // continue to check for available time within the queried time
    for (let i = 0; i < busyTimes.length; i++) {
      const highPriorityEvent = busyTimes[i]
      assertDefined(highPriorityEvent.start?.dateTime)
      assertDefined(highPriorityEvent.end?.dateTime)
      const eventStart = new Date(highPriorityEvent.start.dateTime)
      const eventEnd = new Date(highPriorityEvent.end.dateTime)

      // Check if there is enough time for the event from the start of the
      // queried time slot to the start of the first busy time
      if (i === 0) {
        const availableTime = checkTimeDuration(queryStartTime, eventStart)
        if (availableTime >= eventDuration) {
          return queryStartTime
        }
      }

      // Check if there is another busy time in the <busyTimes> array
      if (busyTimes[i + 1]) {
        // If so, check if there is enough time for the event in between
        // these two busy times
        const nextEvent = busyTimes[i + 1]
        assertDefined(nextEvent.start?.dateTime)
        const nextEventStart = new Date(nextEvent.start.dateTime)

        const availableTime = checkTimeDuration(eventEnd, nextEventStart)
        if (availableTime >= eventDuration) {
          return eventEnd
        }
      } else {
        // If not, check if there is enough time for the event from the end
        // of the last busy time to the end of the queried time slot
        const availableTime = checkTimeDuration(eventEnd, queryEndTime)
        if (availableTime >= eventDuration) {
          return eventEnd
        }
      }
    }
  }
  return
}

/**
 * Finds the next empty time slot within the queried time that is long enough
 * for the event being scheduled
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @param {number} eventDuration - The duration of the event that availability
 * is being searched for.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
async function findLowPriorityAvailability(
  queryStartTime: Date,
  queryEndTime: Date,
  eventDuration: number
): Promise<Date | undefined> {
  const busyTimes = await getAllBusyTimes(queryStartTime, queryEndTime)

  // Check if there are any busy times within the queried time slot
  if (busyTimes.length === 0) {
    return queryStartTime
  } else {
    // Begin loop to iterate over the busy times in the <busyTimes> array to
    // continue to check for available time within the queried time
    for (let i = 0; i < busyTimes.length; i++) {
      const event = busyTimes[i]
      assertDefined(event.start)
      assertDefined(event.end)
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      // Check if there is enough time for the event from the start of the
      // queried time slot to the start of the first busy time
      if (i === 0) {
        const availableTime = checkTimeDuration(queryStartTime, eventStart)
        if (availableTime >= eventDuration) {
          return queryStartTime
        }
      }

      // Check if there is another busy time in the <busyTimes> array
      if (busyTimes[i + 1]) {
        // If so, check if there is enough time for the event in between
        // these two busy times
        const nextEvent = busyTimes[i + 1]
        assertDefined(nextEvent.start)
        const nextEventStart = new Date(nextEvent.start)

        const availableTime = checkTimeDuration(eventEnd, nextEventStart)
        if (availableTime >= eventDuration) {
          return eventEnd
        }
      } else {
        // If not, check if there is enough time for the event from the end
        // of the last busy time to the end of the queried time slot
        const availableTime = checkTimeDuration(eventEnd, queryEndTime)
        if (availableTime >= eventDuration) {
          return eventEnd
        }
      }
    }
  }
  return
}

/**
 * Checks the duration of time between the two given times.
 * @param {Date} timeSlotStart - The start time of the time slot.
 * @param {Date} timeSlotEnd - The end time of the time slot.
 * @returns {number} Returns the duration of time of the time slot.
 */
export function checkTimeDuration(
  timeSlotStart: Date,
  timeSlotEnd: Date
): number {
  assertDefined(timeSlotStart)
  assertDefined(timeSlotEnd)
  const availableTime =
    (timeSlotEnd.getTime() - timeSlotStart.getTime()) / 60000
  return availableTime
}
