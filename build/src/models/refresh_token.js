"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const refreshTokenSchema = new mongoose_1.default.Schema({
    refreshToken: String,
    user: String,
});
const RefreshTokenModel = mongoose_1.default.model('RefreshToken', refreshTokenSchema);
exports.default = RefreshTokenModel;
