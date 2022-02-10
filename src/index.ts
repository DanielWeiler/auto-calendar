import express from 'express'
//import createError from 'http-errors'
import 'dotenv/config'
import signinRouter from './routes/signin'
import eventsRouter from './routes/events'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/signin', signinRouter)
app.use('/api/events', eventsRouter)

/* app.use((_req, _res, next) => {
  // added new 
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  next(new createError.NotFound())
}) */

// search typescript error handler - this is used with the next in signin.ts
/* app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send({
    status: err.status || 500,
    message: err.message,
  })
}) */

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`))