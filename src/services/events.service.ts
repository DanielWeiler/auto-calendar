import { calendar_v3, google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import {
  EventData,
  EventDisplayFormat,
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

async function getEvents(): Promise<EventDisplayFormat[]> {
  // Get the date 12 months from now
  const timeMax = new Date(new Date().setMonth(new Date().getMonth() + 12))

  const events = await calendar.events.list({
    auth: oAuth2Client,
    calendarId: 'primary',
    singleEvents: true,
    timeMax: timeMax.toISOString(),
    maxResults: 2500,
  })
  assertDefined(events.data.items)

  const formattedEvents: EventDisplayFormat[] = []
  events.data.items
    .filter((event) => event.description !== 'Unavailable hours')
    .map((event) => {
      let color = 'SkyBlue'
      if (event.summary === 'Working hours') {
        color = 'PaleGoldenRod'
      }

      const formattedEvent: EventDisplayFormat = {
        title: event.summary,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        backgroundColor: color,
      }
      formattedEvents.push(formattedEvent)
    })

  return formattedEvents
}

function setWorkingHours(weeklyHours: WeeklyHoursData): void {
  Object.entries(weeklyHours.data).map(async (day) => {
    const eventName = 'Working hours'
    const colorId = '4'
    const weekDay = day[0]
    const date = getNextDayOfTheWeek(weekDay)

    // Check if the day has working hours
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
    }
  })
}

async function scheduleWeeklyEvent(
  summary: string,
  colorId: string,
  startDateTime: Date,
  endDateTime: Date,
  weekDay: string
): Promise<void> {
  await calendar.events.insert({
    auth: oAuth2Client,
    calendarId: 'primary',
    requestBody: {
      summary: summary,
      colorId: colorId,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: await getUserTimeZone(),
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: await getUserTimeZone(),
      },
      description: summary,
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${weekDay.slice(0, 2)}`],
    },
  })
}

function setUnavailableHours(weeklyHours: WeeklyHoursData): void {
  Object.entries(weeklyHours.data).map(async (day) => {
    const eventName = 'Unavailable hours'
    const colorId = '8'
    const weekDay = day[0]
    const date = getNextDayOfTheWeek(weekDay)

    const startUnavailableHoursNumber = date.setHours(0, 0, 0, 0)
    const startUnavailableHours = new Date(startUnavailableHoursNumber)

    const endUnavailableHoursNumber = date.setHours(23, 59, 0, 0)
    const endUnavailableHours = new Date(endUnavailableHoursNumber)

    // Check if the day has available hours and if not then the whole day is
    // set as unavailable
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
    } else {
      await scheduleWeeklyEvent(
        eventName,
        colorId,
        startUnavailableHours,
        endUnavailableHours,
        weekDay
      )
    }
  })
}

async function createEvent(data: EventData): Promise<string> {
  const {
    summary,
    duration,
    manualDate,
    manualTime,
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
    let deadline = null
    let deadlineMessage = ''
    if (deadlineDate && deadlineTime) {
      deadline = addTimeToDate(deadlineTime, deadlineDate)
      deadlineMessage = `Deadline: ${deadline}`
    }

    userMessage = await autoSchedule(
      summary,
      durationNumber,
      deadline,
      deadlineMessage
    )
  }

  const messageString = convertMessageToString(userMessage)

  return messageString
}

// Schedules an event at the user given time
async function manualSchedule(
  summary: string,
  manualDate: string,
  manualTime: string,
  durationNumber: number
): Promise<UserMessage> {
  const userMessage: UserMessage = {
    eventBeingScheduled: 'Manually scheduled',
    conflictingEvents: '',
  }

  const startDateTime = addTimeToDate(manualTime, manualDate)
  const endDateTime = getEndTime(startDateTime, durationNumber)
  const description = 'Manually scheduled'

  await scheduleEvent(summary, startDateTime, endDateTime, description)
  userMessage.conflictingEvents = await rescheduleConflictingEvents(
    startDateTime,
    endDateTime,
    summary
  )

  return userMessage
}

// Schedules an event according to calendar availability
async function autoSchedule(
  summary: string,
  durationNumber: number,
  deadline: Date | null = null,
  deadlineMessage = '',
  eventId = ''
): Promise<UserMessage> {
  let userMessage: UserMessage = {
    eventBeingScheduled: '',
    conflictingEvents: '',
  }

  const startDateTime = await findAvailability(durationNumber, deadline)

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
          summary,
          deadlineMessage,
          eventId
        )
      } else {
        await scheduleEvent(
          summary,
          startDateTime,
          endDateTime,
          deadlineMessage,
          eventId
        )
        userMessage.eventBeingScheduled = startDateTime.toString()
      }
    } else {
      await scheduleEvent(
        summary,
        startDateTime,
        endDateTime,
        undefined,
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
      summary,
      deadlineMessage,
      eventId
    )
  }

  return userMessage
}

// Converts the message for the user from an object to a string
function convertMessageToString(userMessage: UserMessage): string {
  let messageString = ''
  if (
    userMessage.eventBeingScheduled !==
      'There was no time slot available for this event before its deadline.' &&
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

function getEndTime(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

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
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: await getUserTimeZone(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: await getUserTimeZone(),
        },
      },
    })
  } else {
    await calendar.events.insert({
      auth: oAuth2Client,
      calendarId: 'primary',
      requestBody: {
        summary: summary,
        colorId: '7',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: await getUserTimeZone(),
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: await getUserTimeZone(),
        },
        description: description,
      },
    })
  }
}

// This function is called when a manually scheduled event or a high priority
// event is scheduled to check if there are any conflicting events that need
// rescheduling.
async function rescheduleConflictingEvents(
  highPriorityEventStart: Date,
  highPriorityEventEnd: Date,
  highPriorityEventSummary: string
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
    } else if (event.description === 'Manually scheduled') {
      conflictingEventsMessage =
        'Another manually scheduled reminder is scheduled during this time.'
      continue
    } else if (event.description === 'Working hours') {
      conflictingEventsMessage =
        'This reminder was scheduled during working hours.'
      continue
    } else if (event.description === 'Unavailable hours') {
      conflictingEventsMessage =
        'This reminder was scheduled outside of available hours.'
      continue
    }

    assertDefined(event.summary)
    assertDefined(event.id)
    assertDefined(event.start?.dateTime)
    assertDefined(event.end?.dateTime)

    const eventStart = new Date(event.start?.dateTime)
    const eventEnd = new Date(event.end?.dateTime)
    const durationNumber = checkTimeDuration(eventStart, eventEnd)

    // If an event has a deadline, the description will be the deadline.
    let deadline = null
    if (event.description) {
      deadline = new Date(event.description)
    }

    // Try to reschedule the conflicting event
    const conflictingEventMessage = await autoSchedule(
      event.summary,
      durationNumber,
      deadline,
      undefined,
      event.id
    )

    // Check if the event was successfully rescheduled and set the corresponding
    // message
    if (
      conflictingEventMessage.eventBeingScheduled ===
      'There was no time slot available for this event before its deadline.'
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
      'One or more conflicting events could not be rescheduled before their deadline.'
  }

  return conflictingEventsMessage
}

// Finds the next available time slot on the user's calendar for an event to be
// scheduled
async function findAvailability(
  eventDuration: number,
  deadline: Date | null = null,
  highPriority = false
): Promise<Date | undefined> {
  // Begin loop to iterate over the following days from the given start time
  let findingAvailability = true
  let queryDayCount = 0
  while (findingAvailability) {
    const queryStartTime = new Date()

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

// If no empty time slots long enough for an event could be found before its
// deadline, this function is called.
async function findAvailabilityBeforeDeadline(
  durationNumber: number,
  deadline: Date,
  summary: string,
  deadlineMessage: string,
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
    highpriority
  )

  const warningMessage =
    'There was no time slot available for this event before its deadline.'

  // If an available time could be found before the deadline, the event is
  // scheduled.
  if (startDateTime) {
    const endDateTime = getEndTime(startDateTime, durationNumber)
    // If the available time found on the day of the deadline is past the
    // time of the deadline, the event is not scheduled and the user is notified.
    if (endDateTime > deadline) {
      userMessage.eventBeingScheduled = warningMessage
    } else {
      await scheduleEvent(
        summary,
        startDateTime,
        endDateTime,
        deadlineMessage,
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

// Finds the next available time slot for the day
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

// This function finds a time slot long enough within the queried time for a
// high priority event during the times of low priority events. High priority
// event times are considered busy and low priority event times are considered
// available.
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

// Finds the next empty time slot within the queried time that is long enough
// for the event being scheduled
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

// Gets a list of the high priority events during the given query time
async function getHighPriorityEvents(
  queryStartTime: Date,
  queryEndTime: Date
): Promise<calendar_v3.Schema$Event[]> {
  const events = await getEventsInTimePeriod(queryStartTime, queryEndTime)

  const highPriorityEvents = []
  for (let i = 0; i < events.length; i++) {
    const event = events[i]

    // If an event has a description, it is an indicator that it is a high
    // priority event.
    if (event.description) {
      highPriorityEvents.push(event)
    }
  }

  return highPriorityEvents
}

// Gets a list of all the busy times during the given query time
async function getAllBusyTimes(
  queryStartTime: Date,
  queryEndTime: Date
): Promise<calendar_v3.Schema$TimePeriod[]> {
  const availabilityQuery = await calendar.freebusy.query({
    auth: oAuth2Client,
    requestBody: {
      timeMin: queryStartTime.toISOString(),
      timeMax: queryEndTime.toISOString(),
      timeZone: await getUserTimeZone(),
      items: [
        {
          id: 'primary',
        },
      ],
    },
  })

  const busyTimes = availabilityQuery.data.calendars?.primary.busy
  assertDefined(busyTimes)

  return busyTimes
}

// Checks the duration of time between the two given times
function checkTimeDuration(timeSlotStart: Date, timeSlotEnd: Date): number {
  assertDefined(timeSlotStart)
  assertDefined(timeSlotEnd)
  const availableTime =
    (timeSlotEnd.getTime() - timeSlotStart.getTime()) / 60000
  return availableTime
}

async function getEventsInTimePeriod(
  queryStartTime: Date,
  queryEndTime: Date
): Promise<calendar_v3.Schema$Event[]> {
  const eventsList = await calendar.events.list({
    auth: oAuth2Client,
    calendarId: 'primary',
    singleEvents: true,
    timeMin: queryStartTime.toISOString(),
    timeMax: queryEndTime.toISOString(),
    timeZone: await getUserTimeZone(),
  })
  assertDefined(eventsList.data.items)

  return eventsList.data.items
}

async function getUserTimeZone(): Promise<string> {
  const cal = await calendar.calendars.get({
    auth: oAuth2Client,
    calendarId: 'primary',
  })
  assertDefined(cal.data.timeZone)

  return cal.data.timeZone
}

export default { getEvents, setWorkingHours, setUnavailableHours, createEvent }
