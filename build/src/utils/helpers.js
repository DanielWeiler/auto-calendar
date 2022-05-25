"use strict";
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
exports.setLocalTimeZone = exports.getNextDayOfTheWeek = exports.assertDefined = exports.parseTime = exports.addTimeToDate = exports.setUserInfo = exports.userTimeZone = exports.autoCalendarId = void 0;
const googleapis_1 = require("googleapis");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const google_client_config_1 = __importDefault(require("../configs/google-client.config"));
const refresh_token_1 = __importDefault(require("../models/refresh_token"));
const calendar = googleapis_1.google.calendar('v3');
exports.autoCalendarId = '';
exports.userTimeZone = '';
/**
 * Sets the necessary info for a Google Calendar API request. The refresh token
 * of the user is set to the app's authorization. Also, the ID of the user's
 * Google calendar used by the app and the time zone of the user are stored
 * into variables to be used within the backend.
 * @param {string} user - The identifier of the user making requests.
 */
function setUserInfo(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = yield refresh_token_1.default.find({ user: user });
        const refreshToken = query[0].refreshToken;
        google_client_config_1.default.setCredentials({
            refresh_token: refreshToken,
        });
        exports.autoCalendarId = yield getAutoCalendarId();
        exports.userTimeZone = yield getUserTimeZone();
    });
}
exports.setUserInfo = setUserInfo;
/**
 * Gets the time zone of the user's calendar.
 * @returns {string} Returns a string that is the time zone's name.
 */
function getUserTimeZone() {
    return __awaiter(this, void 0, void 0, function* () {
        const cal = yield calendar.calendars.get({
            auth: google_client_config_1.default,
            calendarId: 'primary',
        });
        assertDefined(cal.data.timeZone);
        return cal.data.timeZone;
    });
}
/**
 * Gets the ID of the Google calendar the app uses.
 * @returns {string} Returns a string that is the calendar ID.
 */
function getAutoCalendarId() {
    return __awaiter(this, void 0, void 0, function* () {
        const calendars = yield calendar.calendarList.list({
            auth: google_client_config_1.default,
        });
        assertDefined(calendars.data.items);
        let autoCalendarId = null;
        for (let i = 0; i < calendars.data.items.length; i++) {
            const calendar = calendars.data.items[i];
            if (calendar.summary === 'Auto Calendar') {
                autoCalendarId = calendar.id;
                break;
            }
        }
        assertDefined(autoCalendarId);
        return autoCalendarId;
    });
}
/**
 * Adds the given time to the given date.
 * @param {string} time - A time in the format "hh:mm"
 * @param {Date | string} date - A Date object or a string representing a Date
 * object
 * @returns {Date} Returns the new Date object.
 */
function addTimeToDate(time, date) {
    // Sets the time to the date
    const dateTimeUTC = new Date(date);
    const t = parseTime(time);
    dateTimeUTC.setHours(t.hours, t.minutes);
    // Sets the user's time zone to the date
    const dateTimeWithTimeZone = setLocalTimeZone(dateTimeUTC);
    return dateTimeWithTimeZone;
}
exports.addTimeToDate = addTimeToDate;
/**
 * Parses the given time string into hours and minutes.
 * @param {string} time - A time in the format "hh:mm"
 * @returns {{ hours: number; minutes: number }} Returns an object containing
 * the hours and minutes of the given time.
 */
function parseTime(time) {
    const h = time.split(':')[0];
    const m = time.split(':')[1];
    const hours = Number(h);
    const minutes = Number(m);
    const t = { hours, minutes };
    return t;
}
exports.parseTime = parseTime;
/**
 * Asserts that the given value is not null or undefined. If the value is
 * indeed null or undefined then it throws an error.
 * @param {T | null | undefined} value -
 */
function assertDefined(value) {
    if (value == null) {
        throw new Error(`Fatal error: value ${value} must not be null/undefined.`);
    }
}
exports.assertDefined = assertDefined;
/**
 * Gets the next day of the week in the current week or the next week,
 * whichever is first.
 * @param {string} dayName - The name of the day of the week being searched for
 * @param {boolean} excludeToday - Whether the current day is included in the
 * search
 * @param {Date} refDate - The date from which the search begins
 * @returns {Date} The date of the next day of the week that is found
 */
function getNextDayOfTheWeek(dayName, excludeToday = false, refDate = new Date()) {
    const dayOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].indexOf(dayName.slice(0, 2));
    refDate.setHours(0, 0, 0, 0);
    refDate.setDate(refDate.getDate() +
        +!!excludeToday +
        ((dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7));
    return refDate;
}
exports.getNextDayOfTheWeek = getNextDayOfTheWeek;
/**
 * Sets the user's time zone to the date without changing the value of the
 * date.
 * @param {Date} dateTime - A Date object
 * @returns {Date} Returns a new Date object with the user's time zone.
 */
function setLocalTimeZone(dateTime) {
    const dateTimeWithTimeZone = (0, moment_timezone_1.default)(dateTime.toISOString())
        .parseZone()
        .tz(exports.userTimeZone, true)
        .toDate();
    return dateTimeWithTimeZone;
}
exports.setLocalTimeZone = setLocalTimeZone;
