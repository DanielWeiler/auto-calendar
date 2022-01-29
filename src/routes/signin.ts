import express from 'express'
import { google } from 'googleapis'

const router = express.Router()

interface CustomRequest extends express.Request{
  body: {
    code: string
  }
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'http://localhost:3000'
)

// async deleted
/* router.get('/', (_req, res, next) => {
  res.send({ message: 'Ok api is working 🚀' })
}) */

// async deleted
router.post('/', (req: CustomRequest, res, next) => {
  try {
    void (async () => {
      const { code } = req.body
      const response = await oauth2Client.getToken(code) // may need to use 
      // destructruing here like vid to get the refresh token
      res.send(response)

      // the first time a user is authorized you get a refresh token in the 
      // response which needs to be saved to a database containing the users
      // so that you can use it to create events for the user
    })()
  } catch (error) {
    console.log(error)

    next(error)
  }
})

// changed from module.exports =
export default router
