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
  const dayOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].indexOf(dayName.slice(0,2))
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

// This function finds the next available time slot on the user's calendar for 
// an event to be scheduled.
//let queryDayCount = 0 
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function findAvailability(queryStartTimeString: string | Date, eventDuration: number) {
  const queryStartTime = new Date(queryStartTimeString)
  queryStartTime.setDate(queryStartTime.getDate() + 0/* queryDayCount */) 
  
  const queryEndTime = new Date(queryStartTime)
  queryEndTime.setHours(24,0,0,0)
  
  // Begin loop to iterate over the following days from the given start time 
  let scheduling = true
  while (scheduling) {
    // Enables searching from the given time on the given day and from the 
    // beginning of the day on following days
    /* if (queryDayCount > 0) {
      queryStartTime.setHours(0,0,0,0)
    } */

    const availabilityQuery = await calendar.freebusy.query({
      auth: oAuth2Client,
      requestBody: {
        timeMin: queryEndTime.toISOString(),
        timeMax: queryEndTime.toISOString(),
        timeZone: await getUserTimeZone(),
        items: [
          {
            id: 'primary'
          }
        ]
      },
    })
    console.log('DATA::', availabilityQuery.data)
    console.log('BUSY::', availabilityQuery.data.calendars?.primary.busy)

    const unavailableTimes = availabilityQuery.data.calendars?.primary.busy
    assertDefined(unavailableTimes)
    assertDefined(unavailableTimes[0].start)
    
    // Check if there are any busy times within the queried time slot
    if (unavailableTimes.length === 0) {
      console.log('not busy')
      // schedule event or just return start time - leave this til later until you know what you're doing when changing work hours 
      
    } else {
      // Check if there is enough time for the event from the start of the 
      // queried time slot to the start of the first busy time
      const availableTime = (new Date(unavailableTimes[0].start).getTime() - queryStartTime.getTime()) / 60000
      console.log(availableTime)

      if (availableTime > eventDuration) {
        console.log('enough time')

        // schedule event or just return start time - leave this til later until you know what you're doing when changing work hours 

        return queryStartTime
      } else {
        console.log('not enough time')


      }
    }
    scheduling = false
  }
}
