import axios from 'axios'
const baseUrl = '/api/events'

const setWorkingHours = async (
  endpoint: string,
  workingHoursObject: object
) => {
  await axios.post(`${baseUrl}${endpoint}`, workingHoursObject)
}

const setUnavailableHours = async (
  endpoint: string,
  unavailableHoursObject: object
) => {
  await axios.post(`${baseUrl}${endpoint}`, unavailableHoursObject)
}

const createReminder = async (endpoint: string, reminderObject: object) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, reminderObject)
  return response.data
}

export default { setWorkingHours, setUnavailableHours, createReminder }
