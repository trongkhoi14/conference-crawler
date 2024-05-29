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
const fs = require("fs");
const { parse } = require("json2csv");
const { parse: csvParse } = require("csv-parse/sync");
const { isContainsAnyException, handleConferenceException } = require("../exceptions/conference-exception")

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
        //await crawlAllConferencesDetail(browser);
        // await processConferenceError(browser);
        // await getEvaluationDataset(browser)
        // formatEvaluationDataset()
        // updateFormattedConferences()
        // updateCSVConferenceLinks(browser)
        await savePageContent(browser)
    } catch (error) {
        console.log("Error in crawlController: " + error);
    }
};

const savePageContent = async (browser) => {
    const allConferences = await Conference.find({})

    for(let i=85; i< 100; i++) {
        console.log(i)
        const page = await browser.newPage();
        await page.goto(allConferences[i].Links[0], { waitUntil: "domcontentloaded" });
        const bodyContent = await page.content();
    
        fs.writeFile(`./dataset/${allConferences[i].Acronym}.html`, bodyContent, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('File saved successfully!');
            }
        });
        await page.close();
    }
    

   
}

const updateCSVConferenceLinks = async (browser) => {
    const filePath = 'formatted_conferences.csv';

    // Read existing CSV data
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} does not exist.`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const existingData = csvParse(fileContent, { columns: true });

    // Iterate through each row to update links if newColumn is 'link 5'
    for (const row of existingData) {
        if (row.newColumn === 'link 5') {
            try {
                const conference = await Conference.findOne({ _id: row.j_id });
                if (!conference) {
                    console.error(`Conference with j_id ${row.j_id} not found.`);
                    continue;
                }

                const conferenceLinks = await webScraperService.searchConferenceLinks(browser, conference, 8);
                if (conferenceLinks.length === 8) {
                    row.link5 = conferenceLinks[4] || '';
                    row.link6 = conferenceLinks[5] || '';
                    row.link7 = conferenceLinks[6] || '';
                    row.link8 = conferenceLinks[7] || '';
                }
            } catch (error) {
                console.error(`Error updating conference with j_id ${row.j_id}:`, error);
                row.link5 = '';
                row.link6 = '';
                row.link7 = '';
                row.link8 = '';
            }
        }
    }

    // Convert results to CSV
    const fields = Object.keys(existingData[0]);
    const opts = { fields };

    try {
        const csv = parse(existingData, opts);
        fs.writeFileSync(filePath, csv);
        console.log('CSV file has been updated successfully.');
    } catch (err) {
        console.error(err);
    }
};

const updateFormattedConferences = async () => {
    const filePath = "formatted_conferences.csv";

    // Read existing CSV data
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} does not exist.`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const existingData = csvParse(fileContent, { columns: true });

    // Iterate through each row to update the new column
    for (const row of existingData) {
        const j_id = row.j_id;

        try {
            const conference = await Conference.findOne({ _id: j_id });

            if (!conference) {
                row.newColumn = null;
            } else {
                const links = conference.Links;

                if (links.length === 1) {
                    switch (links[0]) {
                        case row.link1:
                            row.newColumn = "link 1";
                            break;
                        case row.link2:
                            row.newColumn = "link 2";
                            break;
                        case row.link3:
                            row.newColumn = "link 3";
                            break;
                        case row.link4:
                            row.newColumn = "link 4";
                            break;
                        default:
                            row.newColumn = "link 5";
                            break;
                    }
                } else if (links.length === 4) {
                    row.newColumn = "4 links";
                } else {
                    row.newColumn = null;
                }
            }
        } catch (error) {
            console.error(
                `Error fetching conference with j_id ${j_id}:`,
                error
            );
            row.newColumn = null;
        }
    }

    // Convert results to CSV
    const fields = [...Object.keys(existingData[0]), "newColumn"];
    const opts = { fields };

    try {
        const csv = parse(existingData, opts);
        fs.writeFileSync(filePath, csv);
        console.log("CSV file has been updated successfully.");
    } catch (err) {
        console.error(err);
    }
};

const formatEvaluationDataset = () => {
    // Read and process the existing CSV file
    try {
        const fileContent = fs.readFileSync("conferences.csv", "utf8");
        const records = csvParse(fileContent, { columns: true });

        const groupedRecords = records.reduce((acc, record) => {
            if (!acc[record.j_id]) {
                acc[record.j_id] = [];
            }
            acc[record.j_id].push(record.link);
            return acc;
        }, {});

        const formattedResults = [];

        for (const [j_id, links] of Object.entries(groupedRecords)) {
            formattedResults.push({
                j_id: j_id,
                link1: links[0] || "",
                link2: links[1] || "",
                link3: links[2] || "",
                link4: links[3] || "",
            });
        }

        const newFields = ["j_id", "link1", "link2", "link3", "link4"];
        const newCsv = parse(formattedResults, { fields: newFields });
        fs.writeFileSync("formatted_conferences.csv", newCsv);
        console.log("Formatted CSV file has been written successfully.");
    } catch (err) {
        console.error(err);
    }
};

const getEvaluationDataset = async (browser) => {
    const allConferences = await Conference.find({});
    console.log(allConferences.length);

    const results = [];

    for (let i = 0; i < conferenceHasIncorrectLinks.length; i++) {
        const currentConference = await conferenceModel.findOne({
            _id: conferenceHasIncorrectLinks[i],
        });

        const conferenceLinks =
            await webScraperService.searchConferenceLinksByTitle(
                browser,
                currentConference,
                4
            );

        results.push({
            j_id: currentConference._id,
            link: conferenceLinks,
        });

        console.log(currentConference._id + " " + i);
    }

    // Read existing CSV data if file exists
    let existingData = [];
    const filePath = "formatted_conferences.csv";
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        existingData = csvParse(fileContent, { columns: true });
    }

    // Create a map of existing records by j_id
    const existingMap = existingData.reduce((acc, record) => {
        acc[record.j_id] = record;
        return acc;
    }, {});

    // Update existing records or add new ones
    results.forEach((result) => {
        const { j_id, link } = result;

        existingMap[j_id] = {
            j_id,
            link1: link[0],
            link2: link[1],
            link3: link[2],
            link4: link[3],
        };
    });

    // Convert the updated map back to an array
    const updatedData = Object.values(existingMap);

    // Convert results to CSV
    const fields = ["j_id", "link1", "link2", "link3", "link4"];
    const opts = { fields };

    try {
        const csv = parse(updatedData, opts);
        fs.writeFileSync(filePath, csv);
        console.log("Formatted CSV file has been written successfully.");
    } catch (err) {
        console.error(err);
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
        console.log(currentConference._id + " " + i);
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
    let isCrawlSuccess = false
    if(conference.Links.length === 1 && isContainsAnyException(conference.Links[0])) {
        isCrawlSuccess = await handleConferenceException(browser, conference._id);
    }
    else {
        let fullInformationPoint = conference.Links.length > 1 ? 3 : 2;
        isCrawlSuccess = await webScraperService.getConferenceDetails(
            browser,
            conference,
            fullInformationPoint
        );
    }


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
                    await webScraperService.searchConferenceLinksByTitle(
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
