import { AlertColor, Paper } from '@mui/material'
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
import EventForm from './components/EventForm'
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
      if (heading !== 'Failed to sign in' && heading !== 'Failed to sign out') {
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
        {!user ? (
          <div className="sign-in-page">
            <Paper className="sign-in-form" elevation={8}>
              <div style={{ display: 'flex' }}>
                <h1
                  style={{
                    fontFamily: 'Century Gothic',
                    fontWeight: '400',
                    marginRight: '6px',
                  }}
                >
                  Auto
                </h1>
                <h1 style={{ fontWeight: '500' }}>Calendar</h1>
              </div>
              <img
                src="logo-192x192.png"
                alt="Auto Calendar Logo"
                style={{ maxWidth: '150px', maxHeight: '150px' }}
              />
              <h3
                style={{
                  margin: '1.1em 0em 1.5em',
                  textAlign: 'center',
                  fontWeight: '500',
                }}
              >
                Plan less and get more done
              </h3>
              <div>
                <GoogleLogin
                  clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
                  buttonText="Sign in with Google"
                  onSuccess={handleLogin}
                  onFailure={handleLoginFailure}
                  cookiePolicy={'single_host_origin'}
                  responseType="code"
                  accessType="offline"
                  scope="openid email profile https://www.googleapis.com/auth/calendar"
                  theme="dark"
                />
              </div>
              <div
                style={{
                  fontSize: 'small',
                  color: 'lightslategray',
                  margin: '12px 8px',
                  textAlign: 'justify',
                }}
              >
                Auto calendar creates its own calendar in your google account.
                Your other google calendars will not be affected. No information
                about the user, their calendar, or their events is stored.
              </div>
            </Paper>
          </div>
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
