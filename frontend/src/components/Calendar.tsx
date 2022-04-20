import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import eventService from '../services/events'

const Calendar = () => {
  const [events, setEvents] = useState([])

  useEffect(() => {
    // Must wait for authorization to complete after sign in
    setTimeout(() => {
      eventService.getEvents().then((events) => {
        console.log(events)
        setEvents(events)
      })
    }, 500)
  }, [])

  return <FullCalendar events={events} plugins={[dayGridPlugin]} />
}

export default Calendar
