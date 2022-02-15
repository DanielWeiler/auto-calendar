import express from 'express'
require('express-async-errors')
import oAuth2Client from '../utils/authorization'
import { google } from 'googleapis'
const router = express.Router()

interface CustomRequest extends express.Request {
  body: {
    data: {
      summary: string
      startDateTime: Date
      endDateTime: Date
    }
  }
}

router.post('/create-event', (req: CustomRequest, res) => {
  void (async () => {
    const { data } = req.body
    const { summary, startDateTime, endDateTime } = data

    oAuth2Client.setCredentials({
      // Will eventually make database to store and retrieve user refresh tokens
      refresh_token: process.env.USER_REFRESH_TOKEN,
    })

    const calendar = google.calendar('v3')
    const response = await calendar.events.insert({
      // see substack and youtube posts
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      auth: oAuth2Client,
      calendarId: 'primary',
      requestBody: {
        summary: summary,
        colorId: '7',
        start: {
          dateTime: new Date(startDateTime),
        },
        end: {
          dateTime: new Date(endDateTime),
        },
        // see req.body available properties that could help with timeagent
      },
    })

    res.send(response)
    console.log('SUCCESS')
  })()
})

export default router
