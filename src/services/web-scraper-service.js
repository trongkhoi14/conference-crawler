const dateFinder = require("datefinder");
require("dotenv").config();
const Conference = require("../models/conference-model");
const ConferenceError = require("../models/conferenceError-model");
const { readKeywordsFromFile } = require("../untils/handleFileDict");
const { waitForRandomTime } = require("../untils/time");
const { formatStringDate } = require("../untils/date");
const { notification } = require("../template/mail-template");

const getConferenceList = (browser) =>
    new Promise(async (resolve, reject) => {
        try {
            let currentLink =
                `${process.env.PORTAL}?` +
                `search=` +
                `&by=${process.env.BY}` +
                `&source=${process.env.CORE2023}` +
                `&sort=${process.env.SORT}` +
                `&page=${process.env.PAGE}`;
            // Get total page
            const totalPages = await getTotalPages(browser, currentLink);

            // Array to store all conferences
            let allConferences = [];

            // Loop through each page and extract conferences
            for (let i = 1; i <= totalPages; i++) {
                let conferencesOnPage = await getConferencesOnPage(
                    browser,
                    currentLink.slice(0, -1) + i
                );
                //console.log(conferencesOnPage.length)
                allConferences = allConferences.concat(conferencesOnPage);
            }

            resolve(allConferences);
        } catch (error) {
            console.log("Error in web-scraper-service/getConferenceList");
            reject(error);
        }
    });

const searchConferenceLinks = async (browser, conference, maxLinks) => {
    try {
        // Array to get all link from searching
        let links = [];

        // Open new page
        let page = await browser.newPage();

        // Searching with keyword = Acronym + 2023
        await page.goto("https://www.google.com/");
        await page.waitForSelector("#APjFqb");
        await page.keyboard.sendCharacter(
            conference.Acronym + " call for papers 2023"
        );
        await page.keyboard.press("Enter");
        await page.waitForNavigation();
        await page.waitForSelector("#search");

        while (links.length < maxLinks) {
            const linkList = await page.$$eval("#search a", (els) => {
                const result = [];

                const unwantedDomains = [
                    "scholar.google",
                    "translate.google",
                    "google.com",
                    "wikicfp.com",
                    "dblp.org",
                    "medium.com",
                    "dl.acm.org",
                    "easychair.org",
                    "youtube.com",
                    "linkedin.com",
                ];
                for (const el of els) {
                    const href = el.href;
                    // Kiểm tra xem liên kết có chứa tên miền không mong muốn
                    if (
                        !unwantedDomains.some((domain) => href.includes(domain))
                    ) {
                        result.push({
                            link: href,
                        });
                    }
                }
                return result;
            });

            links = links.concat(linkList.map((item) => item.link));

            // Nếu links có nhiều hơn maxLinks, cắt bớt đi
            if (links.length > maxLinks) {
                links = links.slice(0, maxLinks);
            }

            if (links.length < maxLinks) {
                // Chưa đủ liên kết, tiếp tục tìm kiếm bằng cách lướt xuống
                await page.keyboard.press("PageDown");
                await page.waitForTimeout(2000); // Wating for loading
            }
        }

        await page.close();

        return links.slice(0, maxLinks);
    } catch (error) {
        console.log(
            "Error in web-scraper-service/searchConferenceLinks: " + error
        );
        // Log conference lỗi ra một collection riêng
    }
};

// Get conference date, submisstion date, notification date, ...
const getConferenceDetails = async (
    browser,
    conference,
    fullInformationPoint
) => {
    try {
        let submissionDate_keywords,
            conferenceDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords;

        if (conference.Links.length == 1) {
            ({
                submissionDate_keywords,
                conferenceDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
            } = await readKeywordsFromConference(conference));
        } else {
            ({
                submissionDate_keywords,
                conferenceDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
            } = readKeywordsFromDict());
        }

        let snapshotRange;

        if (fullInformationPoint == 3) {
            snapshotRange = 50;
        } else if (fullInformationPoint == 2) {
            snapshotRange = 100;
        }

        for (let k = 0; k < conference.Links.length; k++) {
            const {
                submissionDate,
                conferenceDate,
                notificationDate,
                cameraReady,
            } = await scrapeConferencePage(
                browser,
                conference.Links[k],
                submissionDate_keywords,
                conferenceDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                snapshotRange
            );

            if (
                shouldUpdateConference(
                    fullInformationPoint,
                    submissionDate,
                    conferenceDate,
                    notificationDate
                )
            ) {
                await updateConferenceInDatabase(
                    conference._id,
                    conferenceDate,
                    submissionDate,
                    notificationDate,
                    cameraReady,
                    conference.Links[k]
                );
                return true;
            } else if (k === conference.Links.length - 1) {
                await handleMissingInformationError(conference._id);
                return false;
            }
        }
    } catch (error) {
        console.log(
            "Error in web-scraper-service/getConferenceDetails" + error
        );
        await createOrUpdateError(conference._id, "ErrorNetwork", error);
        return false;
    }
};

