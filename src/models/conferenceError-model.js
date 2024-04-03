const mongoose = require('mongoose');

const conferenceErrorSchema = new mongoose.Schema({
    conferenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conference'
    },
    errorType: {
        type: String,
        required: true
    },
    errorMessage: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ConferenceError', conferenceErrorSchema);
