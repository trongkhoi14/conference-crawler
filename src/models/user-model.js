const mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    address: {
        type: String,
    },
    nationality: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
}, 
{ 
    timestamps: true 
})




module.exports = mongoose.model('User', userSchema);


