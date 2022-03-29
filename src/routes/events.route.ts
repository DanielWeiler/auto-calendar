import express from 'express'
import eventsController from '../controllers/events.controller'
const router = express.Router()

router.post('/set-working-hours', eventsController.setWorkingHours)

router.post('/set-unavailable-hours', eventsController.setUnavailableHours)

router.post('/create-event', eventsController.createEvent)

export default router
