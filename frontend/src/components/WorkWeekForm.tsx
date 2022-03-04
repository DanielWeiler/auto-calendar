import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { WorkingHoursFormValues } from '../types'
import WorkDayForm from './WorkDayForm'

const WorkingHoursForm = () => {
  const { register, handleSubmit } = useForm<WorkingHoursFormValues>({
    defaultValues: {
      Mo: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Tu: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      We: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Th: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Fr: {
        startTime: '08:00:00',
        endTime: '17:00:00',
      },
      Sa: {
        startTime: '',
        endTime: '',
      },
      Su: {
        startTime: '',
        endTime: '',
      },
    },
  })

  const onSubmit = (data: WorkingHoursFormValues) => {
    eventService.setWorkingHours('/set-working-hours', { data })
    console.log('Working hours set successfully')
  }

  return (
    <div>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <WorkDayForm day="Mo" register={register} />
        <WorkDayForm day="Tu" register={register} />
        <WorkDayForm day="We" register={register} />
        <WorkDayForm day="Th" register={register} />
        <WorkDayForm day="Fr" register={register} />
        <WorkDayForm day="Sa" register={register} />
        <WorkDayForm day="Su" register={register} />
        <Button
          id="create"
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
