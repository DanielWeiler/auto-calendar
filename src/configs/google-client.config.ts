import { google } from 'googleapis'
const env = process.env

const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'https://auto-calendar-app.herokuapp.com'
)

export default oAuth2Client