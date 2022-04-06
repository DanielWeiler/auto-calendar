import { NextFunction, Response } from 'express'
import eventsService from '../services/events.service'
import { CreateEventRequest, SetWeeklyHoursRequest } from '../types'

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

async function createEvent(
  req: CreateEventRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.send(await eventsService.createEvent(req.body.data))
  } catch (error) {
    console.error('Error while creating event')
    next(error)
  }
}

export default { setWorkingHours, setUnavailableHours, createEvent }
