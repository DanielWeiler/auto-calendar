import { Paper } from '@mui/material'
import React from 'react'
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login'
import { assertDefined } from '../utils/helpers'

const SignInForm = (props: {
  handleLogin: (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => Promise<void>
  handleLoginFailure: () => void
}) => {
  const { handleLogin, handleLoginFailure } = props

  assertDefined(process.env.REACT_APP_GOOGLE_CLIENT_ID)

  const login = (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => {
    handleLogin(response)
  }

  const loginFailure = () => {
    handleLoginFailure()
  }

  return (
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
            onSuccess={login}
            onFailure={loginFailure}
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
          Auto calendar creates its own calendar in your google account. Your
          other google calendars will not be affected. No information about the
          user, their calendar, or their events is stored.
        </div>
      </Paper>
    </div>
  )
}

export default SignInForm
