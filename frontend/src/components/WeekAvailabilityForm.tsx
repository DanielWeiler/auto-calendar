import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { WeeklyHoursFormValues } from '../types'
import WeekDayForm from './WeekDayForm'

const WeekAvailabilityForm = () => {
  const { register, handleSubmit } = useForm<WeeklyHoursFormValues>({
    defaultValues: {
      Monday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Tuesday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Wednesday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Thursday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Friday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Saturday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
      Sunday: {
        startTime: '07:00:00',
        endTime: '20:00:00',
      },
    },
  })

  const onSubmit = async (data: WeeklyHoursFormValues) => {
    try {
      await eventService.setUnavailableHours('/set-unavailable-hours', { data })
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
        <WeekDayForm day="Monday" register={register} />
        <WeekDayForm day="Tuesday" register={register} />
        <WeekDayForm day="Wednesday" register={register} />
        <WeekDayForm day="Thursday" register={register} />
        <WeekDayForm day="Friday" register={register} />
        <WeekDayForm day="Saturday" register={register} />
        <WeekDayForm day="Sunday" register={register} />
        <Button
          id="save"
          type="submit"
          /* disabled={submitDisabled} */
          /* style={margin} */
        >
          Save
        </Button>
      </Form>
    </div>
  )
}

export default WeekAvailabilityForm
