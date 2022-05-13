"use strict";
/**
 * This service finds a suitable available time for auto events to be
 * scheduled.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTimeDuration = exports.findAvailabilityBeforeDeadline = exports.findAvailability = void 0;
const helpers_1 = require("../utils/helpers");
const busy_times_service_1 = require("./busy-times.service");
const schedule_helpers_service_1 = require("./schedule-helpers.service");
const schedule_service_1 = require("./schedule.service");
/**
 * Finds the next available time slot on the user's calendar for an event to be
 * scheduled.
 * @param {number} eventDuration - The duration of an event.
 * @param {Date | null} deadline - The deadline of an event.
 * @param {Date | null} minimumStartTime - The minimum start time of an event.
 * @param {boolean} highPriority - Determines if the event is high priority.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
function findAvailability(eventDuration, deadline = null, minimumStartTime = null, highPriority = false) {
    return __awaiter(this, void 0, void 0, function* () {
        // Begin loop to iterate over the following days from the given start time
        let findingAvailability = true;
        let queryDayCount = 0;
        while (findingAvailability) {
            // <queryStartTime> is initiated at the beginning of every iteration of
            // the loop so that the current day being queried can be correctly
            // calculated.
            let queryStartTime = new Date();
            if (minimumStartTime) {
                // The minimum start time is only used if it is in the future.
                if (minimumStartTime > new Date()) {
                    queryStartTime = new Date(minimumStartTime);
                }
            }
            // Set <queryStartTime> to current day being queried for availability
            queryStartTime.setDate(queryStartTime.getDate() + queryDayCount);
            // Enables searching from the given time on the given day and from the
            // beginning of the day on following days
            if (queryDayCount > 0) {
                queryStartTime.setHours(0, 0, 0, 0);
                if (deadline) {
                    // Ends the loop as soon as the current day being queried is past the
                    // event deadline
                    if (queryStartTime > deadline) {
                        break;
                    }
                }
            }
            const queryEndTime = new Date(queryStartTime);
            queryEndTime.setHours(24, 0, 0, 0);
            const availableTime = yield getDayAvailability(highPriority, queryStartTime, queryEndTime, eventDuration);
            if (availableTime) {
                findingAvailability = false;
                return availableTime;
            }
            queryDayCount += 1;
        }
        return;
    });
}
exports.findAvailability = findAvailability;
/**
 * Finds the next available time slot on the user's calendar for an event with
 * a deadline to be scheduled. If no empty time slots long enough for an event
 * could be found before its deadline, this function is called. This function
 * disreguards auto events without deadlines when searching for availability.
 * If the event is scheduled, the conflicting events will be rescheduled to a
 * suitable time.
 * @param {number} durationNumber - The duration of an event.
 * @param {Date} deadline - The deadline of an event.
 * @param {Date | null} minimumStartTime - The minimum start time of an event.
 * @param {string} summary - The summary of an event.
 * @param {string} schedulingSettings - Data of the preferences about the
 * event's scheduling, such as a minimum start time and/or a deadline.
 * @param {string} eventId - The ID of an event.
 * @returns {UserMessage} Returns an object containing details about
 * the message that will be provided to the user about the results of
 * scheduling the event.
 */
