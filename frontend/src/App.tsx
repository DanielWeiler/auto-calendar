import { AlertColor } from '@mui/material'
import React, { useEffect, useState } from 'react'
import {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import Calendar from './components/Calendar'
import EventForm from './components/EventForm'
import Menu from './components/Menu'
import Notification from './components/Notification'
import SignInForm from './components/SignInForm'
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
  // If app is not running in development mode, and if app is using the HTTP
  // protocol, redirect app to use HTTPS protocol.
  if (location.href !== 'http://localhost:3000/') {
    if (location.protocol !== 'https:') {
      location.protocol = 'https:'
    }
  }
  
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

  /**
   * Creates a notification for the user. Determines what the notification should
   * be basen on the given parameters.
   * @param {string} body - The body of the notification
   * @param {string} heading - The heading of the notification
   * @param {AlertColor | undefined} style - The style of the notification
   */
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
      newNotification.heading = 'Event scheduled with conflicts'
    } else if (
      body.includes(
        'There was no time slot available for this event before its deadline.'
      )
    ) {
      newNotification.style = 'error'
      newNotification.heading = 'Event was not scheduled'
    } else if (body === serverErrorMessage) {
      newNotification.style = 'error'
      if (
        heading !== 'Failed to sign in — Try signing in again' &&
        heading !== 'Failed to sign out'
      ) {
        newNotification.heading =
          '500 Internal Server Error — Try signing in again'
      }
    }

    if (
      newNotification.heading ===
      '500 Internal Server Error — Try signing in again'
    ) {
      window.localStorage.removeItem('loggedUser')
      setUser('')
    }

    setNotification(newNotification)
  }

  const handleLogin = async (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => {
    const { code } = response

    try {
      assertDefined(code)
      const newUser = await signInService.signIn({ code })
      window.localStorage.setItem('loggedUser', newUser)
      setUser(newUser)
    } catch (error) {
      createNotification(serverErrorMessage)
    }
  }

  const handleLoginFailure = () => {
    createNotification(
      serverErrorMessage,
      'Failed to sign in — Try signing in again',
      'error'
    )
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
        {!user ? (
          <SignInForm
            handleLogin={handleLogin}
            handleLoginFailure={handleLoginFailure}
          />
        ) : (
          <div>
            <Menu
              handleLogout={handleLogout}
              handleLogoutFailure={handleLogoutFailure}
            />
            <Routes>
              <Route
                path="/"
                element={<Calendar createNotification={createNotification} />}
              />
              <Route
                path="/create-event"
                element={<EventForm createNotification={createNotification} />}
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
        <div className="notification">
          <Notification
            notification={notification}
            createNotification={createNotification}
          />
        </div>
      </div>
    </Router>
  )
}

export default App
