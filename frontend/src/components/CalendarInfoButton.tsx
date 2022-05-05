import InfoIcon from '@mui/icons-material/Info'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from '@mui/material'
import React, { useState } from 'react'

const CalendarInfoButton = () => {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className="calendar-info-button">
      <IconButton onClick={handleOpen}>
        <InfoIcon style={{ color: 'white' }} />
      </IconButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Calendar Events Key</DialogTitle>
        <DialogContent className="calendar-info-content">
          <div style={{display: 'flex'}}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '8px',
                marginRight: '8px',
                marginBottom: '12px',
                backgroundColor: 'rgb(243 210 50 / 93%)',
              }}
            />
            <DialogContentText>Manual event</DialogContentText>
          </div>
          <div style={{display: 'flex'}}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '8px',
                marginRight: '8px',
                marginBottom: '12px',
                backgroundColor: 'LightSkyBlue',
              }}
            />
            <DialogContentText>Auto event with no deadline</DialogContentText>
          </div>
          <div style={{display: 'flex'}}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '8px',
                marginRight: '8px',
                backgroundColor: 'RoyalBlue',
              }}
            />
            <DialogContentText>Auto event with a deadline</DialogContentText>
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              handleClose()
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default CalendarInfoButton
