import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { WeeklyHoursFormValues } from '../types'
import WorkDayForm from './WeekDayForm'

const WorkingHoursForm = () => {
  const { register, handleSubmit } = useForm<WeeklyHoursFormValues>({
    defaultValues: {
      Monday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Tuesday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Wednesday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Thursday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Friday: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Saturday: {
        startTime: '',
        endTime: '',
      },
      Sunday: {
        startTime: '',
        endTime: '',
      },
    },
  })

  const onSubmit = async (data: WeeklyHoursFormValues) => {
    try {
      await eventService.setWorkingHours('/set-working-hours', { data })
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
        <WorkDayForm day="Monday" register={register} />
        <WorkDayForm day="Tuesday" register={register} />
        <WorkDayForm day="Wednesday" register={register} />
        <WorkDayForm day="Thursday" register={register} />
        <WorkDayForm day="Friday" register={register} />
        <WorkDayForm day="Saturday" register={register} />
        <WorkDayForm day="Sunday" register={register} />
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

export default WorkingHoursForm
