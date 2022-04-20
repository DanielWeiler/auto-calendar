import React, { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { ReminderFormValues } from '../types'
import { serverErrorMessage, warningMessages } from '../utils/helpers'
import Notification from './Notification'

const ReminderForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ReminderFormValues>({
    defaultValues: {
      duration: '30',
    },
  })

  let newNotification = {
    style: '',
    heading: '',
    body: '',
  }
  const [notification, setNotification] = useState(newNotification)

  const createNotification = (message: string) => {
    // Text that is unnecessary for the user is removed
    if (message.includes('Manually scheduled')) {
      message = message.substring(18)
    }

    newNotification = {
      style: 'success',
      heading: 'Reminder scheduled',
      body: message,
    }

    let warning = false
    warningMessages.map((warningMessage) =>
      message === warningMessage ? (warning = true) : null
    )

    if (warning) {
      newNotification.style = 'warning'
      newNotification.heading = 'Reminder scheduled with conflicts'
    } else if (
      message.includes(
        'There was no time slot available for this event before its deadline.'
      )
    ) {
      newNotification.style = 'danger'
      newNotification.heading = 'Reminder was not scheduled'
    } else if (message === serverErrorMessage) {
      newNotification.style = 'danger'
      newNotification.heading = '500 Internal Server Error'
    }

    setNotification(newNotification)
  }

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
    const { manualDate, manualTime, deadlineDate, deadlineTime } = data
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

    try {
      const reminderMessage: string = await eventService.createReminder(
        '/create-event',
        { data }
      )
      reset()
      createNotification(reminderMessage)
    } catch (error) {
      createNotification(serverErrorMessage)
    }
  }

  return (
    <div>
      <Notification notification={notification} />
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Control
          id="summary"
          {...register('summary', { required: 'Please enter a summary' })}
          placeholder="Make time in my calendar for..."
        />
        <p style={{ color: 'red' }}>{errors.summary?.message}</p>

        <Form.Label>Duration:</Form.Label>
        <Form.Select
          id="duration"
          {...register('duration', { required: true })}
        >
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.text}
            </option>
          ))}
        </Form.Select>

        <Form.Label>Manual Time:</Form.Label>
        <Form.Control
          id="manualStartDate"
          type="date"
          {...register('manualDate')}
        />
        <p style={{ color: 'red' }}>{errors.manualDate?.message}</p>
        <Form.Control
          id="manualStartTime"
          type="time"
          {...register('manualTime')}
        />
        <p style={{ color: 'red' }}>{errors.manualTime?.message}</p>

        <Form.Label>Deadline:</Form.Label>
        <Form.Control
          id="deadlineDate"
          type="date"
          {...register('deadlineDate')}
        />
        <p style={{ color: 'red' }}>{errors.deadlineDate?.message}</p>
        <Form.Control
          id="deadlineTime"
          type="time"
          {...register('deadlineTime')}
        />
        <p style={{ color: 'red' }}>{errors.deadlineTime?.message}</p>

        <Button id="submit" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  )
}

export default ReminderForm
