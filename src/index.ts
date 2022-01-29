import express from 'express'
//import createError from 'http-errors'
//require('dotenv').config()
import 'dotenv/config'
import signinRouter from './routes/signin'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// async deleted
app.get('/', (_req, res, /* next */) => {
  res.send({ message: 'Awesome it works 🐻' })
})

app.use('/api/signin', signinRouter)

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