function findAvailabilityBeforeDeadline(durationNumber, deadline, minimumStartTime = null, summary, schedulingSettings, eventId = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const userMessage = {
            eventBeingScheduled: '',
            conflictingEvents: '',
        };
        const highpriority = true;
        const startDateTime = yield findAvailability(durationNumber, deadline, minimumStartTime, highpriority);
        const warningMessage = 'There was no time slot available for this event before its deadline. Free some space in your calendar and try again.';
        // If an available time could be found before the deadline, the event is
        // scheduled.
        if (startDateTime) {
            const endDateTime = (0, schedule_helpers_service_1.getEndTime)(startDateTime, durationNumber);
            // If the available time found on the day of the deadline is past the
            // time of the deadline, the event cannot be not scheduled and the user is
            // notified.
            if (endDateTime > deadline) {
                userMessage.eventBeingScheduled = warningMessage;
            }
            else {
                yield (0, schedule_service_1.scheduleEvent)(summary, startDateTime, endDateTime, schedulingSettings, eventId);
                userMessage.eventBeingScheduled = startDateTime.toString();
                userMessage.conflictingEvents = yield (0, schedule_service_1.rescheduleConflictingEvents)(startDateTime, endDateTime, summary);
            }
        }
        // If not, it is because either 1) every time slot between now and the
        // deadline was already filled with a high priority event or 2) there was not
        // enough time between high priority events to schedule this event. And the
        // event is not scheduled and the user is notified.
        else {
            userMessage.eventBeingScheduled = warningMessage;
        }
        return userMessage;
    });
}
exports.findAvailabilityBeforeDeadline = findAvailabilityBeforeDeadline;
/**
 * Finds the next available time slot for the given day for the event that
 * availability is being searched for.
 * @param {boolean} highPriority - Determines if the event is high priority.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @param {number} eventDuration - The duration of the event that availability
 * is being searched for.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
function getDayAvailability(highPriority, queryStartTime, queryEndTime, eventDuration) {
    return __awaiter(this, void 0, void 0, function* () {
        if (highPriority) {
            const startDateTime = yield findHighPriorityAvailability(queryStartTime, queryEndTime, eventDuration);
            return startDateTime;
        }
        else {
            const startDateTime = yield findLowPriorityAvailability(queryStartTime, queryEndTime, eventDuration);
            return startDateTime;
        }
    });
}
/**
 * This function finds a time slot long enough within the queried time for a
 * high priority event during the times of auto events without deadlines. High
 * priority event times are considered busy and the times of auto events
 * without deadlines are considered available.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @param {number} eventDuration - The duration of the event that availability
 * is being searched for.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
function findHighPriorityAvailability(queryStartTime, queryEndTime, eventDuration) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const busyTimes = yield (0, busy_times_service_1.getHighPriorityEvents)(queryStartTime, queryEndTime);
        // Check if there are any busy times within the queried time slot
        if (busyTimes.length === 0) {
            return queryStartTime;
        }
        else {
            // Begin loop to iterate over the busy times in the <busyTimes> array to
            // continue to check for available time within the queried time
            for (let i = 0; i < busyTimes.length; i++) {
                const highPriorityEvent = busyTimes[i];
                (0, helpers_1.assertDefined)((_a = highPriorityEvent.start) === null || _a === void 0 ? void 0 : _a.dateTime);
                (0, helpers_1.assertDefined)((_b = highPriorityEvent.end) === null || _b === void 0 ? void 0 : _b.dateTime);
                const eventStart = new Date(highPriorityEvent.start.dateTime);
                const eventEnd = new Date(highPriorityEvent.end.dateTime);
                // Check if there is enough time for the event from the start of the
                // queried time slot to the start of the first busy time
                if (i === 0) {
                    const availableTime = checkTimeDuration(queryStartTime, eventStart);
                    if (availableTime >= eventDuration) {
                        return queryStartTime;
                    }
                }
                // Check if there is another busy time in the <busyTimes> array
                if (busyTimes[i + 1]) {
                    // If so, check if there is enough time for the event in between
                    // these two busy times
                    const nextEvent = busyTimes[i + 1];
                    (0, helpers_1.assertDefined)((_c = nextEvent.start) === null || _c === void 0 ? void 0 : _c.dateTime);
                    const nextEventStart = new Date(nextEvent.start.dateTime);
                    const availableTime = checkTimeDuration(eventEnd, nextEventStart);
                    if (availableTime >= eventDuration) {
                        return eventEnd;
                    }
                }
                else {
                    // If not, check if there is enough time for the event from the end
                    // of the last busy time to the end of the queried time slot
                    const availableTime = checkTimeDuration(eventEnd, queryEndTime);
                    if (availableTime >= eventDuration) {
                        return eventEnd;
                    }
                }
            }
        }
        return;
    });
}
/**
 * Finds the next empty time slot within the queried time that is long enough
 * for the event being scheduled
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @param {number} eventDuration - The duration of the event that availability
 * is being searched for.
 * @returns {Date | undefined} If an available time is found, returns
 * this time.
 */
function findLowPriorityAvailability(queryStartTime, queryEndTime, eventDuration) {
    return __awaiter(this, void 0, void 0, function* () {
        const busyTimes = yield (0, busy_times_service_1.getAllBusyTimes)(queryStartTime, queryEndTime);
        // Check if there are any busy times within the queried time slot
        if (busyTimes.length === 0) {
            return queryStartTime;
        }
        else {
            // Begin loop to iterate over the busy times in the <busyTimes> array to
            // continue to check for available time within the queried time
            for (let i = 0; i < busyTimes.length; i++) {
                const event = busyTimes[i];
                (0, helpers_1.assertDefined)(event.start);
                (0, helpers_1.assertDefined)(event.end);
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                // Check if there is enough time for the event from the start of the
                // queried time slot to the start of the first busy time
                if (i === 0) {
                    const availableTime = checkTimeDuration(queryStartTime, eventStart);
                    if (availableTime >= eventDuration) {
                        return queryStartTime;
                    }
                }
                // Check if there is another busy time in the <busyTimes> array
                if (busyTimes[i + 1]) {
                    // If so, check if there is enough time for the event in between
                    // these two busy times
                    const nextEvent = busyTimes[i + 1];
                    (0, helpers_1.assertDefined)(nextEvent.start);
                    const nextEventStart = new Date(nextEvent.start);
                    const availableTime = checkTimeDuration(eventEnd, nextEventStart);
                    if (availableTime >= eventDuration) {
                        return eventEnd;
                    }
                }
                else {
                    // If not, check if there is enough time for the event from the end
                    // of the last busy time to the end of the queried time slot
                    const availableTime = checkTimeDuration(eventEnd, queryEndTime);
                    if (availableTime >= eventDuration) {
                        return eventEnd;
                    }
                }
            }
        }
        return;
    });
}
/**
 * Checks the duration of time between the two given times.
 * @param {Date} timeSlotStart - The start time of the time slot.
 * @param {Date} timeSlotEnd - The end time of the time slot.
 * @returns {number} Returns the duration of time of the time slot.
 */
function checkTimeDuration(timeSlotStart, timeSlotEnd) {
    (0, helpers_1.assertDefined)(timeSlotStart);
    (0, helpers_1.assertDefined)(timeSlotEnd);
    const availableTime = (timeSlotEnd.getTime() - timeSlotStart.getTime()) / 60000;
    return availableTime;
}
exports.checkTimeDuration = checkTimeDuration;
