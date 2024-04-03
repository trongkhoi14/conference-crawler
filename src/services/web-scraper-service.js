const puppeteer = require("puppeteer");
const dateFinder = require("datefinder");
const fs = require("fs");
require("dotenv").config();
const Conference = require("../models/conference-model");
const ConferenceError = require("../models/conferenceError-model");

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

const searchConferenceLinks = async (browser, conference) => {
    try {
        // Total link need to collect
        const maxLinks = 4;

        // Array to get all link from searching
        let links = [];

        // Open new page
        let page = await browser.newPage();

        // Searching with keyword = Acronym + 2023
        await page.goto("https://www.google.com/");
        await page.waitForSelector("#APjFqb");
        await page.keyboard.sendCharacter(conference.Acronym + " 2023");
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
                    "youtube.com"
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
        console.log("Error in web-scraper-service/searchConferenceLinks ");
        // Log conference lỗi ra một collection riêng
    }
};

// Get conference date, submisstion date, notification date, ...
const getConferenceDetails = async (browser, conference) => {
    try {
        // Getting keywords from dict
        const submissionDate_keywords = fs
            .readFileSync(__dirname + "/dict/submission_date_dict.txt", "utf-8")
            .split("\n")
            .map((keyword) => keyword.trim());
        const conferenceDate_keywords = fs
            .readFileSync(__dirname + "/dict/conference_date_dict.txt", "utf-8")
            .split("\n")
            .map((keyword) => keyword.trim());
        const notificationDate_keywords = fs
            .readFileSync(
                __dirname + "/dict/notification_date_dict.txt",
                "utf-8"
            )
            .split("\n")
            .map((keyword) => keyword.trim());

        // For each conference link
        for (let k = 0; k < conference.Links.length; k++) {
            // Array to store conference details
            const submissionDate = [];
            const conferenceDate = [];
            const notificationDate = [];

            // Create ramdom time to outplay Captcha
            setTimeout(function () {}, Math.floor(Math.random() * 2000) + 1000);

            // Open new tab
            const page = await browser.newPage();

            //  Go to conference link
            await page.goto(`${conference.Links[k]}`, {
                waitUntil: "domcontentloaded",
            });

            // Getting page content
            const bodyContent = await page.content();

            // Getting submisstion date
            for (const keyword of submissionDate_keywords) {
                // Kiểm tra xem đã tìm được submisstion date chưa
                //if(submissionDate.length > 0) break;

                let index = bodyContent.indexOf(keyword);
                while (index !== -1 && index < bodyContent.length) {
                    const snapshot = bodyContent.substring(
                        Math.max(0, index - 50),
                        index + keyword.length + 100
                    );
                    //console.log(snapshot)
                    const submissionDateFinder = dateFinder(
                        formatString(snapshot)
                    );
                    if (submissionDateFinder.length > 0) {
                        // Trước khi push cần phải kiểm tra có phải fake new hay không
                        if (!isFakeNews(submissionDate, keyword)) {
                            submissionDate.push({
                                date: findClosestDate(
                                    submissionDateFinder,
                                    snapshot.indexOf(keyword),
                                    keyword.length
                                ),
                                keyword: keyword,
                                update_time: new Date(),
                            });
                        }
                        break;
                    }
                    // Tìm vị trí tiếp theo của keyword
                    index = bodyContent.indexOf(keyword, index + 1);
                }
                if (index === -1) {
                    //console.log(`Not found: ${keyword}`);
                }
            }

            // Getting conference date
            for (const keyword of conferenceDate_keywords) {
                // Kiểm tra xem đã tìm được conference date chưa
                if (conferenceDate.length > 0) break;

                let index = bodyContent.indexOf(keyword);
                while (index !== -1 && index < bodyContent.length) {
                    const snapshot = bodyContent.substring(
                        Math.max(0, index - 50),
                        index + keyword.length + 100
                    );
                    const conferenceDateFinder = dateFinder(
                        formatString(snapshot)
                    );
                    if (conferenceDateFinder.length > 0) {
                        if (!isFakeNews(conferenceDate, keyword)) {
                            conferenceDate.push({
                                date: findClosestDate(
                                    conferenceDateFinder,
                                    snapshot.indexOf(keyword),
                                    keyword.length
                                ),
                                keyword: keyword,
                                update_time: new Date(),
                            });
                        }
                        break;
                    }
                    // Tìm vị trí tiếp theo của keyword
                    index = bodyContent.indexOf(keyword, index + 1);
                }
                if (index === -1) {
                    //console.log(`Not found: ${keyword}`);
                }
            }

            // Getting notification date
            for (const keyword of notificationDate_keywords) {
                // Kiểm tra xem đã tìm được notification date chưa
                //if(notificationDate.length > 0) break;

                let index = bodyContent.indexOf(keyword);
                while (index !== -1 && index < bodyContent.length) {
                    const snapshot = bodyContent.substring(
                        Math.max(0, index - 50),
                        index + keyword.length + 100
                    );
                    const notificationDateFinder = dateFinder(
                        formatString(snapshot)
                    );
                    if (notificationDateFinder.length > 0) {
                        if (!isFakeNews(notificationDate, keyword)) {
                            notificationDate.push({
                                date: findClosestDate(
                                    notificationDateFinder,
                                    snapshot.indexOf(keyword),
                                    keyword.length
                                ),
                                keyword: keyword,
                                update_time: new Date(),
                            });
                        }
                        break;
                    }
                    // Tìm vị trí tiếp theo của keyword
                    index = bodyContent.indexOf(keyword, index + 1);
                }
                if (index === -1) {
                    //console.log(`Not found: ${keyword}`);
                }
            }

            // If full information, Update conference in Database
            if (
                submissionDate.length > 0 &&
                conferenceDate.length > 0 &&
                notificationDate.length > 0
            ) {
                await Conference.findByIdAndUpdate(
                    conference._id,
                    {
                        ConferenceDate: conferenceDate,
                        SubmissonDate: submissionDate,
                        NotificationDate: notificationDate,
                        Links: [conference.Links[k]],
                    },
                    { new: true }
                );
                await page.close();
                break;
            } else if (k === conference.Links.length - 1) {
                await createOrUpdateError(
                    conference._id,
                    "MissingInformation",
                    "Submission, conference, or notification date not found for any link."
                );
            }

            // Close tab
            await page.close();
        }
    } catch (error) {
        console.log(
            "Error in web-scraper-service/getConferenceDetails" + error
        );
        await createOrUpdateError(
            conference._id,
            "ErrorNetwork",
            error
        );
    }
};

const createOrUpdateError = async (conferenceId, errorType, errorMessage) => {
    const existingError = await ConferenceError.findOne({ conferenceId, errorType });

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

//
// Tiền xử lý trước khi trích xuất ngày tháng
const formatString = (str) => {
    return str
        .replace(/(\s0)([1-9])\b/g, "$2")
        .replace(/(\d+)(st|nd|rd|th),/g, "$1,");
};

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
