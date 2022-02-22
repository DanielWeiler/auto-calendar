import express, { NextFunction, Request, Response } from 'express'
import 'dotenv/config'
import mongoose from 'mongoose'
import { router as signinRouter } from './routes/signin'
import eventsRouter from './routes/events'
import { HttpException } from './types'
const app = express()

console.log('connecting to MongoDB')
mongoose
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  .connect(process.env.MONGODB_URI!)
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
