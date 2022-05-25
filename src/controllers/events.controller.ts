import { NextFunction, Response } from 'express'
import eventsService from '../services/events.service'
import weeklyHoursService from '../services/weekly-hours.service'
import {
  CreateEventRequest,
  DeleteEventRequest,
  GetEventsRequest,
  RescheduleEventRequest,
  SetWeeklyHoursRequest,
} from '../types'

function setUnavailableHours(
  req: SetWeeklyHoursRequest,
  res: Response,
  next: NextFunction
): void {
  void (async () => {
    try {
      const { user, data } = req.body
      res.send(await weeklyHoursService.setUnavailableHours(user, { data }))
    } catch (error) {
      console.error('Error while setting available hours')
      next(error)
    }
  })()
}

function setWorkingHours(
  req: SetWeeklyHoursRequest,
  res: Response,
  next: NextFunction
): void {
  void (async () => {
    try {
      const { user, data } = req.body
      res.send(await weeklyHoursService.setWorkingHours(user, { data }))
    } catch (error) {
      console.error('Error while setting working hours')
      next(error)
    }
  })()
}

function getEvents(
  req: GetEventsRequest,
  res: Response,
  next: NextFunction
): void {
  void (async () => {
    try {
      res.send(await eventsService.getEvents(req.body.user))
    } catch (error) {
      console.error('Error while getting events')
      next(error)
    }
  })()
}

function createEvent(
  req: CreateEventRequest,
  res: Response,
  next: NextFunction
): void {
  void (async () => {
    try {
      const { user, data } = req.body
      res.send(await eventsService.createEvent(user, data))
    } catch (error) {
      console.error('Error while creating event')
      next(error)
    }
  })()
}

function rescheduleEvent(
  req: RescheduleEventRequest,
  res: Response,
  next: NextFunction
): void {
  void (async () => {
    try {
      const { user, data } = req.body
      res.send(await eventsService.rescheduleEvent(user, data))
    } catch (error) {
      console.error('Error while rescheduling event')
      next(error)
    }
  })()
}

function deleteEvent(
  req: DeleteEventRequest,
  res: Response,
  next: NextFunction
): void {
  void (async () => {
    try {
      const { eventId, user } = req.body
      res.send(await eventsService.deleteEvent(eventId, user))
    } catch (error) {
      console.error('Error while deleting event')
      next(error)
    }
  })()
}

export default {
  setUnavailableHours,
  setWorkingHours,
  getEvents,
  createEvent,
  rescheduleEvent,
  deleteEvent,
}
