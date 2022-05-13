"use strict";
/**
 * This service handles all operations to set the unavailable hours and working
 * hours of the user. These operations include scheduling the weekly events
 * that represent these hours and handling changing of these hours, which
 * requires deleting the previously set hours and rescheduling conflicting
 * events with the newly set hours.
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
const googleapis_1 = require("googleapis");
const google_client_config_1 = __importDefault(require("../configs/google-client.config"));
const helpers_1 = require("../utils/helpers");
const events_service_1 = require("./events.service");
const schedule_helpers_service_1 = require("./schedule-helpers.service");
const schedule_service_1 = require("./schedule.service");
const sign_in_service_1 = require("./sign-in.service");
const calendar = googleapis_1.google.calendar('v3');
/**
 * Sets the unavailable hours for the calendar. Any previous unavailable hours
 * will be deleted. Any rescheduable events that occur during the new
 * unavailable hours are rescheduled to a suitable time.
 * @param {WeeklyHoursData} weeklyHours - The data of the unavailable hours set by
 * the user.
 */
function setUnavailableHours(weeklyHours) {
    return __awaiter(this, void 0, void 0, function* () {
        yield deletePreviousWeeklyHours('Unavailable hours');
        // Schedule the new unavailable hours
        Object.entries(weeklyHours.data).map((day) => __awaiter(this, void 0, void 0, function* () {
            const eventName = 'Unavailable hours';
            const colorId = '8';
            const weekDay = day[0];
            const date = (0, helpers_1.getNextDayOfTheWeek)(weekDay);
            const startUnavailableHoursNumber = date.setHours(0, 0, 0, 0);
            const startUnavailableHours = new Date(startUnavailableHoursNumber);
            const endUnavailableHoursNumber = date.setHours(23, 59, 0, 0);
            const endUnavailableHours = new Date(endUnavailableHoursNumber);
            // Check if the day was given available hours and if not then the whole
            // day is set as unavailable
            if (day[1].startTime && day[1].endTime) {
                const startAvailableHours = (0, helpers_1.addTimeToDate)(day[1].startTime, date);
                const endAvailableHours = (0, helpers_1.addTimeToDate)(day[1].endTime, date);
                yield scheduleWeeklyEvent(eventName, colorId, startUnavailableHours, startAvailableHours, weekDay);
                yield scheduleWeeklyEvent(eventName, colorId, endAvailableHours, endUnavailableHours, weekDay);
                yield rescheduleWeeklyHoursConflicts(startUnavailableHours, startAvailableHours);
                yield rescheduleWeeklyHoursConflicts(endAvailableHours, endUnavailableHours);
            }
            else {
                yield scheduleWeeklyEvent(eventName, colorId, startUnavailableHours, endUnavailableHours, weekDay);
                yield rescheduleWeeklyHoursConflicts(startUnavailableHours, endUnavailableHours);
            }
        }));
    });
}
/**
 * Sets the working hours for the calendar. Any previous working hours will be
 * deleted. Any rescheduable events that occur during the new working hours are
 * rescheduled to a suitable time.
 * @param {WeeklyHoursData} weeklyHours - The data of the working hours set by
 * the user.
 */
function setWorkingHours(weeklyHours) {
    return __awaiter(this, void 0, void 0, function* () {
        yield deletePreviousWeeklyHours('Working hours');
        // Schedule the new working hours
        Object.entries(weeklyHours.data).map((day) => __awaiter(this, void 0, void 0, function* () {
            const eventName = 'Working hours';
            const colorId = '5';
            const weekDay = day[0];
            const date = (0, helpers_1.getNextDayOfTheWeek)(weekDay);
            // Check if the day was given working hours
            if (day[1].startTime && day[1].endTime) {
                const startWorkingHours = (0, helpers_1.addTimeToDate)(day[1].startTime, date);
                const endWorkingHours = (0, helpers_1.addTimeToDate)(day[1].endTime, date);
                yield scheduleWeeklyEvent(eventName, colorId, startWorkingHours, endWorkingHours, weekDay);
                yield rescheduleWeeklyHoursConflicts(startWorkingHours, endWorkingHours);
            }
        }));
    });
}
/**
 * Deletes the previous weekly hours.
 * @param {string} eventName - The name of the weekly hours event (Either
 * 'Working hours' or 'Unavailable hours').
 */
function deletePreviousWeeklyHours(eventName) {
    return __awaiter(this, void 0, void 0, function* () {
        const list = yield (0, schedule_helpers_service_1.getEventsInTimePeriod)(new Date(), new Date(new Date().setDate(new Date().getDate() + 8)) // A week following
        );
        for (let i = 0; i < list.length; i++) {
            const event = list[i];
            if (event.description === eventName) {
                (0, helpers_1.assertDefined)(event.recurringEventId);
                try {
                    yield (0, events_service_1.deleteEvent)(event.recurringEventId);
                }
                catch (error) {
                    // Catch any instances of the same recurring event that have already
                    // been deleted.
                    if (error instanceof Error &&
                        error.message === 'Resource has been deleted') {
                        continue;
                    }
                }
            }
        }
    });
}
/**
 * Schedules a weekly event to the Google calendar the app uses. This would
 * either be working hours or unavailable hours.
 * @param {string} summary - The summary of the event.
 * @param {string} colorId - The color ID of the event.
 * @param {Date} startDateTime - The start time of the event.
 * @param {Date} endDateTime - The end time of the event.
 * @param {string} weekDay - The day of the week of the event.
 */
function scheduleWeeklyEvent(summary, colorId, startDateTime, endDateTime, weekDay) {
    return __awaiter(this, void 0, void 0, function* () {
        yield calendar.events.insert({
            auth: google_client_config_1.default,
            calendarId: sign_in_service_1.autoCalendarId,
            requestBody: {
                summary: summary,
                colorId: colorId,
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: sign_in_service_1.userTimeZone,
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: sign_in_service_1.userTimeZone,
                },
                description: summary,
                recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${weekDay.slice(0, 2)}`],
            },
        });
    });
}
/**
 * Reschedules reschedulable events conflicting with weekly hours events. Only
 * the next 6 months (27 weeks) are searched for conflicts to limit the amount
 * of Google Calendar api calls.
 * @param {Date} startWeeklyHours - The start time of the weekly event.
 * @param {Date} endWeeklyHours - The end time of the weekly event.
 */
function rescheduleWeeklyHoursConflicts(startWeeklyHours, endWeeklyHours) {
    return __awaiter(this, void 0, void 0, function* () {
        // The events are rescheduled one week at a time.
        for (let week = 0; week < 27; week++) {
            const startTime = new Date(startWeeklyHours);
            const endTime = new Date(endWeeklyHours);
            yield (0, schedule_service_1.rescheduleConflictingEvents)(new Date(startTime.setDate(startTime.getDate() + 7 * week)), new Date(endTime.setDate(endTime.getDate() + 7 * week)));
        }
    });
}
exports.default = {
    setWorkingHours,
    setUnavailableHours,
};
