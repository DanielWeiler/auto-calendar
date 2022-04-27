import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import AddIcon from '@mui/icons-material/Add'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import eventService from '../services/events'
import { EventData } from '../types'
import StyleWrapper from './StyleWrapper'

const Calendar = () => {
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)
  const [eventData, setEventData] = useState<EventData>({
    id: '',
    title: '',
    start: null,
    end: null,
  })

  useEffect(() => {
    // Must wait for authorization to complete after sign in
    setTimeout(() => {
      eventService.getEvents().then((events) => {
        console.log(events)
        setEvents(events)
      })
    }, 500)
  }, [])

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleDeleteEvent = async (eventId: string) => {
    await eventService.deleteReminder('/delete-event', eventId)
    const refreshedEvents = await eventService.getEvents()
    setEvents(refreshedEvents)
  }

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{eventData.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {eventData.start?.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            {' • '}
            {eventData.start?.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' — '}
            {eventData.end?.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            style={{ color: 'red' }}
            onClick={() => {
              handleClose()
              handleDeleteEvent(eventData.id)
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
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
          eventClick={function (arg) {
            // Prevent unavailable hours and working hours events from being
            // modified within the calendar view
            if (
              arg.event.title === 'Unavailable hours' ||
              arg.event.title === 'Working Hours'
            ) {
              return
            }
            setEventData({
              id: arg.event.id,
              title: arg.event.title,
              start: arg.event.start,
              end: arg.event.end,
            })
            handleClickOpen()
          }}
        />
      </StyleWrapper>
      <Link to="/create-event">
        <Fab
          aria-label="add"
          style={{
            background: '#5db9ff',
            color: 'white',
            position: 'absolute',
            right: 25,
            bottom: 25,
          }}
        >
          <AddIcon />
        </Fab>
      </Link>
    </div>
  )
}

export default Calendar
