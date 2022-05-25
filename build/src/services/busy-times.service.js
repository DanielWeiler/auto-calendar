"use strict";
/**
 * This service queries the busy times that are used to find availability when
 * scheduling auto events.
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
exports.getAllBusyTimes = exports.getHighPriorityEvents = void 0;
const googleapis_1 = require("googleapis");
const google_client_config_1 = __importDefault(require("../configs/google-client.config"));
const helpers_1 = require("../utils/helpers");
const schedule_helpers_service_1 = require("./schedule-helpers.service");
const calendar = googleapis_1.google.calendar('v3');
/**
 * Gets a list of the high priority events during the given query time.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @returns {calendar_v3.Schema$Event[]} Returns a list of high
 * priority event objects.
 */
function getHighPriorityEvents(queryStartTime, queryEndTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const events = yield (0, schedule_helpers_service_1.getEventsInTimePeriod)(queryStartTime, queryEndTime);
        const highPriorityEvents = [];
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            // Check if there is anything in the description that would make the event
            // a high priority event.
            if (event.description) {
                if (event.description.includes('Unavailable hours') ||
                    event.description.includes('Working hours') ||
                    event.description.includes('Manually scheduled') ||
                    event.description.includes('Deadline')) {
                    highPriorityEvents.push(event);
                }
            }
        }
        return highPriorityEvents;
    });
}
exports.getHighPriorityEvents = getHighPriorityEvents;
/**
 * Gets a list of all the busy times during the given query time.
 * @param {Date} queryStartTime - The start time of the search for availability.
 * @param {Date} queryEndTime - The end time of the search for availability.
 * @returns {calendar_v3.Schema$TimePeriod[]} Returns a list of busy
 * time objects.
 */
function getAllBusyTimes(queryStartTime, queryEndTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const availabilityQuery = yield calendar.freebusy.query({
            auth: google_client_config_1.default,
            requestBody: {
                timeMin: queryStartTime.toISOString(),
                timeMax: queryEndTime.toISOString(),
                timeZone: helpers_1.userTimeZone,
                items: [
                    {
                        id: helpers_1.autoCalendarId,
                    },
                ],
            },
        });
        (0, helpers_1.assertDefined)(availabilityQuery.data.calendars);
        const busyTimes = availabilityQuery.data.calendars[helpers_1.autoCalendarId].busy;
        (0, helpers_1.assertDefined)(busyTimes);
        return busyTimes;
    });
}
exports.getAllBusyTimes = getAllBusyTimes;
