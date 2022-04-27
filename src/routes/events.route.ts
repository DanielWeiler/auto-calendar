import express from 'express'
import eventsController from '../controllers/events.controller'
const router = express.Router()

router.get('/', eventsController.getEvents)

router.post('/set-working-hours', eventsController.setWorkingHours)

router.post('/set-available-hours', eventsController.setUnavailableHours)

router.post('/create-event', eventsController.createEvent)

router.post('/delete-event', eventsController.deleteEvent)

export default router
