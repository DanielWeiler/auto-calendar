import { AlertColor } from '@mui/material'

export interface TimePeriod {
  startTime: string
  endTime: string
}

export interface WeeklyHoursFormValues {
  Monday: TimePeriod
  Tuesday: TimePeriod
  Wednesday: TimePeriod
  Thursday: TimePeriod
  Friday: TimePeriod
  Saturday: TimePeriod
  Sunday: TimePeriod
}

export interface EventFormValues {
  summary: string
  duration: string
  manualDate: string
  manualTime: string
  minimumStartDate: string
  minimumStartTime: string
  deadlineDate: string
  deadlineTime: string
}

export interface NotificationDetails {
  style: AlertColor | undefined
  heading: string
  body: string
}

export interface EventData {
  id: string
  title: string
  start: Date | null
  end: Date | null
  description: string
  deadline: Date | null
}
