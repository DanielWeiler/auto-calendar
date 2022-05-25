import axios from 'axios'
import { EventFormValues, WeeklyHoursFormValues } from '../types'
const baseUrl = '/api/events'

const setUnavailableHours = async (
  endpoint: string,
  user: string,
  data: WeeklyHoursFormValues
) => {
  await axios.post(`${baseUrl}${endpoint}`, { user, data })
}

const setWorkingHours = async (
  endpoint: string,
  user: string,
  data: WeeklyHoursFormValues
) => {
  await axios.post(`${baseUrl}${endpoint}`, { user, data })
}

const getEvents = (user: string) => {
  const request = axios.post(baseUrl, { user })
  return request.then((response) => response.data)
}

const createEvent = async (
  endpoint: string,
  user: string,
  data: EventFormValues
) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, {
    user,
    data,
  })
  return response.data
}

const rescheduleEvent = async (
  endpoint: string,
  user: string,
  data: object
) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, {
    user,
    data,
  })
  return response.data
}

const deleteEvent = async (endpoint: string, user: string, eventId: string) => {
  await axios.post(`${baseUrl}${endpoint}`, { user, eventId })
}

export default {
  setUnavailableHours,
  setWorkingHours,
  getEvents,
  createEvent,
  rescheduleEvent,
  deleteEvent,
}
