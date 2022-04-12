import axios from 'axios'
const baseUrl = '/api/events'

const setWorkingHours = async (
  endpoint: string,
  workingHoursData: object
) => {
  await axios.post(`${baseUrl}${endpoint}`, workingHoursData)
}

const setUnavailableHours = async (
  endpoint: string,
  unavailableHoursData: object
) => {
  await axios.post(`${baseUrl}${endpoint}`, unavailableHoursData)
}

const createReminder = async (endpoint: string, reminderData: object) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, reminderData)
  return response.data
}

export default { setWorkingHours, setUnavailableHours, createReminder }
