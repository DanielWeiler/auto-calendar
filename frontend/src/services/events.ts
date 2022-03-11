import axios from 'axios'
const baseUrl = '/api/events'

const setWorkingHours = async (
  endpoint: string,
  workingHoursObject: object
) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, workingHoursObject)
  return response.data
}

const setUnavailableHours = async (
  endpoint: string,
  unavailableHoursObject: object
) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, unavailableHoursObject)
  return response.data
}

const createReminder = async (endpoint: string, reminderObject: object) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, reminderObject)
  return response.data
}

export default { setWorkingHours, setUnavailableHours, createReminder }
