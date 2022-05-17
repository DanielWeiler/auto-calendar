import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material'
import React, { useState } from 'react'

const EventFormInfoButton = () => {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className="event-form-info-button">
      <IconButton onClick={handleOpen}>
        <InfoOutlinedIcon />
      </IconButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Event Types</DialogTitle>
        <DialogContent>
          <div style={{ margin: '0px 0px 4px' }}>Manual events</div>
          <div style={{ fontSize: '0.9em', color: 'rgba(0, 0, 0, 0.6)' }}>
            <li>Scheduled just like regular calendar events</li>
            <li>
              When scheduled, any events happening during the same time (except
              other manual events) will be rescheduled to a suitable time.
            </li>
          </div>
          <div style={{ margin: '16px 0px 4px' }}>Auto events</div>
          <div style={{ fontSize: '0.9em', color: 'rgba(0, 0, 0, 0.6)' }}>
            <li>
              Automatically scheduled to an open time based on your availability
            </li>
            <li>
              You can choose when the event will look for availability and you
              can provide a deadline to be sure it will be scheduled before the
              deadline.
            </li>
          </div>
          <div style={{ fontSize: '0.8em', marginTop: '24px' }}>
            <i>NB: </i> Events can also be viewed in Google Calendar but it is
            not recommended to edit events from there.
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

export default EventFormInfoButton
