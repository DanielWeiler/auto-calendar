"use strict";
/**
 * This service handles the scheduling of events and determines what time an
 * event will be scheduled.
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
exports.rescheduleConflictingEvents = exports.scheduleEvent = exports.autoSchedule = exports.manualSchedule = void 0;
const googleapis_1 = require("googleapis");
const google_client_config_1 = __importDefault(require("../configs/google-client.config"));
const helpers_1 = require("../utils/helpers");
const availability_service_1 = require("./availability.service");
const schedule_helpers_service_1 = require("./schedule-helpers.service");
const sign_in_service_1 = require("./sign-in.service");
const calendar = googleapis_1.google.calendar('v3');
/**
 * Schedules an event at the time given by the user. Data about the scheduling
 * is stored in the event description. Rescheduable events occuring during this
 * event will be rescheduled to a sutiable time.
 * @param {string} summary - The summary of an event.
 * @param {string} manualDate - The date of an event.
 * @param {string} manualTime - The time of an event.
 * @param {number} durationNumber - The duration of an event.
 * @param {string} eventId - The ID of an event.
 * @returns {UserMessage} Returns an object containing details about
 * the message that will be provided to the user about the results of
 * scheduling the event.
 */
function manualSchedule(summary, manualDate, manualTime, durationNumber, eventId = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const userMessage = {
            eventBeingScheduled: 'Manually scheduled',
            conflictingEvents: '',
        };
        const startDateTime = (0, helpers_1.addTimeToDate)(manualTime, manualDate);
        const endDateTime = (0, schedule_helpers_service_1.getEndTime)(startDateTime, durationNumber);
        const description = 'Manually scheduled';
        yield scheduleEvent(summary, startDateTime, endDateTime, description, eventId);
        userMessage.conflictingEvents = yield rescheduleConflictingEvents(startDateTime, endDateTime, summary);
        return userMessage;
    });
}
exports.manualSchedule = manualSchedule;
/**
 * Schedules an event according to calendar availability. The start time of the
 * event is found according to the <deadline> and <minimumStartTime> variables.
 * @param {string} summary - The summary of an event.
 * @param {number} durationNumber - The duration of an event.
 * @param {Date | null} deadline - The possible deadline of an event.
 * @param {string} schedulingSettings - Data of the preferences about the
 * event's scheduling, such as a minimum start time and/or a deadline.
 * @param {Date | null} minimumStartTime - The possible minimum start time of an event.
 * @param {string} eventId - The ID of an event.
 * @returns {UserMessage} Returns an object containing details about
 * the message that will be provided to the user about the results of
 * scheduling the event.
 */
function autoSchedule(summary, durationNumber, deadline = null, schedulingSettings = '', minimumStartTime = null, eventId = '') {
    return __awaiter(this, void 0, void 0, function* () {
        let userMessage = {
            eventBeingScheduled: '',
            conflictingEvents: '',
        };
        const startDateTime = yield (0, availability_service_1.findAvailability)(durationNumber, deadline, minimumStartTime);
        // If an available time could be found, the event is scheduled.
        if (startDateTime) {
            const endDateTime = (0, schedule_helpers_service_1.getEndTime)(startDateTime, durationNumber);
            // It must be checked if the available time is before the event deadline
            if (deadline) {
                // If the available time found on the day of the deadline is past the
                // time of the deadline, a high priority available time is queried for
                // the event before it's deadline.
                if (endDateTime > deadline) {
                    userMessage = yield (0, availability_service_1.findAvailabilityBeforeDeadline)(durationNumber, deadline, minimumStartTime, summary, schedulingSettings, eventId);
                }
                else {
                    yield scheduleEvent(summary, startDateTime, endDateTime, schedulingSettings, eventId);
                    userMessage.eventBeingScheduled = startDateTime.toString();
                }
            }
            else {
                yield scheduleEvent(summary, startDateTime, endDateTime, schedulingSettings, eventId);
                userMessage.eventBeingScheduled = startDateTime.toString();
            }
        }
        // If not, it is because a time could not be found before the given event
        // deadline and a high priority available time is queried for the event
        // before it's deadline.
        else {
            (0, helpers_1.assertDefined)(deadline);
            userMessage = yield (0, availability_service_1.findAvailabilityBeforeDeadline)(durationNumber, deadline, minimumStartTime, summary, schedulingSettings, eventId);
        }
        return userMessage;
    });
}
exports.autoSchedule = autoSchedule;
/**
 * Schedules an event to the Google calendar the app uses. If an event ID is
 * given, the event is patched. Otherwise, a new event is scheduled.
 * @param {string} summary - The summary of the event.
 * @param {Date} startDateTime - The start time of the event.
 * @param {Date} endDateTime - The end time of the event.
 * @param {string} description - The description of the event.
 * @param {string} eventId - The ID of an event.
 */
