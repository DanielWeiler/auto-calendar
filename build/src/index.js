"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const events_route_1 = __importDefault(require("./routes/events.route"));
const sign_in_route_1 = __importDefault(require("./routes/sign-in.route"));
const helpers_1 = require("./utils/helpers");
const app = (0, express_1.default)();
const errorHandler = (err, _req, res, next) => {
    res.status(err.status || 500);
    res.send({
        status: err.status || 500,
        message: err.message,
    });
    next(err);
};
(0, helpers_1.assertDefined)(process.env.MONGODB_URI);
console.log('connecting to MongoDB');
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    console.log('connected to MongoDB');
})
    .catch((error) => {
    console.log('error connecting to MongoDB:', error.message);
});
app.use(express_1.default.static('build/frontend'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use('/api/sign-in', sign_in_route_1.default);
app.use('/api/events', events_route_1.default);
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 @ http://localhost:${PORT}`));
