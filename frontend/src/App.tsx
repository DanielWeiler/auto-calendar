import React, { useEffect, useState } from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
  GoogleLogout,
} from 'react-google-login'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import Menu from './components/Menu'
import ReminderForm from './components/ReminderForm'
import WeekAvailabilityForm from './components/WeekAvailabilityForm'
import WorkingHoursForm from './components/WorkWeekForm'
import signInService from './services/sign-in'
import { assertDefined } from './utils/helpers'

function App() {
  const [user, setUser] = useState('')

  useEffect(() => {
    const loggedUser = window.localStorage.getItem('loggedUser')
    if (loggedUser) {
      setUser(loggedUser)
    }
  }, [])

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
      console.log(
        '500 Internal Server Error \n Oh no! Something bad happened. Please',
        'come back later when we have fixed this problem. Thanks.'
      )
    }
  }

  const handleLoginFailure = (error: object) => {
    // insert notification
    console.log('Failed to log in', error)
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedUser')
    setUser('')
  }

  const handleLogoutFailure = () => {
    // insert notification
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
              <Route path="/set-available-hours" element={<WeekAvailabilityForm />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  )
}

export default App
