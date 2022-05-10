import axios from 'axios'
const baseUrl = '/api/events'

const getEvents = () => {
  const request = axios.get(baseUrl)
  return request.then((response) => response.data)
}

const setWorkingHours = async (endpoint: string, workingHoursData: object) => {
  await axios.post(`${baseUrl}${endpoint}`, workingHoursData)
}

const setUnavailableHours = async (
  endpoint: string,
  unavailableHoursData: object
) => {
  await axios.post(`${baseUrl}${endpoint}`, unavailableHoursData)
}

const createEvent = async (endpoint: string, eventData: object) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, eventData)
  return response.data
}

const deleteEvent = async (endpoint: string, eventId: string) => {
  await axios.post(`${baseUrl}${endpoint}`, { eventId })
}

const rescheduleEvent = async (endpoint: string, rescheduleData: object) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, rescheduleData)
  return response.data
}

export default {
  getEvents,
  setWorkingHours,
  setUnavailableHours,
  createEvent,
  deleteEvent,
  rescheduleEvent,
}
