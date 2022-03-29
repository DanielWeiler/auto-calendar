import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import eventsRouter from './routes/events.route'
import signinRouter from './routes/sign-in.route'
import { HttpException } from './types'
import { assertDefined } from './utils/helpers'
const app = express()

assertDefined(process.env.MONGODB_URI)
console.log('connecting to MongoDB')
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error: Error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/api/signin', signinRouter)
app.use('/api/events', eventsRouter)

app.use(
  (err: HttpException, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500)
    res.send({
      status: err.status || 500,
      message: err.message,
    })
  }
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`))
