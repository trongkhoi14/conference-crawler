// models/Job.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        status: { type: String, required: true },
        conf_id: { type: String, required: true },
        data: { type: Object },
        error: { type: String },
        duration: { type: Number }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
