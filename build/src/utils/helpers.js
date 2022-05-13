"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextDayOfTheWeek = exports.assertDefined = exports.parseTime = exports.addTimeToDate = void 0;
/**
 * Adds the given time to the given date.
 * @param {string} time - A time in the format "hh:mm"
 * @param {Date | string} date - A Date object or a string representing a Date
 * object
 * @returns {Date} Returns the new Date object.
 */
function addTimeToDate(time, date) {
    const dateTime = new Date(date);
    const t = parseTime(time);
    dateTime.setHours(t.hours, t.minutes);
    return dateTime;
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