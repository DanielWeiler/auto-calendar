import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import React, { useEffect, useState } from 'react'
import eventService from '../services/events'
import StyleWrapper from './StyleWrapper'

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

  return (
    <div>
      <StyleWrapper className="calendar-container">
        <FullCalendar
          height={'100%'}
          views={{
            timeGrid: {
              titleFormat: { month: 'short', day: 'numeric' },
            },
            listWeek: {
              titleFormat: { month: 'short', day: 'numeric' },
            },
          }}
          initialView="timeGridWeek"
          buttonText={{
            today: '📅',
            month: 'M',
            week: 'W',
            day: 'D',
            list: 'List',
          }}
          displayEventTime={false}
          events={events}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          headerToolbar={{
            left: 'title dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            center: '',
            right: 'today prev,next',
          }}
        />
      </StyleWrapper>
    </div>
  )
}

export default Calendar
