const jobModel = require('../models/job-model')

const updateJobProgress = async (job_id, percentage, detail) => {
    await jobModel.findByIdAndUpdate(job_id, {
        progress: {
            percentage: percentage,
            detail: detail
        }
    })
}

module.exports = {
    updateJobProgress
}