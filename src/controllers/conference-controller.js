const cron = require("node-cron");
const schedule = require("node-schedule");
const webScraperService = require("../services/web-scraper-service");
const Conference = require("../models/conference-model");
const LastUpdateTime = require("../models/lastUpdateTime-model");
const ConferenceError = require("../models/conferenceError-model");
const emailService = require("../services/email-service");
const dbConference = require("../models/conference-model");
const dbFollow = require("../models/follow-model");
const dbUser = require("../models/user-model");
const conferenceModel = require("../models/conference-model");
const { dataPineline } = require("../etl/datapineline");
const conferenceHasIncorrectLinks = require("../config/IncorrectLink");

const crawlController = async (browserInstance) => {
    try {
        // Create browser
        let browser = await browserInstance;

        /*
        await crawlNewConferences(browser);

        await crawlAllConferencesDetail(browser);

        await processConferenceError(browser);
        */
        // await processConferenceHasWrongLink(browser);
        // await crawlAllConferencesDetail(browser);
        await processConferenceError(browser);

    } catch (error) {
        console.log("Error in crawlController: " + error);
    }
};

const processConferenceHasWrongLink = async (browser) => {
    console.log(conferenceHasIncorrectLinks.length);
    for (let i = 0; i < conferenceHasIncorrectLinks.length; i++) {
        const currentConference = await conferenceModel.findOne({
            _id: conferenceHasIncorrectLinks[i],
        });
        let conferenceLink =
            await webScraperService.searchConferenceLinksByTitle(
                browser,
                currentConference,
                4
            );
        currentConference.Links = conferenceLink;

        await conferenceModel.findByIdAndUpdate(currentConference._id, {
            Links: conferenceLink,

        });
        console.log(currentConference._id + " " + i)
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
    const existingConferences = await Conference.find({}, "Title");
    console.log(">> ExistingConferences: ", existingConferences.length);
    const newConferences = getNewConferences(
        conferenceList,
        existingConferences
    );
    console.log(">> NewConferences: ", newConferences.length);

    // Step 3: For each new conference, get conference link
    console.log(">> Getting conferences link...");
    for (let i = 0; i < newConferences.length; i++) {
        console.log(i);
        let conferenceLink = await webScraperService.searchConferenceLinks(
            browser,
            newConferences[i],
            4
        );
        newConferences[i].Links = conferenceLink;

        // Store new conference
        await Conference.create(newConferences[i]);

        // Create ramdom time to outplay Captcha
        await setTimeout(function () {},
        Math.floor(Math.random() * 2000) + 1000);

        if (i == 98) break;
    }
    console.log(">> Get conferences link successfully");
};

const getLastUpdateTime = async () => {
    const lastUpdateTimeDoc = await LastUpdateTime.findOne();
    return lastUpdateTimeDoc ? lastUpdateTimeDoc.lastUpdateTime : Date.now();
};

const getConferencesToUpdate = async (lastUpdateTime, errorConferences) => {
    // return await Conference.find({
    //     updatedAt: { $lt: lastUpdateTime },
    //     _id: { $nin: errorConferences },
    // })
    //     .sort({ updatedAt: 1 })
    //     .limit(100);
    let result = []
    for (let i = 0; i < conferenceHasIncorrectLinks.length; i++) {
        const currentConference = await Conference.findById(conferenceHasIncorrectLinks[i])
        result.push(currentConference)
    }
    return result
};

const updateLastUpdateTime = async (lastUpdateTimeDoc) => {
    lastUpdateTimeDoc.lastUpdateTime = Date.now();
    await lastUpdateTimeDoc.save();
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processConference = async (browser, conference) => {
    console.log(conference._id);
    let fullInformationPoint = conference.Links.length > 1 ? 3 : 2;
    const isCrawlSuccess = await webScraperService.getConferenceDetails(
        browser,
        conference,
        fullInformationPoint
    );

    if (isCrawlSuccess) {
        await dataPineline(conference._id);
    }

    await delay(Math.floor(Math.random() * 2000) + 1000);
};


const crawlAllConferencesDetail = async (browser) => {
    console.log(">> Crawling all conference detail...");

    try {
        const lastUpdateTime = await getLastUpdateTime();
        const errorConferences = await ConferenceError.distinct("conferenceId");
        let allConferences = await getConferencesToUpdate(
            lastUpdateTime,
            errorConferences
        );

        const lastUpdateTimeDoc = await LastUpdateTime.findOne();
        await updateLastUpdateTime(lastUpdateTimeDoc);

        for (const conference of allConferences) {
            try {
                await processConference(browser, conference);
            } catch (conferenceError) {
                console.log(
                    `Error processing conference ${conference._id}:`,
                    conferenceError
                );
            }
        }

        console.log(">> Crawl all conference detail successfully");
    } catch (error) {
        console.log("Error in crawlAllConferencesDetail: ", error);
    }
};

const processConferenceError = async (browser) => {
    try {
        const lastUpdateTimeDoc = await LastUpdateTime.findOne();
        const lastUpdateTime = lastUpdateTimeDoc
            ? lastUpdateTimeDoc.lastUpdateTime
            : Date.now();

        const errorConferences = await ConferenceError.find({
            errorType: "MissingInformation",
        }).distinct("conferenceId");
        console.log("Số conf lỗi: " + errorConferences.length);

        let allConferences = await Conference.find({
            updatedAt: { $lt: lastUpdateTime },
            _id: { $in: errorConferences },
        })
            .sort({ updatedAt: 1 })
            .limit(100);
        lastUpdateTimeDoc.lastUpdateTime = Date.now();

        await lastUpdateTimeDoc.save();

        // Step 4: Loop through each conference and get detail
        for (const conference of allConferences) {
            try {
                console.log(conference._id);

                let conferenceLink =
                    await webScraperService.searchConferenceLinks(
                        browser,
                        conference,
                        10
                    );
                conference.Links = conferenceLink;
                const isCrawlSuccess =
                    await webScraperService.getConferenceDetails(
                        browser,
                        conference,
                        2
                    );

                if (isCrawlSuccess) {
                    console.log("success: " + conference._id);

                    await dataPineline(conference._id);

                    await ConferenceError.deleteMany({
                        conferenceId: conference._id,
                    });
                }
                // Create random time to outplay Captcha
                await setTimeout(function () {},
                Math.floor(Math.random() * 2000) + 1000);
            } catch (error) {
                console.log(
                    "Error occurred for conference: " +
                        conference._id +
                        " - " +
                        error
                );
                // Continue to the next iteration even if an error occurs
                continue;
            }
        }
        console.log(">> Process conference error successfully");
    } catch (error) {
        console.log("Error in processConferenceError: " + error);
    }
};

// Process and store after getting all information
const processConferenceDetails = async (details) => {
    //console.log('Conference Details:', details);
    // Conference date chỉ được có một --> xóa bớt, chỉ lấy cái đầu tiên
    // Xử lý trường hợp cào sai ngày, ...
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

module.exports = {
    crawlController,
    crawlNewConferences,
    crawlAllConferencesDetail,
    processConferenceError,
};