function scheduleEvent(summary, startDateTime, endDateTime, description = '', eventId = '') {
    return __awaiter(this, void 0, void 0, function* () {
        if (eventId) {
            yield calendar.events.patch({
                auth: google_client_config_1.default,
                calendarId: sign_in_service_1.autoCalendarId,
                eventId: eventId,
                requestBody: {
                    start: {
                        dateTime: startDateTime.toISOString(),
                        timeZone: sign_in_service_1.userTimeZone,
                    },
                    end: {
                        dateTime: endDateTime.toISOString(),
                        timeZone: sign_in_service_1.userTimeZone,
                    },
                },
            });
        }
        else {
            yield calendar.events.insert({
                auth: google_client_config_1.default,
                calendarId: sign_in_service_1.autoCalendarId,
                requestBody: {
                    summary: summary,
                    colorId: '7',
                    start: {
                        dateTime: startDateTime.toISOString(),
                        timeZone: sign_in_service_1.userTimeZone,
                    },
                    end: {
                        dateTime: endDateTime.toISOString(),
                        timeZone: sign_in_service_1.userTimeZone,
                    },
                    description: description,
                    reminders: {
                        useDefault: false,
                        overrides: [{ method: 'popup', minutes: 30 }],
                    },
                },
            });
        }
    });
}
exports.scheduleEvent = scheduleEvent;
/**
 * This function is called when a manually scheduled event or a high priority
 * event is scheduled to check if there are any conflicting events that need
 * rescheduling. Any reschedulable events that create conflicts will be
 * rescheduled to a suitable time.
 * @param {Date} highPriorityEventStart - The start of the event that other
 * events may be conflicting with.
 * @param {Date} highPriorityEventEnd - The end of the event that other
 * events may be conflicting with.
 * @param {string} highPriorityEventSummary - The summary of the event that
 * other events may be conflicting with.
 * @returns {string} Returns a string, which will be used to created a
 * message for the user about the result of scheduling an event.
 */
function rescheduleConflictingEvents(highPriorityEventStart, highPriorityEventEnd, highPriorityEventSummary = '') {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        let conflictingEventsMessage = '';
        let deadlineIssue = false;
        const conflictingEvents = yield (0, schedule_helpers_service_1.getEventsInTimePeriod)(highPriorityEventStart, highPriorityEventEnd);
        // Length will always be at least 1 because the array contains the event
        // creating the conflict(s)
        if (conflictingEvents.length === 1) {
            return conflictingEventsMessage;
        }
        for (let i = 0; i < conflictingEvents.length; i++) {
            const event = conflictingEvents[i];
            // These if statements disregard events not concerned with conflicts since
            // manually scheduled events can be scheduled at any time, regardless of
            // what else is on the calendar at that time. These events will not be
            // disregarded for auto scheduled events because auto scheduled events are
            // never scheduled over these events. This statement also skips over the
            // high priority event that created the conflict(s).
            if (event.summary === highPriorityEventSummary) {
                continue;
            }
            else if ((_a = event.description) === null || _a === void 0 ? void 0 : _a.includes('Manually scheduled')) {
                conflictingEventsMessage =
                    'Another manually scheduled event is scheduled during this time.';
                continue;
            }
            else if (event.description === 'Working hours') {
                conflictingEventsMessage =
                    'This event was scheduled during working hours.';
                continue;
            }
            else if (event.description === 'Unavailable hours') {
                conflictingEventsMessage =
                    'This event was scheduled outside of available hours.';
                continue;
            }
            (0, helpers_1.assertDefined)(event.summary);
            (0, helpers_1.assertDefined)(event.id);
            (0, helpers_1.assertDefined)((_b = event.start) === null || _b === void 0 ? void 0 : _b.dateTime);
            (0, helpers_1.assertDefined)((_c = event.end) === null || _c === void 0 ? void 0 : _c.dateTime);
            const eventStart = new Date((_d = event.start) === null || _d === void 0 ? void 0 : _d.dateTime);
            const eventEnd = new Date((_e = event.end) === null || _e === void 0 ? void 0 : _e.dateTime);
            const durationNumber = (0, availability_service_1.checkTimeDuration)(eventStart, eventEnd);
            const { schedulingSettings, deadline, minimumStartTime } = (0, schedule_helpers_service_1.parsePotentialDescription)(event.description);
            // Try to reschedule the conflicting event
            const conflictingEventMessage = yield autoSchedule(event.summary, durationNumber, deadline, schedulingSettings, minimumStartTime, event.id);
            // Check if the event was successfully rescheduled and set the corresponding
            // message
            if (conflictingEventMessage.eventBeingScheduled ===
                'There was no time slot available for this event before its deadline. Free some space in your calendar and try again.') {
                deadlineIssue = true;
            }
            else {
                conflictingEventsMessage = 'Conflicting events rescheduled.';
            }
        }
        // If one or more of the conflicting events could not be rescheduled before
        // their deadline, the corresponding message is set.
        if (deadlineIssue) {
            conflictingEventsMessage =
                'One or more conflicting events could not be rescheduled before their deadline. These events were not changed.';
        }
        return conflictingEventsMessage;
    });
}
exports.rescheduleConflictingEvents = rescheduleConflictingEvents;
