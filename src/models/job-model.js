// models/Job.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        status: { type: String, required: true },
        conf_id: { type: String, required: true },
        type: { type: String }, // "update now", "import conference"
        progress: { type: Object },
        data: { type: Object },
        error: { type: String },
        duration: { type: Number }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
