import { AlertColor, Button, Stack } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import eventService from '../services/events'
import { TimePeriod, WeeklyHoursFormValues } from '../types'
import { serverErrorMessage } from '../utils/helpers'
import Header from './Header'
import WorkDayForm from './WeekDayForm'

const WorkWeekForm = (props: {
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

  const [saveDisabled, setSaveDisabled] = useState(false)
  const [checkedState, setCheckedState] = useState([
    { name: 'Monday', display: '' },
    { name: 'Tuesday', display: '' },
    { name: 'Wednesday', display: '' },
    { name: 'Thursday', display: '' },
    { name: 'Friday', display: '' },
    { name: 'Saturday', display: 'none' },
    { name: 'Sunday', display: 'none' },
  ])

  const navigate = useNavigate()

  useEffect(() => {
    createNotification('', '', undefined)
  }, [])

  const handleOnChange = (position: number) => {
    const updatedCheckedState = checkedState.map(({ name, display }, index) => {
      if (index === position) {
        return { name, display: display ? '' : 'none' }
      } else {
        return { name, display }
      }
    })

    setCheckedState(updatedCheckedState)
  }

  const onSubmit = async (data: WeeklyHoursFormValues) => {
    checkedState.map(({ name, display }) => {
      if (display === 'none') {
        Object.entries(data).map((day) => {
          if (day[0] === name) {
            day[1].startTime = ''
            day[1].endTime = ''
          }
        })
      }
    })

    let error = false
    Object.keys(data).forEach((day: string) => {
      if (
        !data[day as keyof WeeklyHoursFormValues].startTime !==
        !data[day as keyof WeeklyHoursFormValues].endTime
      ) {
        Object.keys(data[day as keyof WeeklyHoursFormValues]).forEach(
          (time) => {
            !data[day as keyof WeeklyHoursFormValues][
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
            error = true
          }
        )
      } else if (
        data[day as keyof WeeklyHoursFormValues].startTime >
        data[day as keyof WeeklyHoursFormValues].endTime
      ) {
        setError(`${day as keyof WeeklyHoursFormValues}.endTime`, {
          type: 'required',
          message: 'The start time must be before the end time',
        })
        error = true
      }
    })

    if (error) {
      return
    }

    setSaveDisabled(true)

    try {
      await eventService.setWorkingHours('/set-working-hours', { data })
      createNotification(
        'Conflicting events that are reschedulable will be rescheduled. This may take a moment.',
        'Working hours set',
        'success'
      )
    } catch (error) {
      createNotification(serverErrorMessage, '', undefined)
    }
    navigate('/')
  }

  return (
    <div>
      <Header title="Set Working Hours" />
      <div className="weekly-hours-container">
        <div style={{ marginBottom: '24px' }}>
          {checkedState.map(({ name, display }, index) => (
            <span key={name} className="week-days-selector">
              <input
                id={name}
                type="checkbox"
                className="weekday"
                checked={display ? false : true}
                onChange={() => handleOnChange(index)}
              />
              <label htmlFor={name}>{name.slice(0, 1)}</label>
            </span>
          ))}
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={1}>
            {checkedState.map(({ name, display }) => (
              <WorkDayForm
                key={name}
                day={name}
                display={display}
                register={register}
                error={errors[name as keyof WeeklyHoursFormValues]}
              />
            ))}
          </Stack>
          <Button
            id="save"
            type="submit"
            variant="outlined"
            style={{ float: 'right', marginTop: '16px' }}
            disabled={saveDisabled}
          >
            Save
          </Button>
        </form>
      </div>
    </div>
  )
}

export default WorkWeekForm
