import React, { useState } from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
  GoogleLogout
} from 'react-google-login'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import Menu from './components/Menu'
import ReminderForm from './components/ReminderForm'
import WeekAvailabilityForm from './components/WeekAvailabilityForm'
import WorkingHoursForm from './components/WorkWeekForm'
import { assertDefined } from './utils/helpers'
import signInService from './services/sign-in'

function App() {
  const [user, setUser] = useState('')

  const handleLogin = (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => {
    const { code } = response
    code ? setUser(code) : null
    const userCurrentDateTime = new Date()

    signInService.signIn({ code, userCurrentDateTime })
    console.log('signed in')
  }

  const handleLoginFailure = (error: object) => {
    console.log(error)
  }

  const handleLogout = () => {
    setUser('')
  }

  const handleLogoutFailure = () => {
    console.log('Failed to log out')
  }

  assertDefined(process.env.REACT_APP_GOOGLE_CLIENT_ID)

  return (
    <Router>
      <div className="container">
        <h1>Time Agent</h1>
        {!user ? (
          <GoogleLogin
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
            buttonText="Sign in with Google"
            onSuccess={handleLogin}
            onFailure={handleLoginFailure}
            cookiePolicy={'single_host_origin'}
            responseType="code"
            accessType="offline"
            scope="openid email profile https://www.googleapis.com/auth/calendar"
          />
        ) : (
          <div>
            <GoogleLogout
              clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
              buttonText="Sign out"
              onLogoutSuccess={handleLogout}
              onFailure={handleLogoutFailure}
            />
            <Menu />
            {/* <Notification /> */}
            <Routes>
              <Route path="/" element={<ReminderForm />} />
              <Route path="/set-working-hours" element={<WorkingHoursForm />} />
              <Route path="/set-unavailable-hours" element={<WeekAvailabilityForm />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  )
}

export default App
