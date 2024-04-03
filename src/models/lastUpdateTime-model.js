const mongoose = require('mongoose');

const lastUpdateTimeSchema = new mongoose.Schema({
    lastUpdateTime: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LastUpdateTime', lastUpdateTimeSchema);
