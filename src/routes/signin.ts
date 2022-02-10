import express from 'express'
import oAuth2Client from '../utils/authorization'

const router = express.Router()

interface CustomRequest extends express.Request{
  body: {
    code: string
  }
}

// async deleted
router.post('/', (req: CustomRequest, res, next) => {
  try {
    void (async () => {
      const { code } = req.body
      const response = await oAuth2Client.getToken(code) // may need to use 
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
