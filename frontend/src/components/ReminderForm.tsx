import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { ReminderFormValues, UserMessage } from '../types'

const ReminderForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ReminderFormValues>({
    defaultValues: {
      duration: '30',
    },
  })

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
      if (!data.manualDate) {
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
      const userMessage: UserMessage = await eventService.createReminder(
        '/create-event',
        { data }
      )
      console.log(userMessage)
    } catch (error) {
      console.log(
        '500 Internal Server Error \n Oh no! Something bad happened. Please',
        'come back later when we have fixed this problem. Thanks.'
      )
    }
  }

  return (
    <div>
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
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="25">25 minutes</option>
          <option value="30">30 minutes</option>
          <option value="35">35 minutes</option>
          <option value="40">40 minutes</option>
          <option value="45">45 minutes</option>
          <option value="50">50 minutes</option>
          <option value="60">1 hour</option>
          <option value="75">1 hr 15 min</option>
          <option value="90">1 hr 30 min</option>
          <option value="105">1 hr 45 min</option>
          <option value="120">2 hours</option>
          <option value="135">2 hr 15 min</option>
          <option value="150">2 hr 30 min</option>
          <option value="165">2 hr 45 min</option>
          <option value="180">3 hours</option>
          <option value="195">3 hr 15 min</option>
          <option value="210">3 hr 30 min</option>
          <option value="225">3 hr 45 min</option>
          <option value="240">4 hours</option>
          <option value="270">4 hr 30 min</option>
          <option value="300">5 hours</option>
          <option value="330">5 hr 30 min</option>
          <option value="360">6 hours</option>
          <option value="390">6 hr 30 min</option>
          <option value="420">7 hours</option>
          <option value="450">7 hr 30 min</option>
          <option value="480">8 hours</option>
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
