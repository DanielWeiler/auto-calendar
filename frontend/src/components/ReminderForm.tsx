import { AlertColor, Button, MenuItem, Select, TextField } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import eventService from '../services/events'
import { ReminderFormValues } from '../types'
import { addTimeToDate, serverErrorMessage } from '../utils/helpers'
import Header from './Header'

const ReminderForm = (props: {
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
  } = useForm<ReminderFormValues>()

  const [submitDisabled, setSubmitDisabled] = useState(false)

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

  const onSubmit = async (data: ReminderFormValues) => {
    const {
      manualDate,
      manualTime,
      deadlineDate,
      deadlineTime,
      minimumStartDate,
      minimumStartTime,
    } = data

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
      if (new Date() > minimumStart) {
        setError('minimumStartDate', {
          type: 'required',
          message: 'The earliest start time must be in the future',
        })
        return
      }

      if (deadlineDate && deadlineTime) {
        const deadline = addTimeToDate(deadlineTime, deadlineDate)
        if (deadline < minimumStart) {
          setError('deadlineDate', {
            type: 'required',
            message: 'The deadline cannot be before the earliest start time',
          })
          return
        }
      }

      setSubmitDisabled(true)
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

    try {
      const reminderMessage: string = await eventService.createReminder(
        '/create-event',
        { data }
      )
      reset()
      createNotification(reminderMessage, 'Reminder scheduled', 'success')
    } catch (error) {
      createNotification(serverErrorMessage, '', undefined)
    }
    navigate('/')
  }

  return (
    <div>
      <Header title="Create Reminder" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Summary:</label>
        <TextField
          id="summary"
          placeholder="Make time in my calendar for..."
          {...register('summary', { required: 'Please enter a summary' })}
        />
        <p style={{ color: 'red' }}>{errors.summary?.message}</p>

        <label>Duration:</label>
        <Select
          id="duration"
          defaultValue={30}
          {...register('duration', { required: true })}
        >
          {durationOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.text}
            </MenuItem>
          ))}
        </Select>

        <label>Manual Time:</label>
        <TextField
          id="manualStartDate"
          type="date"
          {...register('manualDate')}
        />
        <p style={{ color: 'red' }}>{errors.manualDate?.message}</p>
        <TextField
          id="manualStartTime"
          type="time"
          {...register('manualTime')}
        />
        <p style={{ color: 'red' }}>{errors.manualTime?.message}</p>

        <label>Earliest start time:</label>
        <TextField
          id="minimumStartDate"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          {...register('minimumStartDate')}
        />
        <p style={{ color: 'red' }}>{errors.minimumStartDate?.message}</p>
        <TextField
          id="minimumStartTime"
          type="time"
          defaultValue={`${new Date().getHours()}:${
            new Date().getMinutes() + 1
          }`}
          {...register('minimumStartTime')}
        />
        <p style={{ color: 'red' }}>{errors.minimumStartTime?.message}</p>

        <label>Deadline:</label>
        <TextField
          id="deadlineDate"
          type="date"
          {...register('deadlineDate')}
        />
        <p style={{ color: 'red' }}>{errors.deadlineDate?.message}</p>
        <TextField
          id="deadlineTime"
          type="time"
          {...register('deadlineTime')}
        />
        <p style={{ color: 'red' }}>{errors.deadlineTime?.message}</p>

        <Button id="submit" type="submit" disabled={submitDisabled}>
          Submit
        </Button>
      </form>
    </div>
  )
}

export default ReminderForm
