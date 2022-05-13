"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const events_controller_1 = __importDefault(require("../controllers/events.controller"));
const router = express_1.default.Router();
router.get('/', events_controller_1.default.getEvents);
router.post('/set-working-hours', events_controller_1.default.setWorkingHours);
router.post('/set-available-hours', events_controller_1.default.setUnavailableHours);
router.post('/create-event', events_controller_1.default.createEvent);
router.post('/delete-event', events_controller_1.default.deleteEvent);
router.post('/reschedule-event', events_controller_1.default.rescheduleEvent);
exports.default = router;