const scrapeConferencePage = async (
    browser,
    link,
    submissionDate_keywords,
    conferenceDate_keywords,
    notificationDate_keywords,
    cameraReady_keywords,
    snapshotRange
) => {
    const submissionDate = [];
    const conferenceDate = [];
    const notificationDate = [];
    const cameraReady = [];

    await waitForRandomTime();

    const page = await browser.newPage();
    await page.goto(link, { waitUntil: "domcontentloaded" });
    const bodyContent = await page.content();

    await extractDatesFromBody(
        submissionDate_keywords,
        bodyContent,
        submissionDate,
        snapshotRange
    );
    await extractDatesFromBody(
        conferenceDate_keywords,
        bodyContent,
        conferenceDate,
        snapshotRange
    );
    await extractDatesFromBody(
        notificationDate_keywords,
        bodyContent,
        notificationDate,
        snapshotRange
    );
    await extractDatesFromBody(
        cameraReady_keywords,
        bodyContent,
        cameraReady,
        snapshotRange
    );

    await page.close();

    return { submissionDate, conferenceDate, notificationDate, cameraReady };
};

const extractDatesFromBody = async (
    keywords,
    bodyContent,
    dateArray,
    snapshotRange
) => {
    for (const keyword of keywords) {
        let index = bodyContent.indexOf(keyword);
        while (index !== -1 && index < bodyContent.length) {
            const snapshot = bodyContent.substring(
                Math.max(0, index - snapshotRange),
                index + keyword.length + snapshotRange * 2
            );
            const dateFinderResult = dateFinder(formatStringDate(snapshot));
            if (
                dateFinderResult.length > 0 &&
                !isFakeNews(dateArray, keyword)
            ) {
                dateArray.push({
                    date: findClosestDate(
                        dateFinderResult,
                        snapshot.indexOf(keyword),
                        keyword.length
                    ),
                    keyword: keyword,
                    update_time: new Date(),
                });
                break;
            }
            index = bodyContent.indexOf(keyword, index + 1);
        }
    }
};

const shouldUpdateConference = (
    fullInformationPoint,
    submissionDate,
    conferenceDate,
    notificationDate
) => {
    if (fullInformationPoint === 3) {
        return (
            submissionDate.length > 0 &&
            conferenceDate.length > 0 &&
            notificationDate.length > 0
        );
    } else if (fullInformationPoint === 2) {
        return (
            (submissionDate.length > 0 && conferenceDate.length > 0) ||
            (submissionDate.length > 0 && notificationDate.length > 0) ||
            (conferenceDate.length > 0 && notificationDate.length > 0)
        );
    }
    return false;
};

const updateConferenceInDatabase = async (
    conferenceId,
    conferenceDate,
    submissionDate,
    notificationDate,
    cameraReady,
    link
) => {
    await Conference.findByIdAndUpdate(
        conferenceId,
        {
            ConferenceDate: conferenceDate,
            SubmissonDate: submissionDate,
            NotificationDate: notificationDate,
            CameraReady: cameraReady,
            Links: [link],
        },
        { new: true }
    );
};

const handleMissingInformationError = async (conferenceId) => {
    await createOrUpdateError(
        conferenceId,
        "MissingInformation",
        "Submission, conference, or notification date not found for any link."
    );
};

const readKeywordsFromDict = () => {
    const submissionDate_keywords = readKeywordsFromFile(
        "/dict/submission_date_dict.txt"
    );
    const conferenceDate_keywords = readKeywordsFromFile(
        "/dict/conference_date_dict.txt"
    );
    const notificationDate_keywords = readKeywordsFromFile(
        "/dict/notification_date_dict.txt"
    );
    const cameraReady_keywords = readKeywordsFromFile(
        "/dict/camera_ready_dict.txt"
    );

    return {
        submissionDate_keywords,
        conferenceDate_keywords,
        notificationDate_keywords,
        cameraReady_keywords,
    };
};

