import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
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
import { Link } from 'react-router-dom'

const Menu = () => {
  const [visibility, setVisibility] = useState(false)

  const toggleDrawer = () => {
    const changeVisibility = !visibility
    setVisibility(changeVisibility)
  }

  return (
    <div>
      <Button onClick={toggleDrawer}>
        <ListItemIcon>
          <MenuIcon />
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
          </List>
        </Box>
      </Drawer>
    </div>
  )
}

export default Menu
