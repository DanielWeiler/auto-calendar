import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import React, { ChangeEvent } from 'react'
import { EventData } from '../types'

const EventOptions = (props: {
  eventOpen: boolean
  handleEventClose: () => void
  eventData: EventData
  rescheduleTime: Date | null
  handleDateTimePicker: (newTime: Date | null) => void
  checked: boolean
  handleCheckbox: (event: ChangeEvent<HTMLInputElement>) => void
  handleDeleteEvent: () => void
  handleRescheduleEvent: () => void
}) => {
  const {
    eventOpen,
    handleEventClose,
    eventData,
    rescheduleTime,
    handleDateTimePicker,
    checked,
    handleCheckbox,
    handleDeleteEvent,
    handleRescheduleEvent,
  } = props

  return (
    <Dialog open={eventOpen} onClose={handleEventClose}>
      <DialogTitle>{eventData.title}</DialogTitle>
      <DialogContent className="event-details">
        <div style={{ paddingLeft: '12px', paddingBottom: '20px' }}>
          <div style={{ paddingBottom: '8px' }}>
            {eventData.start?.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            {' • '}
            {eventData.start?.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' — '}
            {eventData.end?.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div>
            {eventData.deadline
              ? 'Deadline: ' +
                eventData.deadline.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }) +
                ' • ' +
                eventData.deadline?.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </div>
        </div>
        <div className="reschedule-form">
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateTimePicker
              label="Reschedule to..."
              value={rescheduleTime}
              onChange={handleDateTimePicker}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
          <div
            style={{
              paddingTop: '4px',
              paddingBottom: '12px',
              fontSize: '0.85em',
              color: 'gray',
            }}
          >
            {eventData.deadline
              ? 'If the time chosen is after the deadline, the deadline will be deleted.'
              : ''}
          </div>
          <FormControlLabel
            control={
              <Checkbox
                checked={checked}
                onChange={handleCheckbox}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label={
              <Typography style={{ fontSize: '0.9em', minWidth: '210px' }}>
                If this time is busy, reschedule at the next open time after
                this time.
              </Typography>
            }
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          style={{ color: 'red', position: 'absolute', left: '8px' }}
          onClick={() => {
            handleEventClose()
            handleDeleteEvent()
          }}
        >
          Delete
        </Button>
        <Button
          onClick={() => {
            handleEventClose()
          }}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            handleEventClose()
            handleRescheduleEvent()
          }}
        >
          Reschedule
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EventOptions