const readKeywordsFromConference = async (conference) => {
    const conferenceData = await Conference.findOne({ _id: conference._id });

    const submissionDate_keywords = conferenceData.SubmissonDate.map(
        (item) => item.keyword
    );
    const conferenceDate_keywords = conferenceData.ConferenceDate.map(
        (item) => item.keyword
    );
    const notificationDate_keywords = conferenceData.NotificationDate.map(
        (item) => item.keyword
    );
    const cameraReady_keywords = conferenceData.CameraReady.map(
        (item) => item.keyword
    );

    return {
        submissionDate_keywords,
        conferenceDate_keywords,
        notificationDate_keywords,
        cameraReady_keywords,
    };
};

const createOrUpdateError = async (conferenceId, errorType, errorMessage) => {
    const existingError = await ConferenceError.findOne({
        conferenceId,
        errorType,
    });

    if (existingError) {
        // If error exists, update the existing error
        await ConferenceError.findByIdAndUpdate(
            existingError._id,
            { errorType: errorType },
            { errorMessage: errorMessage },
            { new: true }
        );
    } else {
        // If error doesn't exist, create a new one
        const newError = new ConferenceError({
            conferenceId,
            errorType: errorType,
            errorMessage: errorMessage,
        });
        await newError.save();
    }
};

const getTotalPages = async (browser, url) => {
    let page = await browser.newPage();

    // Navigate to the first page to get the total number of pages
    await page.goto(url);

    // Extract the total number of pages from core.portal.com
    const totalPages = await page.evaluate(() => {
        const pageElements = document.querySelectorAll("#search > a");
        let maxPage = 1;
        pageElements.forEach((element) => {
            const pageValue =
                element.textContent.length < 5
                    ? parseInt(element.textContent)
                    : null;
            if (!isNaN(pageValue) && pageValue > maxPage) {
                maxPage = pageValue;
            }
        });

        return maxPage;
    });
    await page.close();
    return totalPages;
};

const getConferencesOnPage = (browser, currentLink) =>
    new Promise(async (resolve, reject) => {
        try {
            // Open new tab
            let page = await browser.newPage();

            // Go to current link
            await page.goto(currentLink);

            // Await loading
            await page.waitForSelector("#container");

            const scrapeData = [];

            const data = await page.$$eval("#search > table tr td", (tds) =>
                tds.map((td) => {
                    return td.innerText;
                })
            );

            let currentIndex = 0;

            while (currentIndex < data.length) {
                const obj = {
                    Title: data[currentIndex],
                    Acronym: data[currentIndex + 1],
                    Source: data[currentIndex + 2],
                    Rank: data[currentIndex + 3],
                    Note: data[currentIndex + 4],
                    DBLP: data[currentIndex + 5],
                    PrimaryFoR: data[currentIndex + 6],
                    Comments: data[currentIndex + 7],
                    AverageRating: data[currentIndex + 8],
                };
                scrapeData.push(obj);
                currentIndex += 9;
            }

            // Close tab
            await page.close();

            resolve(scrapeData);
        } catch (error) {
            reject(error);
        }
    });

// Xử lý khi datefinder tìm được nhiều ngày
const findClosestDate = (dateResults, keywordIndex, keywordLength) => {
    // Nếu chỉ có một ngày được tìm thấy, trả về ngày đó luôn
    if (dateResults.length === 1) {
        return dateResults[0].date;
    }

    // Tìm ngày có sự chênh lệch index nhỏ nhất
    let closestDate = dateResults.reduce((closest, result) => {
        let diff = 0;
        if (result.startIndex < keywordIndex) {
            let dateIndex = result.endIndex;
            diff = Math.abs(keywordIndex - dateIndex);
            //console.log('truoc: ' +diff)
        } else {
            let dateIndex = result.startIndex;
            diff = Math.abs(dateIndex - keywordIndex - keywordLength);
            //console.log('sau: '+ diff)
        }

        if (closest === null || diff < closest.diff) {
            return { date: result.date, diff: diff };
        }

        return closest;
    }, null);

    return closestDate.date;
};

const isFakeNews = (array, keywordToCheck) => {
    // Trường hợp vừa có "Notification of Conditional Acceptance" vừa có "notification"
    // thì "notification" là thông tin fake, không được lấy

    // some được sử dụng để kiểm tra xem ít nhất một phần tử trong mảng
    // có chứa từ khóa được chỉ định hay không
    // Nếu keyword đã xuất hiện --> là fake new
    if (
        array.some((item) =>
            item.keyword.toLowerCase().includes(keywordToCheck.toLowerCase())
        )
    ) {
        return true;
    }
    return false;
};

module.exports = {
    getConferenceList,
    searchConferenceLinks,
    getConferenceDetails,
};
