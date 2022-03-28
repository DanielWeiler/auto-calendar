import express from 'express'
import { google } from 'googleapis'
import { CreateEventRequest, SetWeeklyHoursRequest } from '../types'
import oAuth2Client from '../utils/authorization'
import {
  addTimeToDate,
  assertDefined,
  getNextDayOfTheWeek,
  getUserTimeZone
} from '../utils/helpers'
require('express-async-errors')

const router = express.Router()

const calendar = google.calendar('v3')

router.post('/set-working-hours', (req: SetWeeklyHoursRequest, _res) => {
  Object.entries(req.body.data).map(async (item) => {
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
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${item[0].slice(0, 2)}`],
        },
      })
    }
  })
})

router.post('/set-unavailable-hours', (req: SetWeeklyHoursRequest, _res) => {
  Object.entries(req.body.data).map(async (item) => {
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
          recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${item[0].slice(0, 2)}`],
        },
      })
    }
  })
})

router.post('/create-event', (req: CreateEventRequest, _res) => {
  const { data } = req.body
  const {
    /*summary,  duration, */ manualDate,
    manualTime /*deadlineDate, deadlineTime */,
  } = data

  if (manualDate && manualTime) {
    // Schedule event at the given time

    // const startTime = addTimeToDate(manualTime, manualDate)
    // schedule event
  }
  /* } else {
          // Schedule event automatically

          // get user current time 
          // const startTime = findAvailability(userCurrentDateTime, duration)
          // schedule event
    } */


})

export default router
