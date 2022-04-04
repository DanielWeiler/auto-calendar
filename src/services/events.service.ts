import { google } from 'googleapis'
import oAuth2Client from '../configs/google-client.config'
import { userCurrentDateTime } from '../services/sign-in.service'
import { EventData, WeeklyHoursData } from '../types'
import {
  addTimeToDate,
  assertDefined,
  getNextDayOfTheWeek,
} from '../utils/helpers'
require('express-async-errors')
const calendar = google.calendar('v3')

function setWorkingHours(weeklyHours: WeeklyHoursData) {
  Object.entries(weeklyHours.data).map(async (item) => {
    const date = getNextDayOfTheWeek(item[0])
    assertDefined(date)

    // Check if the day has working hours
    if (item[1].startTime || item[1].endTime !== '') {
      const startWorkingHours = addTimeToDate(item[1].startTime, date)
      const endWorkingHours = addTimeToDate(item[1].endTime, date)

      await calendar.events.insert({
        // Formatted in the same way as Google's example for this method.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        auth: oAuth2Client,
        calendarId: 'primary',
        requestBody: {
          summary: 'Working hours',
          colorId: '4',
          start: {
            dateTime: startWorkingHours,
            timeZone: await getUserTimeZone(),
          },
          end: {
            dateTime: endWorkingHours,
            timeZone: await getUserTimeZone(),
          },
          description: 'Working hours',
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${item[0].slice(0, 2)}`],
        },
      })
    }
  })
}

function setUnavailableHours(weeklyHours: WeeklyHoursData) {
  Object.entries(weeklyHours.data).map(async (item) => {
    const date = getNextDayOfTheWeek(item[0])
    assertDefined(date)

    // Check if the day has unavailable hours
    if (item[1].startTime || item[1].endTime !== '') {
      const startAvailableHours = addTimeToDate(item[1].startTime, date)
      const endAvailableHours = addTimeToDate(item[1].endTime, date)

      const startUnavailableHours = date.setHours(0, 0, 0, 0)
      const endUnavailableHours = date.setHours(24, 0, 0, 0)

      await calendar.events.insert({
        // Formatted in the same way as Google's example for this method.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        auth: oAuth2Client,
        calendarId: 'primary',
        requestBody: {
          summary: 'Unavailable hours',
          colorId: '8',
          start: {
            dateTime: new Date(startUnavailableHours),
            timeZone: await getUserTimeZone(),
          },
          end: {
            dateTime: startAvailableHours,
            timeZone: await getUserTimeZone(),
          },
          description: 'Unavailable hours',
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${item[0].slice(0, 2)}`],
        },
      })

      await calendar.events.insert({
        // Formatted in the same way as Google's example for this method.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        auth: oAuth2Client,
        calendarId: 'primary',
        requestBody: {
          summary: 'Unavailable hours',
          colorId: '8',
          start: {
            dateTime: endAvailableHours,
            timeZone: await getUserTimeZone(),
          },
          end: {
            dateTime: new Date(endUnavailableHours),
            timeZone: await getUserTimeZone(),
          },
          description: 'Unavailable hours',
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${item[0].slice(0, 2)}`],
        },
      })
    }
  })
}

async function createEvent(data: EventData) {
  const {
    summary,
    duration,
    manualDate,
    manualTime,
    deadlineDate,
    deadlineTime,
  } = data
  const durationNumber = parseInt(duration)

  let deadline = null
  let deadlineMessage = ''
  if (deadlineDate && deadlineTime) {
    deadline = addTimeToDate(deadlineTime, deadlineDate)
    deadlineMessage = `Deadline: ${deadline}`
  }

  // Schedule event at the given time
  if (manualDate && manualTime) {
    const startDateTime = addTimeToDate(manualTime, manualDate)
    const endDateTime = getEndTime(startDateTime, durationNumber)
    if (!deadlineMessage) {
      deadlineMessage = 'Manually scheduled'
    }
    await scheduleEvent(summary, startDateTime, endDateTime, deadlineMessage)
  }
  // Schedule event automatically
  else {
    const startDateTime = await findAvailability(
      userCurrentDateTime,
      durationNumber,
      deadline
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
          await findAvailabilityBeforeDeadline(
            userCurrentDateTime,
            durationNumber,
            deadline,
            summary,
            deadlineMessage
          )
        } else {
          await scheduleEvent(
            summary,
            startDateTime,
            endDateTime,
            deadlineMessage
          )
        }
      } else {
        await scheduleEvent(summary, startDateTime, endDateTime)
      }
    }
    // If not, it is because a time could not be found before the given event
    // deadline and a high priority available time is queried for the event
    // before it's deadline.
    else {
      assertDefined(deadline)
      await findAvailabilityBeforeDeadline(
        userCurrentDateTime,
        durationNumber,
        deadline,
        summary,
        deadlineMessage
      )
    }
  }
}

function getEndTime(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000)
}

async function scheduleEvent(
  summary: string,
  startDateTime: Date,
  endDateTime: Date,
  deadlineMessage = ''
) {
  await calendar.events.insert({
    // Formatted in the same way as Google's example for this method.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    auth: oAuth2Client,
    calendarId: 'primary',
    requestBody: {
      summary: summary,
      colorId: '7',
      start: {
        dateTime: startDateTime,
        timeZone: await getUserTimeZone(),
      },
      end: {
        dateTime: endDateTime,
        timeZone: await getUserTimeZone(),
      },
      description: deadlineMessage,
    },
  })
}

async function getUserTimeZone() {
  const cal = await calendar.calendars.get({
    auth: oAuth2Client,
    calendarId: 'primary',
  })

  return cal.data.timeZone
}

// Finds the next available time slot on the user's calendar for an event to be
// scheduled
async function findAvailability(
  givenQueryStartTime: Date,
  eventDuration: number,
  deadline: Date | null = null,
  highPriority = false
) {
  // Begin loop to iterate over the following days from the given start time
  let findingAvailability = true
  let queryDayCount = 0
  while (findingAvailability) {
    const queryStartTime = new Date(givenQueryStartTime)

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
  userCurrentDateTime: Date,
  durationNumber: number,
  deadline: Date,
  summary: string,
  deadlineMessage: string
) {
  const highpriority = true
  const startDateTime = await findAvailability(
    userCurrentDateTime,
    durationNumber,
    deadline,
    highpriority
  )

  // If an available time could be found before the deadline, the event is
  // scheduled.
  if (startDateTime) {
    const endDateTime = getEndTime(startDateTime, durationNumber)
    // If the available time found on the day of the deadline is past the
    // time of the deadline, ...
    if (endDateTime > deadline) {
      console.log(
        'endDateTime is after deadline: send warning that no hp time could be found'
      )
    } else {
      await scheduleEvent(summary, startDateTime, endDateTime, deadlineMessage)
      // Conflicting low priority events need to be rescheduled. This time
      // slot will have low priority events because a high priority event
      // cannot be scheduled during other high priority events and if the time
      // slot had been empty then this event would have been scheduled on a
      // previous attempt.
      await rescheduleConflictingEvents(
        startDateTime,
        endDateTime
      )
    }
  }
  // If not, it is because either 1) every time slot between now and the
  // deadline was already filled with a high priority event or 2) there was not
  // enough time between high priority events to schedule this event.
  // Therefore...
  else {
    console.log(
      'queryDayCount has past deadline: send warning that no hp time could be found'
    )
  }
}

// Finds the next available time slot for the day
async function getDayAvailability(
  highPriority: boolean,
  queryStartTime: Date,
  queryEndTime: Date,
  eventDuration: number
) {
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
) {
  const busyTimes = await getHighPriorityEvents(
    queryStartTime,
    queryEndTime
  )

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
) {
  const busyTimes = await getAllBusyTimes(
    queryStartTime,
    queryEndTime
  )

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
) {
  const events = await getEventsList(queryStartTime, queryEndTime)

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
async function getAllBusyTimes(queryStartTime: Date, queryEndTime: Date) {
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
function checkTimeDuration(timeSlotStart: Date, timeSlotEnd: Date) {
  assertDefined(timeSlotStart)
  assertDefined(timeSlotEnd)
  const availableTime =
    (timeSlotEnd.getTime() - timeSlotStart.getTime()) / 60000
  return availableTime
}

async function getEventsList(queryStartTime: Date, queryEndTime: Date) {
  const eventsList = await calendar.events.list({
    // Formatted in the same way as Google's example for this method.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    auth: oAuth2Client,
    calendarId: 'primary',
    singleEvents: true,
    timeMin: queryStartTime.toISOString(),
    timeMax: queryEndTime.toISOString(),
  })
  assertDefined(eventsList.data.items)

  return eventsList.data.items
}

// When a high priority event is scheduled over low priority events, this
// function is called.
async function rescheduleConflictingEvents(
  highPriorityEventStart: Date,
  highPriorityEventEnd: Date
) {
  const conflictingEvents = await getEventsList(
    highPriorityEventStart,
    highPriorityEventEnd
  )

  for (let i = 0; i < conflictingEvents.length; i++) {
    const event = conflictingEvents[i]

    // Skips over the high priority event creating the conflict(s)
    if (event.description) {
      continue
    }

    assertDefined(event.start?.dateTime)
    assertDefined(event.end?.dateTime)
    const eventStart = new Date(event.start?.dateTime)
    const eventEnd = new Date(event.end?.dateTime)

    // Gets the duration of the event to be rescheduled
    const durationNumber = checkTimeDuration(eventStart, eventEnd)
    const startDateTime = await findAvailability(
      userCurrentDateTime,
      durationNumber
    )
    assertDefined(startDateTime)
    const endDateTime = getEndTime(startDateTime, durationNumber)

    await calendar.events.patch({
      // Formatted in the same way as Google's example for this method.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      auth: oAuth2Client,
      calendarId: 'primary',
      eventId: event.id,
      requestBody: {
        start: {
          dateTime: startDateTime,
        },
        end: {
          dateTime: endDateTime,
        },
      },
    })
  }
}

export default { setWorkingHours, setUnavailableHours, createEvent }
