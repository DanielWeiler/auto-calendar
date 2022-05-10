import { calendar_v3, google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import {
  DescriptionInfo,
  EventData,
  EventFormData,
  RescheduleData,
  UserMessage,
  WeeklyHoursData,
} from '../types'
import {
  addTimeToDate,
  assertDefined,
  getNextDayOfTheWeek,
} from '../utils/helpers'
require('express-async-errors')
const calendar = google.calendar('v3')

let autoCalendarId = ''
let userTimeZone = ''

/**
 * Gets the events from Google Calendar to be displayed in the app. The
 * calendar ID used by the app and the time zone of the user are also
 * initialized in this function.
 * @returns {EventData[]} Returns a list of event objects.
 */
async function getEvents(): Promise<EventData[]> {
  // Initialize the calendar ID and time zone of the user
  autoCalendarId = await getAutoCalendarId()
  userTimeZone = await getUserTimeZone()

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
  const eventsData: EventData[] = []
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

    const eventData: EventData = {
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
async function manualSchedule(
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
async function autoSchedule(
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
 * Converts the message for the user from an object to a string
 * @param {UserMessage} userMessage - An object containing details about the
 * message that will be provided to the user about the results of scheduling
 * the event.
 * @returns {string} Returns a message that will be provided to the
 * user about the results of scheduling the event.
 */
function convertMessageToString(userMessage: UserMessage): string {
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
    })
    const timeString = new Date(
      userMessage.eventBeingScheduled
    ).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

    messageString = `Scheduled on ${dateString} at ${timeString}. 
    ${userMessage.conflictingEvents}`
  } else {
    messageString =
      userMessage.eventBeingScheduled + userMessage.conflictingEvents
  }

  return messageString
}

/**
 * Finds the end time of an event by adding the duration of minutes of the
 * event to the start time of the event.
 * @param {Date} date - The date of an event.
 * @param {number} minutes - The duration of an event in minutes.
 * @returns {Date} Returns a date, which is the end time of an event.
 */
function getEndTime(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
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
async function scheduleEvent(
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
async function rescheduleConflictingEvents(
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
async function findAvailability(
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
async function findAvailabilityBeforeDeadline(
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
 * high priority event during the times of low priority events. High priority
 * event times are considered busy and low priority event times are considered
 * available.
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
 * Gets a list of the high priority events during the given query time.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @returns {calendar_v3.Schema$Event[]} Returns a list of high
 * priority event objects.
 */
async function getHighPriorityEvents(
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
async function getAllBusyTimes(
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

/**
 * Checks the duration of time between the two given times.
 * @param {Date} timeSlotStart - The start time of the time slot.
 * @param {Date} timeSlotEnd - The end time of the time slot.
 * @returns {number} Returns the duration of time of the time slot.
 */
function checkTimeDuration(timeSlotStart: Date, timeSlotEnd: Date): number {
  assertDefined(timeSlotStart)
  assertDefined(timeSlotEnd)
  const availableTime =
    (timeSlotEnd.getTime() - timeSlotStart.getTime()) / 60000
  return availableTime
}

/**
 * Gets the events in the given time period.
 * @param {Date} queryStartTime - The start time of the time period.
 * @param {Date} queryEndTime - The end time of the time period.
 * @returns {calendar_v3.Schema$Event[]} Returns a list of event objects.
 */
async function getEventsInTimePeriod(
  queryStartTime: Date,
  queryEndTime: Date
): Promise<calendar_v3.Schema$Event[]> {
  const eventsList = await calendar.events.list({
    auth: oAuth2Client,
    calendarId: autoCalendarId,
    singleEvents: true,
    timeMin: queryStartTime.toISOString(),
    timeMax: queryEndTime.toISOString(),
    timeZone: userTimeZone,
  })
  assertDefined(eventsList.data.items)

  return eventsList.data.items
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
function parsePotentialDescription(
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
 * Deletes an event from the Google calendar the app uses.
 * @param {string} eventId - The ID of an event.
 */
async function deleteEvent(eventId: string): Promise<void> {
  await calendar.events.delete({
    auth: oAuth2Client,
    calendarId: autoCalendarId,
    eventId: eventId,
  })
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
      rescheduleTimeDate.toDateString(),
      rescheduleTimeDate.toTimeString(),
      duration,
      eventId
    )
  }

  const messageString = convertMessageToString(userMessage)

  return messageString
}

/**
 * Updates an event's description, which affects how the event is effected when
 * it is rescheduled or when other events are scheduled on top of it.
 * @param {string} eventId - The ID of an event.
 * @param {Date} rescheduleTimeDate - The time an event will be rescheduled to
 * or thereafter.
 * @param {boolean} flexible - Determines whether the event will be rescheduled
 * at the selected time or after the selected time depending on availability.
 * @param {Date | null} deadline - The deadline of an event.
 * @param {string | undefined} description - The description of an event
 * containing info on its deadline or if it was manually scheduled.
 */
async function updateDescription(
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
      if (!flexible) {
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

/**
 * Gets the time zone of the user's calendar.
 * @returns {string} Returns a string that is the time zone's name.
 */
async function getUserTimeZone(): Promise<string> {
  const cal = await calendar.calendars.get({
    auth: oAuth2Client,
    calendarId: autoCalendarId,
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

export default {
  getEvents,
  setWorkingHours,
  setUnavailableHours,
  createEvent,
  deleteEvent,
  rescheduleEvent,
}
