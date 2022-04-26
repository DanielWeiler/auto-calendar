import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import WorkHistoryIcon from '@mui/icons-material/WorkHistory'
import {
  Box,
  Button,
  Drawer,
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
      <Button onClick={toggleDrawer}>
        <ListItemIcon>
          <MenuIcon style={{ color: 'white' }} />
        </ListItemIcon>
      </Button>
      <Drawer anchor="left" open={visibility} onClose={toggleDrawer}>
        <Box onClick={toggleDrawer}>
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
          </List>
        </Box>
      </Drawer>
    </div>
  )
}

export default Menu
