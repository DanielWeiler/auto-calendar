import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import WorkHistoryIcon from '@mui/icons-material/WorkHistory'
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import React, { useState } from 'react'
import { GoogleLogout } from 'react-google-login'
import { Link } from 'react-router-dom'
import { assertDefined } from '../utils/helpers'

const Menu = (props: {
  handleLogout: () => void
  handleLogoutFailure: () => void
}) => {
  const { handleLogout, handleLogoutFailure } = props

  const [visibility, setVisibility] = useState(false)

  const toggleDrawer = () => {
    const changeVisibility = !visibility
    setVisibility(changeVisibility)
  }

  const logout = () => {
    handleLogout()
  }

  const logoutFailure = () => {
    handleLogoutFailure()
  }

  assertDefined(process.env.REACT_APP_GOOGLE_CLIENT_ID)

  return (
    <div className="menu-button">
      <IconButton onClick={toggleDrawer}>
        <MenuIcon style={{ color: 'white' }} />
      </IconButton>
      <Drawer anchor="left" open={visibility} onClose={toggleDrawer}>
        <Box style={{ maxWidth: '15.5em' }} onClick={toggleDrawer}>
          <Box style={{ padding: '0px 16px 16px', background: '#5db9ff29' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src="logo-192x192.png"
                alt="Auto Calendar Logo"
                style={{
                  maxWidth: '50px',
                  maxHeight: '50px',
                  marginTop: '12px',
                }}
              />
              <div style={{ display: 'flex', margin: '4px 0px 0px 16px' }}>
                <h3
                  style={{
                    fontFamily: 'Century Gothic',
                    fontWeight: '400',
                    marginRight: '6px',
                  }}
                >
                  Auto
                </h3>
                <h3 style={{ fontWeight: '500' }}>Calendar</h3>
              </div>
            </div>
            <div
              style={{
                margin: '10px 0px',
                fontSize: '0.9em',
                textAlign: 'center',
              }}
            >
              Auto calendar manages your schedule so you don&apos;t have to.
            </div>
            <hr />
            <div
              style={{
                marginBottom: '8px',
                fontSize: '0.9em',
                textAlign: 'justify',
              }}
            >
              Wave goodbye to overwhelming to-do lists. Store all your tasks in
              Auto Calendar so it can help you:
            </div>
            <div
              style={{
                marginLeft: '4px',
                fontSize: '0.85em',
              }}
            >
              <li>Find the best time for each task</li>
              <li>Remember every task</li>
              <li>Create a schedule without time conflicts</li>
              <li>Easily adjust your schedule based on your availability</li>
            </div>
          </Box>
          <List>
            <Link className="drawer-link" to="/set-available-hours">
              <ListItem>
                <ListItemIcon>
                  <AccessTimeFilledIcon />
                </ListItemIcon>
                <ListItemText primary={'Set Available Hours'} />
              </ListItem>
            </Link>
            <Link className="drawer-link" to="/set-working-hours">
              <ListItem>
                <ListItemIcon>
                  <WorkHistoryIcon />
                </ListItemIcon>
                <ListItemText primary={'Set Working Hours'} />
              </ListItem>
            </Link>
            <ListItem>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <GoogleLogout
                clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
                buttonText="Sign out"
                onLogoutSuccess={logout}
                onFailure={logoutFailure}
              />
            </ListItem>
            <ListItem
              style={{
                display: 'block',
                position: 'fixed',
                bottom: '10px',
                maxWidth: '18em',
                fontSize: '0.9em',
              }}
            >
              Read more about the idea behind Auto Calendar{' '}
              <a
                href="https://hbr.org/2012/01/to-do-lists-dont-work"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </div>
  )
}

export default Menu
