/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Response } from 'express'
import eventsService from '../services/events.service'
import { CreateEventRequest, SetWeeklyHoursRequest } from '../types'

function setWorkingHours(req: SetWeeklyHoursRequest, res: Response, next: NextFunction) {
  try {
    res.json(eventsService.setWorkingHours(req.body))
  } catch (error: any) {
    console.error(`Error while setting working hours`, error.message)
    next(error)
  }
}

function setUnavailableHours(req: SetWeeklyHoursRequest, res: Response, next: NextFunction) {
  try {
    res.json(eventsService.setUnavailableHours(req.body))
  } catch (error: any) {
    console.error(`Error while setting available hours`, error.message)
    next(error)
  }
}

function createEvent(req: CreateEventRequest, res: Response, next: NextFunction) {
  try {
    res.json(eventsService.createEvent(req.body.data))
  } catch (error: any) {
    console.error(`Error while creating event`, error.message)
    next(error)
  }
}

export default { setWorkingHours, setUnavailableHours, createEvent }
