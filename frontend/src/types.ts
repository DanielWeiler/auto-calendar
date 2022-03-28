export interface WeeklyHoursFormValues {
  Monday: {
    startTime: string
    endTime: string
  }
  Tuesday: {
    startTime: string
    endTime: string
  }
  Wednesday: {
    startTime: string
    endTime: string
  }
  Thursday: {
    startTime: string
    endTime: string
  }
  Friday: {
    startTime: string
    endTime: string
  }
  Saturday: {
    startTime: string
    endTime: string
  }
  Sunday: {
    startTime: string
    endTime: string
  }
}

export interface ReminderFormValues {
  summary: string
  duration: string
  manualDate: string
  manualTime: string
  deadlineDate: string
  deadlineTime: string
}