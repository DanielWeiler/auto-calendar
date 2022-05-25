"use strict";
/**
 * This service handles signing in the user and initializing Auto Calendar for
 * their Google account. The calendar used by the app will be created on their
 * first sign in and the calendar ID and user time zone variables will be
 * initialized to be used with the Google Calendar API in the app.
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
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const google_client_config_1 = __importDefault(require("../configs/google-client.config"));
const refresh_token_1 = __importDefault(require("../models/refresh_token"));
const helpers_1 = require("../utils/helpers");
require('express-async-errors');
const calendar = googleapis_1.google.calendar('v3');
/**
 * Signs in the user with Google sign in. A database is checked for a user's
 * refresh token. If there is no refresh token, the newly given refresh token
 * is saved to the database. On the first sign in, the Google calendar used
 * by the app is created on the user's account.
 * @param {string} code - The data recieved from the frontend to sign in.
 * @returns {string} Returns the identifier of the user to be used for API
 * requests.
 */
function signIn(code) {
    return __awaiter(this, void 0, void 0, function* () {
        const { tokens } = yield google_client_config_1.default.getToken(code);
        // According to the Google OAuth 2.0 documentation, the "sub" field of the
        // ID token is the unique-identifier key for Google users.
        (0, helpers_1.assertDefined)(tokens.id_token);
        const jwtObject = (0, jwt_decode_1.default)(tokens.id_token);
        const signedInUser = jwtObject.sub;
        (0, helpers_1.assertDefined)(signedInUser);
        // The refresh token of a user needs to be saved for authorization of
        // actions of a user. It is only given when a new one is needed.
        console.log('Signed in!');
        if (tokens.refresh_token !== undefined) {
            yield refresh_token_1.default.find({ user: signedInUser }).deleteOne();
            console.log('Any old refresh token deleted');
            yield new refresh_token_1.default({
                refreshToken: tokens.refresh_token,
                user: signedInUser,
            }).save();
            console.log('New refresh token saved');
        }
        // Initialize the calendar used by the app
        yield createAutoCalendar(signedInUser);
        return signedInUser;
    });
}
/**
 * Creates the Google calendar used by the app.
 * @param {string} user - The identifier of the user making the request.
 */
function createAutoCalendar(user) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, helpers_1.setUserInfo)(user);
        const calendars = yield calendar.calendarList.list({
            auth: google_client_config_1.default,
        });
        (0, helpers_1.assertDefined)(calendars.data.items);
        // Checks if the calendar has already been created
        let calendarCreated = false;
        for (let i = 0; i < calendars.data.items.length; i++) {
            const calendar = calendars.data.items[i];
            if (calendar.summary === 'Auto Calendar') {
                calendarCreated = true;
            }
        }
        if (!calendarCreated) {
            yield calendar.calendars.insert({
                auth: google_client_config_1.default,
                requestBody: {
                    summary: 'Auto Calendar',
                    timeZone: helpers_1.userTimeZone,
                },
            });
        }
    });
}
exports.default = { signIn };
