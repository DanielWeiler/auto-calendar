import express from 'express'
require('express-async-errors')
import { CreateEventRequest } from '../types'
import RefreshTokenModel from '../models/refresh_token'
import { signedInUser } from './signin'
import oAuth2Client from '../utils/authorization'
import { google } from 'googleapis'
const router = express.Router()

router.post('/create-event', (req: CreateEventRequest, res) => {
  void (async () => {
    const { data } = req.body
    const { summary, startDateTime, endDateTime } = data

    const query = await RefreshTokenModel.find({ user: signedInUser })
    const refreshToken = query[0].refreshToken
    oAuth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    const calendar = google.calendar('v3')
    const response = await calendar.events.insert({
      // see stack overflow and youtube posts
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
