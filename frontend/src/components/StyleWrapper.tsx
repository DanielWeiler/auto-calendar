import styled from '@emotion/styled'

// This component is used to modify the internal styles of the FullCalendar
// React component
const StyleWrapper = styled.div`
  .fc {
    font-size: 1em;
  }

  .fc * {
    border-color: #e5e5e5;
  }

  .fc-theme-standard .fc-scrollgrid {
    border: 0px;
    background-color: white;
  }

  .fc-scroller {
    overflow: hidden auto !important;
    background-color: white;
  }

  .fc-toolbar-chunk {
    font-size: 0.8em;
    color: white;
  }

  .fc-toolbar-title {
    font-weight: normal;
    margin-left: 2.5em;
    margin-bottom: 0.55em;
  }

  .fc-toolbar.fc-header-toolbar {
    margin-bottom: 0.75em;
  }

  .fc-button-active {
    background: #d3d3d3 !important;
    border-color: transparent !important;
  }

  .fc-button-primary:not(:disabled):active:focus,
  .fc-button-primary:not(:disabled).fc-button-active:focus {
    background: #d3d3d3;
    border-color: transparent;
    box-shadow: none;
  }

  .fc-button.fc-dayGridMonth-button,
  .fc-button.fc-timeGridWeek-button,
  .fc-button.fc-timeGridDay-button,
  .fc-button.fc-listWeek-button {
    font-size: 0.9em;
    background: #64a6e3;
    border-color: #8dc0ef;
    box-shadow: none;
  }

  .fc-button.fc-today-button {
    margin-top: 2.8em;
    background: transparent;
    border-color: transparent;
  }

  .fc-button:disabled {
    opacity: unset !important;
  }

  .fc-button.fc-prev-button,
  .fc-button.fc-next-button {
    margin-top: 2.5em;
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .fc-list-empty {
    background-color: white;
  }

  .fc-list-table tr {
    background-color: white;
  }

  .fc-timegrid .fc-daygrid-body {
    display: none;
  }
  
  .fc-daygrid-day-bottom {
    font-size: .75em;
  }
`

export default StyleWrapper
