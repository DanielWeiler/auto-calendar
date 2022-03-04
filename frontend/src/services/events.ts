import axios from 'axios'
const baseUrl = '/api/events'

const setWorkingHours = async (
  endpoint: string,
  workingHoursObject: object
) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, workingHoursObject)
  return response.data
}

const createReminder = async (endpoint: string, reminderObject: object) => {
  const response = await axios.post(`${baseUrl}${endpoint}`, reminderObject)
  return response.data
}

export default { setWorkingHours, createReminder }
