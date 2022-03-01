import axios from 'axios'
import React from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline
} from 'react-google-login'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import Menu from './components/Menu'
import ReminderForm from './components/ReminderForm'
import WorkingHoursForm from './components/WorkWeekForm'

function App() {
  const userCurrentDateTime = new Date()

  const responseGoogle = (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => {
    const { code } = response
    axios
      .post('/api/signin', { code })
      .then((response) => {
        console.log(response.data)
      })
      .catch((error) => console.log(error.message))

    console.log('signed in')

    axios
      .post('/api/events', { userCurrentDateTime })
      .then((response) => {
        console.log(response.data)
      })
      .catch((error) => console.log(error.message))
  }

  const responseError = (error: object) => {
    console.log(error)
  }

  return (
    <Router>
      <div className="container">
        <h1>Time Agent</h1>
        <GoogleLogin
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}
          buttonText="Sign in with Google"
          onSuccess={responseGoogle}
          onFailure={responseError}
          cookiePolicy={'single_host_origin'}
          responseType="code"
          accessType="offline"
          scope="openid email profile https://www.googleapis.com/auth/calendar"
        />
        <Menu />
        {/* <Notification /> */}
        <Routes>
          <Route path="/" element={<ReminderForm/>} />
          <Route path="/set-working-hours" element={<WorkingHoursForm/>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
