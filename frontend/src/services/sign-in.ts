import axios from 'axios'
const baseUrl = '/api/sign-in'

const signIn = async (signInData: object) => {
  await axios.post(`${baseUrl}`, signInData)
}

export default { signIn }
