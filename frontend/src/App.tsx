import React, { useEffect, useState } from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
  GoogleLogout,
} from 'react-google-login'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import Calendar from './components/Calendar'
import Menu from './components/Menu'
import Notification from './components/Notification'
import ReminderForm from './components/ReminderForm'
import WeekAvailabilityForm from './components/WeekAvailabilityForm'
import WorkingHoursForm from './components/WorkWeekForm'
import signInService from './services/sign-in'
import { NotificationDetails } from './types'
import { assertDefined, serverErrorMessage } from './utils/helpers'

function App() {
  let newNotification: NotificationDetails = {
    style: undefined,
    heading: '',
    body: '',
  }
  const [notification, setNotification] = useState(newNotification)
  const [user, setUser] = useState('')

  useEffect(() => {
    const loggedUser = window.localStorage.getItem('loggedUser')
    if (loggedUser) {
      setUser(loggedUser)
    }
  }, [])

  const createNotification = (heading: string, body = '') => {
    newNotification = {
      style: 'error',
      heading: heading,
      body: body,
    }

    setNotification(newNotification)
    setTimeout(() => {
      setNotification({
        style: undefined,
        heading: '',
        body: '',
      })
    }, 10000)
  }

  const handleLogin = async (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => {
    const { code } = response

    try {
      assertDefined(code)
      window.localStorage.setItem('loggedUser', code)
      await signInService.signIn({ code })
      setUser(code)
    } catch (error) {
      createNotification('500 Internal Server Error', serverErrorMessage)
    }
  }

  const handleLoginFailure = () => {
    createNotification('Failed to sign in', serverErrorMessage)
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedUser')
    setUser('')
  }

  const handleLogoutFailure = () => {
    createNotification('Failed to sign out', serverErrorMessage)
  }

  assertDefined(process.env.REACT_APP_GOOGLE_CLIENT_ID)

  return (
    <Router>
      <div className="container">
        <h1>Time Agent</h1>
        <Notification notification={notification} />
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
            <Routes>
              <Route path="/" element={<Calendar />} />
              <Route path="/create-event" element={<ReminderForm />} />
              <Route path="/set-working-hours" element={<WorkingHoursForm />} />
              <Route
                path="/set-available-hours"
                element={<WeekAvailabilityForm />}
              />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  )
}

export default App
