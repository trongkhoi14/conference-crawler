const cron = require("node-cron");
const schedule = require("node-schedule");
const webScraperService = require("../services/web-scraper-service");
const Conference = require("../models/conference-model");
const LastUpdateTime = require("../models/lastUpdateTime-model");
const ConferenceError = require("../models/conferenceError-model");

const crawlController = async (browserInstance) => {
    try {
        // Create browser
        let browser = await browserInstance;

        // Schedule the job to run at 2:00 AM every day
        // Code to here
        // await crawlNewConferences(browser);

        // Schedule the job to run for each conference in the database
        // Code to here
        await crawlAllConferencesDetail(browser);
    } catch (error) {
        console.log("Error in crawlController: " + error);
    }
};

// Get new conferences from Core portal
const crawlNewConferences = async (browser) => {
    // Step 1: Get conference list from Core portal
    console.log(">> Getting conference list from Core portal...");
    const conferenceList = await webScraperService.getConferenceList(browser);
    console.log(
        ">> Conference list from Core portal: " + conferenceList.length
    );

    // Step 2: Compare with conference list in Database
    const existingConferences = await Conference.find({});
    console.log(">> ExistingConferences: ", existingConferences.length);

    // Step 2a: Get conferences with no links from existingConferences
    const conferencesWithNoLinks = existingConferences.filter(
        (conf) => !conf.Links || conf.Links.length === 0
    );

    // Step 2b: Merge conferences with no links into newConferences
    const newConferences = [
        ...getNewConferences(conferenceList, existingConferences),
        ...conferencesWithNoLinks,
    ];
    console.log(">> NewConferences: ", newConferences.length);

    // Step 3: For each new conference, get conference link
    console.log(">> Getting conferences link...");
    for (let i = 0; i < newConferences.length; i++) {
        console.log(i);
        let conferenceLink = await webScraperService.searchConferenceLinks(
            browser,
            newConferences[i]
        );
        newConferences[i].Links = conferenceLink;

        // Store new conference or update existing conference
        if (conferencesWithNoLinks.includes(newConferences[i])) {
            // If the conference was previously without links, update it
            await Conference.findByIdAndUpdate(
                newConferences[i]._id,
                {
                    Links: conferenceLink,
                },
                { new: true }
            );
        } else {
            // If it's a new conference, create it
            await Conference.create(newConferences[i]);
        }

        // Create ramdom time to outplay Captcha
        setTimeout(function () {}, Math.floor(Math.random() * 2000) + 1000);

        if (i == 98) break;
    }
    console.log(">> Get conferences link successfully");
};

// Get all conferences detail from conference link
// const crawlAllConferencesDetail = async (browser) => {
//     console.log(">> Crawling all conference detail...");
//     // Step 1: Get all conference from Database
//     let allConferences = await Conference.find({});
//     // console.log(allConferences.length)
//     // Step 2: For each conference, get detail
//     for (let i = 0; i < allConferences.length; i++) {
//         if (
//             allConferences[i].ConferenceDate.length === 0 ||
//             allConferences[i].SubmissionDate === 0 ||
//             allConferences[i].NotificationDate === 0
//         ) {
//             console.log(i);
//             await webScraperService.getConferenceDetails(
//                 browser,
//                 allConferences[i]
//             );
//         }

//         // Create ramdom time to outplay Captcha
//         setTimeout(function () {}, Math.floor(Math.random() * 2000) + 1000);

//         if (i == 10) break;
//         /*
//            Tạo một collection lưu lại thời gian crawlAllConferencesDetail
//            gần nhất, để mỗi khi chạy thì sẽ lấy những conf
//            có updateAt < last update time thôi
//         */
//     }

//     console.log(">> Crawl all conference detail successfully");
// };
const crawlAllConferencesDetail = async (browser) => {
    console.log(">> Crawling all conference detail...");

    try {
        // Step 1: Get the last updated time from the collection in the database
        const lastUpdateTimeDoc = await LastUpdateTime.findOne();
        const lastUpdateTime = lastUpdateTimeDoc
            ? lastUpdateTimeDoc.lastUpdateTime
            : Date.now();

        // Step 2: Get all conferences from Database that need to be updated based on the last update time
        const errorConferences = await ConferenceError.distinct("conferenceId");
        let allConferences = await Conference.find({
            updatedAt: { $lt: lastUpdateTime }, // Find conferences that were updated before the last update time
            _id: { $nin: errorConferences }, // Exclude conferences with IDs in errorConferences array
        })
            .sort({ updatedAt: 1 })
            .limit(100);

        // Step 3: Update the last updated time for crawlAllConferencesDetail
        lastUpdateTimeDoc.lastUpdateTime = Date.now();
        await lastUpdateTimeDoc.save();

        // Step 4: Loop through each conference and get detail
        for (const conference of allConferences) {
            console.log(conference._id);
            await webScraperService.getConferenceDetails(browser, conference);

            // Create random time to outplay Captcha
            setTimeout(function () {}, Math.floor(Math.random() * 2000) + 1000);
        }

        console.log(">> Crawl all conference detail successfully");
    } catch (error) {
        console.log("Error in crawlAllConferencesDetail: ", error);
    }
};
// Get new conferences
const getNewConferences = (newList, existingList) => {
    // Compare new list with existing list based on name
    return newList.filter(
        (newConf) =>
            !existingList.some(
                (existingConf) => existingConf.Title === newConf.Title
            )
    );
};

module.exports = { crawlController };