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
const events_service_1 = __importDefault(require("../services/events.service"));
const weekly_hours_service_1 = __importDefault(require("../services/weekly-hours.service"));
function setUnavailableHours(req, res, next) {
    void (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, data } = req.body;
            res.send(yield weekly_hours_service_1.default.setUnavailableHours(user, { data }));
        }
        catch (error) {
            console.error('Error while setting available hours');
            next(error);
        }
    }))();
}
function setWorkingHours(req, res, next) {
    void (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, data } = req.body;
            res.send(yield weekly_hours_service_1.default.setWorkingHours(user, { data }));
        }
        catch (error) {
            console.error('Error while setting working hours');
            next(error);
        }
    }))();
}
function getEvents(req, res, next) {
    void (() => __awaiter(this, void 0, void 0, function* () {
        try {
            res.send(yield events_service_1.default.getEvents(req.body.user));
        }
        catch (error) {
            console.error('Error while getting events');
            next(error);
        }
    }))();
}
function createEvent(req, res, next) {
    void (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, data } = req.body;
            res.send(yield events_service_1.default.createEvent(user, data));
        }
        catch (error) {
            console.error('Error while creating event');
            next(error);
        }
    }))();
}
function rescheduleEvent(req, res, next) {
    void (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, data } = req.body;
            res.send(yield events_service_1.default.rescheduleEvent(user, data));
        }
        catch (error) {
            console.error('Error while rescheduling event');
            next(error);
        }
    }))();
}
function deleteEvent(req, res, next) {
    void (() => __awaiter(this, void 0, void 0, function* () {
        try {
            const { eventId, user } = req.body;
            res.send(yield events_service_1.default.deleteEvent(eventId, user));
        }
        catch (error) {
            console.error('Error while deleting event');
            next(error);
        }
    }))();
}
exports.default = {
    setUnavailableHours,
    setWorkingHours,
    getEvents,
    createEvent,
    rescheduleEvent,
    deleteEvent,
};
