import { NextFunction, Request, Response } from 'express'
import eventsService from '../services/events.service'
import {
  CreateEventRequest,
  DeleteEventRequest,
  RescheduleEventRequest,
  SetWeeklyHoursRequest,
} from '../types'

function getEvents(_req: Request, res: Response, next: NextFunction): void {
  try {
    void (async () => {
      res.send(await eventsService.getEvents())
    })()
  } catch (error) {
    console.error('Error while getting events')
    next(error)
  }
}

function setWorkingHours(
  req: SetWeeklyHoursRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    res.send(eventsService.setWorkingHours(req.body))
  } catch (error) {
    console.error('Error while setting working hours')
    next(error)
  }
}

function setUnavailableHours(
  req: SetWeeklyHoursRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    res.send(eventsService.setUnavailableHours(req.body))
  } catch (error) {
    console.error('Error while setting available hours')
    next(error)
  }
}

function createEvent(
  req: CreateEventRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    void (async () => {
      res.send(await eventsService.createEvent(req.body.data))
    })()
  } catch (error) {
    console.error('Error while creating event')
    next(error)
  }
}

function deleteEvent(
  req: DeleteEventRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    void (async () => {
      res.send(await eventsService.deleteEvent(req.body.eventId))
    })()
  } catch (error) {
    console.error('Error while deleting event')
    next(error)
  }
}

function rescheduleEvent(
  req: RescheduleEventRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    void (async () => {
      res.send(await eventsService.rescheduleEvent(req.body))
    })()
  } catch (error) {
    console.error('Error while rescheduling event')
    next(error)
  }
}

export default {
  getEvents,
  setWorkingHours,
  setUnavailableHours,
  createEvent,
  deleteEvent,
  rescheduleEvent,
}
