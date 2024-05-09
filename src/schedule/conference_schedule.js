const {
    crawlNewConferences,
    crawlAllConferencesDetail,
    processConferenceError,
} = require("../controllers/conference-controller");

const crawlConferenceSchedule = async (browserInstance) => {
    try {
        let browser = await browserInstance;
        await crawlNewConferences(browser);
        await crawlAllConferencesDetail(browser);
        await processConferenceError(browser);
    } catch (error) {
        console.log("Error in conference schedule: " + error);
    }
};

module.exports = { crawlConferenceSchedule };
