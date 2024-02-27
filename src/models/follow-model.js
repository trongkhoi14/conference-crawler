const mongoose = require('mongoose')

var followSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    confId: {
        type: String,
        required: true
    }
}, 
{ 
    timestamps: true 
})


module.exports = mongoose.model('Follow', followSchema);


