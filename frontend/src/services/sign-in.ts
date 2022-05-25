import axios from 'axios'
const baseUrl = '/api/sign-in'

const signIn = async (signInData: object) => {
  const response = await axios.post(baseUrl, signInData)
  return response.request.response
}

export default { signIn }
