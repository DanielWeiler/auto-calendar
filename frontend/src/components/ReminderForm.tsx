import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { ReminderFormValues } from '../types'

const ReminderForm = () => {
  const { register, handleSubmit } = useForm<ReminderFormValues>({
    defaultValues: {
      duration: '30',
    },
  })

  const onSubmit = (data: ReminderFormValues) => {
    eventService.createReminder('/create-event', { data })
  }

  return (
    <div>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Control
          id="summary"
          {...register('summary', { required: true })}
          placeholder="summary"
        />

        <Form.Label>Duration:</Form.Label>
        <Form.Select
          id="duration"
          {...register('duration', { required: true })}
        >
          <option value="0">0 minutes</option>
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
          <option value="510">8 hr 30 min</option>
          <option value="540">9 hours</option>
          <option value="600">10 hours</option>
          <option value="660">11 hours</option>
          <option value="720">12 hours</option>
          <option value="780">13 hours</option>
          <option value="840">14 hours</option>
          <option value="900">15 hours</option>
          <option value="960">16 hours</option>
          <option value="1020">17 hours</option>
          <option value="1080">18 hours</option>
          <option value="1140">19 hours</option>
          <option value="1200">20 hours</option>
          <option value="1260">21 hours</option>
          <option value="1320">22 hours</option>
          <option value="1380">23 hours</option>
          <option value="1440">1 day</option>
          <option value="2880">2 days</option>
        </Form.Select>

        <Form.Label>Manual Time:</Form.Label>
        <Form.Control
          id="manualStartDate"
          type="date"
          {...register('manualDate')}
        />
        <Form.Control
          id="manualStartTime"
          type="time"
          {...register('manualTime')}
        />

        <Form.Label>Deadline:</Form.Label>
        <Form.Control
          id="deadlineDate"
          type="date"
          {...register('deadlineDate')}
        />
        <Form.Control
          id="deadlineTime"
          type="time"
          {...register('deadlineTime')}
        />

        <Button
          id="submit"
          type="submit"
          /* disabled={submitDisabled} */
          /* style={margin} */
        >
          Submit
        </Button>
      </Form>
    </div>
  )
}

export default ReminderForm
