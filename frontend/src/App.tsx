import { AlertColor } from '@mui/material'
import React, { useEffect, useState } from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import Calendar from './components/Calendar'
import Menu from './components/Menu'
import Notification from './components/Notification'
import ReminderForm from './components/ReminderForm'
import WeekAvailabilityForm from './components/WeekAvailabilityForm'
import WorkWeekForm from './components/WorkWeekForm'
import signInService from './services/sign-in'
import { NotificationDetails } from './types'
import {
  assertDefined,
  serverErrorMessage,
  warningMessages,
} from './utils/helpers'

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

  assertDefined(process.env.REACT_APP_GOOGLE_CLIENT_ID)

  const createNotification = (
    body: string,
    heading = '',
    style: AlertColor | undefined = undefined
  ) => {
    // Text that is unnecessary for the user is removed
    if (body.includes('Manually scheduled')) {
      body = body.substring(18)
    }

    newNotification = {
      style: style,
      heading: heading,
      body: body,
    }

    let warning = false
    warningMessages.map((warningMessage) =>
      body === warningMessage ? (warning = true) : null
    )

    if (warning) {
      newNotification.style = 'warning'
      newNotification.heading = 'Reminder scheduled with conflicts'
    } else if (
      body.includes(
        'There was no time slot available for this event before its deadline.'
      )
    ) {
      newNotification.style = 'error'
      newNotification.heading = 'Reminder was not scheduled'
    } else if (body === serverErrorMessage) {
      newNotification.style = 'error'
      if (heading !== 'Failed to sign in' && heading !== 'Failed to sign out') {
        newNotification.heading = '500 Internal Server Error'
      }
    }

    setNotification(newNotification)
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
      createNotification(serverErrorMessage)
    }
  }

  const handleLoginFailure = () => {
    createNotification(serverErrorMessage, 'Failed to sign in', 'error')
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedUser')
    setUser('')
    createNotification('')
  }

  const handleLogoutFailure = () => {
    createNotification(serverErrorMessage, 'Failed to sign out', 'error')
  }

  return (
    <Router>
      <div>
        <div className="notification">
          <Notification
            notification={notification}
            createNotification={createNotification}
          />
        </div>
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
            <Menu
              handleLogout={handleLogout}
              handleLogoutFailure={handleLogoutFailure}
            />
            <Routes>
              <Route path="/" element={<Calendar />} />
              <Route
                path="/create-event"
                element={
                  <ReminderForm createNotification={createNotification} />
                }
              />
              <Route
                path="/set-working-hours"
                element={
                  <WorkWeekForm createNotification={createNotification} />
                }
              />
              <Route
                path="/set-available-hours"
                element={
                  <WeekAvailabilityForm
                    createNotification={createNotification}
                  />
                }
              />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  )
}

export default App
