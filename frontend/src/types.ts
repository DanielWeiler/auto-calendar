import { AlertColor } from '@mui/material'

export interface WeeklyHoursFormValues {
  Monday: TimePeriod
  Tuesday: TimePeriod
  Wednesday: TimePeriod
  Thursday: TimePeriod
  Friday: TimePeriod
  Saturday: TimePeriod
  Sunday: TimePeriod
}

export interface TimePeriod {
  startTime: string
  endTime: string
}

export interface ReminderFormValues {
  summary: string
  duration: string
  manualDate: string
  manualTime: string
  deadlineDate: string
  deadlineTime: string
  minimumStartTime: string
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
}
