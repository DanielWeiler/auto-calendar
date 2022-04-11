import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import eventService from '../services/events'
import { TimePeriod, WeeklyHoursFormValues } from '../types'
import WorkDayForm from './WeekDayForm'

const WorkingHoursForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<WeeklyHoursFormValues>({
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

  const onSubmit = async (daysData: WeeklyHoursFormValues) => {
    Object.keys(daysData).forEach((day: string) => {
      if (
        !daysData[day as keyof WeeklyHoursFormValues].startTime !==
        !daysData[day as keyof WeeklyHoursFormValues].endTime
      ) {
        Object.keys(daysData[day as keyof WeeklyHoursFormValues]).forEach(
          (time) => {
            !daysData[day as keyof WeeklyHoursFormValues][
              time as keyof TimePeriod
            ] &&
              setError(
                `${day as keyof WeeklyHoursFormValues}.${
                  time as keyof TimePeriod
                }`,
                {
                  type: 'required',
                  message: `${
                    time === 'startTime' ? 'A start' : 'An end'
                  } time is needed for the given ${
                    time === 'startTime' ? 'end' : 'start'
                  } time`,
                }
              )
          }
        )
      }
    })

    try {
      await eventService.setWorkingHours('/set-working-hours', { daysData })
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
        {[
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ].map((day) => (
          <WorkDayForm
            key={day}
            day={day}
            register={register}
            error={errors[day as keyof WeeklyHoursFormValues]}
          />
        ))}

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
