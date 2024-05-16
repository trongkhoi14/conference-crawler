const {
    crawlNewConferences,
    crawlAllConferencesDetail,
    processConferenceError,
} = require("../controllers/conference-controller");

const crawlConferenceSchedule = async (browserInstance) => {
    try {
        let browser = await browserInstance;
        // Cào dữ liệu từ core portal
        await crawlNewConferences(browser);

        // Cào chi tiết các hội nghị
        await crawlAllConferencesDetail(browser);

        // Xử lý các hội nghị lỗi
        await processConferenceError(browser);
    } catch (error) {
        console.log("Error in conference schedule: " + error);
    }
};

module.exports = { crawlConferenceSchedule };
