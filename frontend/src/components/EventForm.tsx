import {
  AlertColor,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import eventService from '../services/events'
import { EventFormValues } from '../types'
import { addTimeToDate, serverErrorMessage } from '../utils/helpers'
import Header from './Header'
import EventFormInfoButton from './EventFormInfoButton'

const EventForm = (props: {
  createNotification: (
    body: string,
    heading: string,
    style: AlertColor | undefined
  ) => void
}) => {
  const { createNotification } = props
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<EventFormValues>()

  const [scheduleValue, setScheduleValue] = useState('auto')
  const [autoDisabled, setAutoDisabled] = useState(false)
  const [manualDisabled, setManualDisabled] = useState(true)
  const [scheduleDisabled, setScheduleDisabled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    createNotification('', '', undefined)
  }, [])

  const durationOptions = [
    { value: '5', text: '5 minutes' },
    { value: '10', text: '10 minutes' },
    { value: '15', text: '15 minutes' },
    { value: '20', text: '20 minutes' },
    { value: '25', text: '25 minutes' },
    { value: '30', text: '30 minutes' },
    { value: '35', text: '35 minutes' },
    { value: '40', text: '40 minutes' },
    { value: '45', text: '45 minutes' },
    { value: '50', text: '50 minutes' },
    { value: '60', text: '1 hour' },
    { value: '75', text: '1 hr 15 min' },
    { value: '90', text: '1 hr 30 min' },
    { value: '105', text: '1 hr 45 min' },
    { value: '120', text: '2 hours' },
    { value: '135', text: '2 hr 15 min' },
    { value: '150', text: '2 hr 30 min' },
    { value: '165', text: '2 hr 45 min' },
    { value: '180', text: '3 hours' },
    { value: '195', text: '3 hr 15 min' },
    { value: '210', text: '3 hr 30 min' },
    { value: '225', text: '3 hr 45 min' },
    { value: '240', text: '4 hours' },
    { value: '270', text: '4 hr 30 min' },
    { value: '300', text: '5 hours' },
    { value: '330', text: '5 hr 30 min' },
    { value: '360', text: '6 hours' },
    { value: '390', text: '6 hr 30 min' },
    { value: '420', text: '7 hours' },
    { value: '450', text: '7 hr 30 min' },
    { value: '480', text: '8 hours' },
  ]

  const handleScheduleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: string
  ) => {
    setScheduleValue(newValue)
    if (newValue === 'auto') {
      setAutoDisabled(false)
      setManualDisabled(true)
    } else if (newValue === 'manual') {
      setManualDisabled(false)
      setAutoDisabled(true)
    }
  }

  const onSubmit = async (formData: EventFormValues) => {
    const summary = formData.summary
    const duration = formData.duration
    let {
      manualDate,
      manualTime,
      deadlineDate,
      deadlineTime,
      minimumStartDate,
      minimumStartTime,
    } = formData

    // Clear unused fields
    if (manualDisabled) {
      manualDate = ''
      manualTime = ''
    } else if (autoDisabled) {
      deadlineDate = ''
      deadlineTime = ''
      minimumStartDate = ''
      minimumStartTime = ''
    }

    // Create new data object with cleared fields
    const data: EventFormValues = {
      summary,
      duration,
      manualDate,
      manualTime,
      deadlineDate,
      deadlineTime,
      minimumStartDate,
      minimumStartTime,
    }

    if (!manualDisabled && manualDate === '' && manualTime === '') {
      setError('manualDate', {
        type: 'required',
        message: 'A date and time are needed',
      })
      return
    }

    if (manualDate) {
      if (!manualTime) {
        setError('manualTime', {
          type: 'required',
          message: 'A time is needed for the given date',
        })
        return
      }
    }
    if (manualTime) {
      if (!manualDate) {
        setError('manualDate', {
          type: 'required',
          message: 'A date is needed for the given time',
        })
        return
      }
    }

    if (minimumStartDate) {
      if (!minimumStartTime) {
        setError('minimumStartTime', {
          type: 'required',
          message: 'A time is needed for the given date',
        })
        return
      }
    }
    if (minimumStartTime) {
      if (!minimumStartDate) {
        setError('minimumStartDate', {
          type: 'required',
          message: 'A date is needed for the given time',
        })
        return
      }
    }

    if (deadlineDate) {
      if (!deadlineTime) {
        setError('deadlineTime', {
          type: 'required',
          message: 'A time is needed for the given date',
        })
        return
      }
    }
    if (deadlineTime) {
      if (!deadlineDate) {
        setError('deadlineDate', {
          type: 'required',
          message: 'A date is needed for the given time',
        })
        return
      }
    }

    if (minimumStartDate && minimumStartTime) {
      const minimumStart = addTimeToDate(minimumStartTime, minimumStartDate)
      // Compares the minimumStart to 2 minutes in the past to ensure that the
      // default minimumStart time (which is the current time) will not be in
      // the past and create a form error
      if (new Date(new Date().getTime() - 120000) > minimumStart) {
        setError('minimumStartDate', {
          type: 'required',
          message: 'The time the event can be scheduled must be in the future',
        })
        return
      }

      if (deadlineDate && deadlineTime) {
        const deadline = addTimeToDate(deadlineTime, deadlineDate)
        if (deadline < minimumStart) {
          setError('deadlineDate', {
            type: 'required',
            message:
              'The deadline must be after the time the event can be scheduled',
          })
          return
        }
      }
    }

    if (deadlineDate && deadlineTime) {
      const deadline = addTimeToDate(deadlineTime, deadlineDate)
      if (new Date() > deadline) {
        setError('deadlineDate', {
          type: 'required',
          message: 'The deadline must be in the future',
        })
        return
      }
    }

    setScheduleDisabled(true)

    try {
      const eventMessage: string = await eventService.createEvent(
        '/create-event',
        { data }
      )
      reset()
      createNotification(eventMessage, 'Event scheduled', 'success')
    } catch (error) {
      createNotification(serverErrorMessage, '', undefined)
    }
    navigate('/')
  }

  return (
    <div>
      <Header title="Create Event" />
      <EventFormInfoButton />
      <div className="app-page-container">
        <form
          className="event-form-container"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div style={{ minWidth: '100%', paddingLeft: '16px' }}>
            <TextField
              style={{ minWidth: '90%', marginBottom: '8px' }}
              id="summary"
              placeholder="Make time in my calendar for..."
              variant="standard"
              autoFocus={true}
              {...register('summary', { required: 'Please enter a summary' })}
            />
            <div className="event-form-error">{errors.summary?.message}</div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '95%',
            }}
          >
            <FormControl>
              <InputLabel id="duration-label">Duration</InputLabel>
              <Select
                id="duration"
                label="Duration"
                size="small"
                defaultValue={30}
                {...register('duration', { required: true })}
              >
                {durationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              color="primary"
              size="small"
              value={scheduleValue}
              exclusive
              onChange={handleScheduleChange}
            >
              <ToggleButton value="manual">Manual</ToggleButton>
              <ToggleButton value="auto">Auto</ToggleButton>
            </ToggleButtonGroup>
          </div>

          <fieldset className="event-field" disabled={manualDisabled}>
            <legend>Manual Event</legend>
            <TextField
              style={{ marginBottom: '8px' }}
              id="manualStartDate"
              type="date"
              variant="standard"
              {...register('manualDate')}
            />
            <TextField
              id="manualStartTime"
              type="time"
              variant="standard"
              {...register('manualTime')}
            />
            <div className="event-form-error">{errors.manualDate?.message}</div>
            <div className="event-form-error">{errors.manualTime?.message}</div>
          </fieldset>

          <fieldset
            className="event-field"
            style={{ minHeight: '185px' }}
            disabled={autoDisabled}
          >
            <legend>Auto Event</legend>
            <div
              style={{
                fontSize: '0.9em',
                marginTop: '8px',
                marginRight: 'auto',
                width: '100%',
              }}
            >
              Schedule at the next open time after:
            </div>
            <TextField
              id="minimumStartDate"
              type="date"
              variant="standard"
              defaultValue={new Date().toISOString().slice(0, 10)}
              {...register('minimumStartDate')}
            />
            <TextField
              id="minimumStartTime"
              type="time"
              variant="standard"
              defaultValue={`${('0' + new Date().getHours()).slice(-2)}:${(
                '0' + new Date().getMinutes()
              ).slice(-2)}`}
              {...register('minimumStartTime')}
            />
            <div
              style={{
                display: 'flex',
                width: '100%',
                fontSize: '0.9em',
                marginTop: '16px',
                marginRight: 'auto',
              }}
            >
              Deadline:
              <div
                style={{ fontSize: '0.75em', marginLeft: '3px', color: 'gray' }}
              >
                {' '}
                (optional)
              </div>
            </div>
            <TextField
              style={{ marginBottom: '8px' }}
              id="deadlineDate"
              type="date"
              variant="standard"
              {...register('deadlineDate')}
            />
            <TextField
              id="deadlineTime"
              type="time"
              variant="standard"
              {...register('deadlineTime')}
            />
            <div className="event-form-error">
              {errors.minimumStartDate?.message}
            </div>
            <div className="event-form-error">
              {errors.minimumStartTime?.message}
            </div>
            <div className="event-form-error">
              {errors.deadlineDate?.message}
            </div>
            <div className="event-form-error">
              {errors.deadlineTime?.message}
            </div>
          </fieldset>

          <Button
            style={{ marginLeft: 'auto' }}
            id="submit"
            type="submit"
            disabled={scheduleDisabled}
          >
            Schedule
          </Button>
        </form>
      </div>
    </div>
  )
}

export default EventForm
