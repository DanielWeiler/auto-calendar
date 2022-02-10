import React from 'react'
import './App.css'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import axios from 'axios'
import ReminderForm from './components/ReminderForm'

function App() {
  const responseGoogle = (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => {
    console.log(response)

    const { code } = response
    axios
      .post('/api/signin', { code })
      .then((response) => {
        console.log(response.data)
      })
      .catch((error) => console.log(error.message))
  }

  const responseError = (error: object) => {
    console.log(error)
  }

  return (
    <div>
      <div className='App'>
        <h1>Google</h1>
      </div>
        <GoogleLogin
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}
          buttonText='Sign in with Google'
          onSuccess={responseGoogle}
          onFailure={responseError}
          cookiePolicy={'single_host_origin'}
          responseType='code'
          accessType='offline'
          scope='openid email profile https://www.googleapis.com/auth/calendar'
        />
        <ReminderForm/>
    </div>
  )
}

export default App
