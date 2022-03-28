import { google } from 'googleapis'
import { userCurrentDateTime } from '../routes/signin'
import oAuth2Client from './authorization'

const calendar = google.calendar('v3')

export function assertDefined<T>(
  value: T | null | undefined
): asserts value is T {
  if (value == null) {
    throw new Error(`Fatal error: value ${value} must not be null/undefined.`)
  }
}

export function getNextDayOfTheWeek(
  dayName: string,
  excludeToday = false,
  refDate = new Date(userCurrentDateTime)
) {
  const dayOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].indexOf(
    dayName.slice(0, 2)
  )
  if (dayOfWeek < 0) return
  refDate.setHours(0, 0, 0, 0)
  refDate.setDate(
    refDate.getDate() +
      +!!excludeToday +
      ((dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7)
  )
  return refDate
}

export function parseTime(time: string) {
  const h = time.split(':')[0]
  const m = time.split(':')[1]

  const hours = Number(h)
  const minutes = Number(m)
  const t = { hours, minutes }

  return t
}

export async function getUserTimeZone() {
  const cal = await calendar.calendars.get({
    auth: oAuth2Client,
    calendarId: 'primary',
  })

  return cal.data.timeZone
}

export function addTimeToDate(time: string, date: Date | string) {
  const dateTime = new Date(date)
  const t = parseTime(time)
  dateTime.setHours(t.hours, t.minutes)
  return dateTime
}

export async function freeBusy(queryStartTime: string, queryEndTime: string) {
  const availabilityQuery = await calendar.freebusy.query({
    auth: oAuth2Client,
    requestBody: {
      timeMin: queryStartTime,
      timeMax: queryEndTime,
      timeZone: await getUserTimeZone(),
      items: [
        {
          id: 'primary',
        },
      ],
    },
  })

  const unavailableTimes = availabilityQuery.data.calendars?.primary.busy
  assertDefined(unavailableTimes)

  return unavailableTimes
}

export function checkTimeDuration(
  timeSlotStart: string | null | undefined,
  timeSlotEnd: string | null | undefined
) {
  assertDefined(timeSlotStart)
  assertDefined(timeSlotEnd)
  const availableTime =
    (new Date(timeSlotEnd).getTime() - new Date(timeSlotStart).getTime()) /
    60000
  return availableTime
}

// This function finds the next available time slot on the user's calendar for
// an event to be scheduled.
export async function findAvailability(
  givenQueryStartTime: string | Date,
  eventDuration: number
) {
  // Begin loop to iterate over the days from the given start time
  let findingAvailability = true
  let queryDayCount = 0
  while (findingAvailability) {
    const queryStartTimeDate = new Date(givenQueryStartTime)

    // Set <queryStartTime> to current day being queried for availability
    queryStartTimeDate.setDate(queryStartTimeDate.getDate() + queryDayCount)

    // Enables searching from the given time on the given day and from the
    // beginning of the day on following days
    if (queryDayCount > 0) {
      queryStartTimeDate.setHours(0, 0, 0, 0)
    }

    const queryEndTimeDate = new Date(queryStartTimeDate)
    queryEndTimeDate.setHours(24, 0, 0, 0)

    const queryStartTime = queryStartTimeDate.toISOString()
    const queryEndTime = queryEndTimeDate.toISOString()
    const unavailableTimes = await freeBusy(queryStartTime, queryEndTime)

    // Check if there are any busy times within the queried time slot
    if (unavailableTimes.length === 0) {
      findingAvailability = false
      return queryStartTime
    } else {
      // Begin loop to iterate over the busy times in the <unavailableTimes>
      // array to continue to check for available time within the queried time
      for (let i = 0; i < unavailableTimes.length; i++) {
        const event = unavailableTimes[i]

        // Check if there is enough time for the event from the start of the
        // queried time slot to the start of the first busy time
        if (i === 0) {
          const availableTime = checkTimeDuration(queryStartTime, event.start)
          if (availableTime >= eventDuration) {
            findingAvailability = false
            return queryStartTime
          }
        }

        // Check if there is another busy time in the <unavailableTimes> array
        if (unavailableTimes[i + 1]) {
          // If so, check if there is enough time for the event in between
          // these two busy times
          const nextEvent = unavailableTimes[i + 1]
          const availableTime = checkTimeDuration(event.end, nextEvent.start)
          if (availableTime >= eventDuration) {
            findingAvailability = false
            return event.end
          } else {
            continue
          }
        } else {
          // If not, check if there is enough time for the event from the end
          // of the last busy time to the end of the queried time slot
          const availableTime = checkTimeDuration(event.end, queryEndTime)
          if (availableTime >= eventDuration) {
            findingAvailability = false
            return event.end
          }
        }
      }
    }
    if (queryDayCount === 180) {
      console.log(
        'Message for user: "Reminder could not be scheduled. No available \
        time could be found in the next 6 months"'
      )
      break
    }

    queryDayCount += 1
  }
  return
}
