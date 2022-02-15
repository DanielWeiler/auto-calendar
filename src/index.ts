import express, { NextFunction, Request, Response } from 'express'
import 'dotenv/config'
import signinRouter from './routes/signin'
import eventsRouter from './routes/events'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/signin', signinRouter)
app.use('/api/events', eventsRouter)

interface HttpException extends Error {
  status: number
}

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
