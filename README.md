# Auto Calendar

Watch my demo video here (CTRL+click or CMD+click to open new tab):

[![Auto Calendar Demo](https://img.youtube.com/vi/lhlOv2o9KOk/0.jpg)](https://www.youtube.com/watch?v=lhlOv2o9KOk)

## Project Description

Auto Calendar is a progressive web application and it uses the Google Calendar API. In addition to working as a traditional calendar app, Auto Calendar provides automatic scheduling features. Along with handling regular calendar events, this app aims to store and manage all of a user's tasks and help the user to:
- Find the best time for each task
- Remember every task
- Create a schedule without time conflicts
- Easily adjust the schedule based on the user's availability

There are two types of events in Auto Calendar, which are manual events and auto events. Manual events work just like traditional calendar app events. Auto events automatically schedule based on the user's calendar availability. 

Whenever an event is scheduled, it reserves its time block only for itself so that no events conflict with each other to keep an easy to follow schedule. If a manual event is scheduled on top of an auto event, the auto event will be rescheduled to a suitable time. An auto event will never be scheduled on top of another event. Manual events can still be scheduled on top of other manual events to preserve the time the user chose for the event.

The user can set the hours when they are available for auto events. Auto events will only be scheduled during these hours. The user can choose when an auto event will look for availability and can provide a deadline to be sure it will be scheduled before the deadline.

## Demo

A test account has been created to use the demo of this app. Please see the account's credentials provided in my CV.

*The time zone set for this test account is the time zone of Finland (GMT+03:00 Eastern European Summer Time - Helsinki).

(Because the app has been created with the Google Calendar API, it needs to go through Google's verification process to be available to any user with a Google Account. This process is not yet complete for this app but it can be accessed with the test account.)

The working live version can be found at [auto-calendar-app.herokuapp.com](https://auto-calendar-app.herokuapp.com/)

*May not be optimized for iPhone.

## Technologies

- Typescript
- React
- Node.js
- NPM
- Express
- Axios
- Google Calendar API
- Material UI
- Fullcalendar.io
- MongoDB
- Mongoose
- Jest
- ESLint
- ts-node-dev
- jwt-decode
- Moment.js

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Setup

The backend (server) of the application is in the root folder, and frontend is in the frontend folder.

(The app has required .env files that have been added to .gitignore. If you would like to run the project locally, please email me at danielweiler78@gmail.com for the .env files.)

- Clone the project repository
- Install the dependencies in the root folder and frontend folder with npm.

```
# Clone this repository
C:/> git clone https://github.com/DanielWeiler/auto-calendar.git

# Navigate to the project
C:/> cd auto-calendar

# Install dependencies
C:/> npm install

# Navigate to the frontend folder
C:/> cd auto-calendar/frontend

# Install dependencies
C:/> npm install
```

### Running frontend and backend in development mode

- Navigate to the root folder and run the backend with the command:

```
C:/> cd auto-calendar
C:/> npm run dev
```

- Navigate to the frontend folder in a different terminal window and run the frontend with the command:

```
C:/> cd auto-calendar/frontend
C:/> npm start
```

Now you can open [http://localhost:3000](http://localhost:3000) to view it in the browser. The backend is running in [http://localhost:4000](http://localhost:4000/api).

### Running tests:

The app has tests for the frontend. You can run all the tests in the frontend directory with the command:

```
C:/> auto-calendar/frontend
C:/> npm test
```

To run an individual test or set of tests run:

```
C:/> auto-calendar/frontend
C:/> npm test -- -t 'name of test'
```

## Author

Daniel Weiler
