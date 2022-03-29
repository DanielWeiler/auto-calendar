import { Response } from 'express'
import eventsService from '../services/events.service'
import { CreateEventRequest, SetWeeklyHoursRequest } from '../types'

function setWorkingHours(req: SetWeeklyHoursRequest, _res: Response) {
  eventsService.setWorkingHours(req.body)
}

function setUnavailableHours(req: SetWeeklyHoursRequest, _res: Response) {
  eventsService.setUnavailableHours(req.body)
}

function createEvent(req: CreateEventRequest, _res: Response) {
  eventsService.createEvent(req.body.data)
}

export default { setWorkingHours, setUnavailableHours, createEvent }
