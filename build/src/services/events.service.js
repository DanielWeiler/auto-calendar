"use strict";
/**
 * This service handles all operations with regular events (excluding weekly
 * hours events) that are directly called by the events.controller. These
 * operations include getting, creating, rescheduling, and deleting events.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = void 0;
const googleapis_1 = require("googleapis");
const google_client_config_1 = __importDefault(require("../configs/google-client.config"));
const helpers_1 = require("../utils/helpers");
const schedule_helpers_service_1 = require("./schedule-helpers.service");
const schedule_service_1 = require("./schedule.service");
const sign_in_service_1 = require("./sign-in.service");
require('express-async-errors');
const calendar = googleapis_1.google.calendar('v3');
/**
 * Gets the events from Google Calendar to be displayed in the app. The
 * calendar ID used by the app and the time zone of the user are also
 * initialized in this function.
 * @returns {EventDisplayData[]} Returns a list of event objects.
 */
function getEvents() {
    return __awaiter(this, void 0, void 0, function* () {
        // Get the date 12 months from now
        const timeMax = new Date(new Date().setMonth(new Date().getMonth() + 12));
        // Gets the events from Google Calendar
        const events = yield calendar.events.list({
            auth: google_client_config_1.default,
            calendarId: sign_in_service_1.autoCalendarId,
            singleEvents: true,
            timeMax: timeMax.toISOString(),
            maxResults: 2500,
        });
        (0, helpers_1.assertDefined)(events.data.items);
        // Add colors and display options to the events
        const eventsData = [];
        events.data.items.map((event) => {
            var _a, _b, _c, _d;
            (0, helpers_1.assertDefined)(event.id);
            let color = 'LightSkyBlue';
            let display = 'auto';
            if (event.description === 'Unavailable hours') {
                color = 'Black';
                display = 'background';
                event.summary = 'UH';
            }
            else if (event.description === 'Working hours') {
                color = 'rgb(239 223 192)';
            }
            else if ((_a = event.description) === null || _a === void 0 ? void 0 : _a.includes('Manually scheduled')) {
                color = 'rgb(243 210 50 / 93%)';
            }
            else if ((_b = event.description) === null || _b === void 0 ? void 0 : _b.includes('Deadline')) {
                color = 'RoyalBlue';
            }
            const eventData = {
                id: event.id,
                title: event.summary,
                start: (_c = event.start) === null || _c === void 0 ? void 0 : _c.dateTime,
                end: (_d = event.end) === null || _d === void 0 ? void 0 : _d.dateTime,
                extendedProps: { description: event.description },
                backgroundColor: color,
                display: display,
            };
            eventsData.push(eventData);
        });
        return eventsData;
    });
}
/**
 * Uses the data from the event form to decide if a manual or an auto event
 * should be scheduled. Creates a <schedulingSettings> string, which stores
 * preferences about the event's scheduling, such as a minimum start time
 * and/or a deadline.
 * @param {EventFormData} data - The data recieved from the frontend to
 * create the event.
 * @returns {string} Returns a string, which provides the user with a
 * message on the result of scheduling the event.
 */
function createEvent(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { summary, duration, manualDate, manualTime, minimumStartDate, minimumStartTime, deadlineDate, deadlineTime, } = data;
        const durationNumber = parseInt(duration);
        let userMessage;
        if (manualDate && manualTime) {
            userMessage = yield (0, schedule_service_1.manualSchedule)(summary, manualDate, manualTime, durationNumber);
        }
        else {
            let minimumStart = null;
            let deadline = null;
            let schedulingSettings = '';
            if (minimumStartDate && minimumStartTime) {
                minimumStart = (0, helpers_1.addTimeToDate)(minimumStartTime, minimumStartDate);
            }
            if (deadlineDate && deadlineTime) {
                deadline = (0, helpers_1.addTimeToDate)(deadlineTime, deadlineDate);
            }
            if (minimumStartDate && minimumStartTime && deadlineDate && deadlineTime) {
                schedulingSettings = `Deadline: ${deadline} | Minimum start time: ${minimumStart}`;
            }
            else if (minimumStartDate && minimumStartTime) {
                schedulingSettings = `Minimum start time: ${minimumStart}`;
            }
            else if (deadlineDate && deadlineTime) {
                schedulingSettings = `Deadline: ${deadline}`;
            }
            userMessage = yield (0, schedule_service_1.autoSchedule)(summary, durationNumber, deadline, schedulingSettings, minimumStart);
        }
        const messageString = (0, schedule_helpers_service_1.convertMessageToString)(userMessage);
        return messageString;
    });
}
/**
 * Reschedules an event. Depending on the reschedule settings chosen by the
 * user, the event is scheduled at the set time or at the next open time slot
 * after the set time. The description of the event is also updated
 * to handle effects of rescheduling.
 * @param {RescheduleData} data - The data recieved from the frontend to
 * reschedule the event.
 * @returns {string} Returns a string to be set as a message to the
 * user with information on the result of the scheduling.
 */
function rescheduleEvent(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { flexible, eventId, rescheduleTime, summary, duration, description, deadline, } = data;
        console.log('rescheduleTime', rescheduleTime);
        const rescheduleTimeDate = new Date(rescheduleTime);
        let deadlineDate = null;
        if (deadline) {
            console.log('deadline', deadline);
            deadlineDate = new Date(deadline);
        }
        yield (0, schedule_helpers_service_1.updateDescription)(eventId, rescheduleTimeDate, flexible, deadlineDate, description);
        let userMessage;
        if (flexible) {
            userMessage = yield (0, schedule_service_1.autoSchedule)(summary, duration, deadlineDate, description, rescheduleTimeDate, eventId);
        }
        else {
            userMessage = yield (0, schedule_service_1.manualSchedule)(summary, rescheduleTimeDate.toDateString(), rescheduleTimeDate.toTimeString(), duration, eventId);
        }
        const messageString = (0, schedule_helpers_service_1.convertMessageToString)(userMessage);
        return messageString;
    });
}
/**
 * Deletes an event from the Google calendar the app uses.
 * @param {string} eventId - The ID of an event.
 */
function deleteEvent(eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield calendar.events.delete({
            auth: google_client_config_1.default,
            calendarId: sign_in_service_1.autoCalendarId,
            eventId: eventId,
        });
    });
}
exports.deleteEvent = deleteEvent;
exports.default = {
    getEvents,
    createEvent,
    deleteEvent,
    rescheduleEvent,
};
