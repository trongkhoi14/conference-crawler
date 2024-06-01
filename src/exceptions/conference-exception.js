const conferenceModel = require("../models/conference-model");
const { waitForRandomTime } = require("../untils/time");
const {
    extractDatesFromBody,
    readKeywordsFromDict,
} = require("../services/web-scraper-service");
const {
    extractDates,
    formatStringDate,
    convertDateInString,
    convertDateInString2,
    convertDateInString3,
} = require("../untils/date");
const Conference = require("../models/conference-model");
const dateFinder = require("datefinder");

// Danh sách các domain cần xử lý ngoại lệ
const listConferenceException = [
    "conferences.sigcomm.org",
    "iaria.org",
    "doceng.org",
    "conf.researchr.org"
];

const handleConferenceException = async (browser, conferenceId) => {
    const currentConference = await conferenceModel.findOne({
        _id: conferenceId,
    });

    const exceptionString = getExceptionString(currentConference.Links[0]);

    switch (exceptionString) {
        case listConferenceException[0]:
            await getSIGCOMMConferenceDetail(browser, currentConference);
            break;

        case listConferenceException[1]:
            await getIARIAConferenceDetail(browser, currentConference);
            break;

        case listConferenceException[2]:
            await getDOCENGConferenceDetail(browser, currentConference);
            break;

        case listConferenceException[3]:
            await getRESEARCHRConferenceDetail(browser, currentConference);
            break;
    }
    return true;
};

const isContainsAnyException = (conferenceLink) => {
    for (let i = 0; i < listConferenceException.length; i++) {
        if (conferenceLink.includes(listConferenceException[i])) {
            return true;
        }
    }
    return false;
};

const getExceptionString = (conferenceLink) => {
    for (let i = 0; i < listConferenceException.length; i++) {
        if (conferenceLink.includes(listConferenceException[i])) {
            return listConferenceException[i];
        }
    }
    return "none";
};

const getSIGCOMMConferenceDetail = async (browser, conference) => {
    try {
        console.log("getSIGCOMMConferenceDetail");
        const submissionDate = [];
        const conferenceDate = [];
        const notificationDate = [];
        const cameraReady = [];
        let callForPaper = "";

        const {
            submissionDate_keywords,
            conferenceDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords,
        } = await readKeywordsFromDict();

        await waitForRandomTime();

        const page = await browser.newPage();
        await page.goto(conference.Links[0], { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".content-primary");

        const bodyContent = await page.content();

        const data = await page.$$eval(".content-primary", (els) => {
            return els.map((el) => {
                return el.innerText;
            });
        });

        callForPaper = data.join(" ");

        const importantDate = await page.$$eval(
            ".ui-li-static.ui-body-inherit",
            (els) => {
                return els.map((el) => {
                    return el.innerText;
                });
            }
        );

        await extractDatesFromBody(
            submissionDate_keywords,
            importantDate[0],
            submissionDate,
            50
        );

        await extractDatesFromBody(
            submissionDate_keywords,
            importantDate[1],
            submissionDate,
            50
        );

        await extractDatesFromBody(
            notificationDate_keywords,
            importantDate[2],
            notificationDate,
            50
        );

        const { startDate, endDate } = extractDates(importantDate[3]);

        conferenceDate.push({
            date: startDate,
            keyword: "Conference start",
            update_time: new Date(),
        });

        conferenceDate.push({
            date: endDate,
            keyword: "Conference end",
            update_time: new Date(),
        });

        await Conference.findByIdAndUpdate(
            conference._id,
            {
                ConferenceDate: conferenceDate,
                SubmissonDate: submissionDate,
                NotificationDate: notificationDate,
                CameraReady: cameraReady,
                Links: conference.Links,
                CallForPaper: callForPaper.toString(),
            },
            { new: true }
        );
    } catch (error) {
        console.log("Error in getSIGCOMMConferenceDetail: " + error);
    }
};

const getIARIAConferenceDetail = async (browser, conference) => {
    try {
        console.log("getIARIAConferenceDetail");
        const submissionDate = [];
        const conferenceDate = [];
        const notificationDate = [];
        const cameraReady = [];
        let callForPaper = "";

        const {
            submissionDate_keywords,
            conferenceDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords,
        } = await readKeywordsFromDict();

        await waitForRandomTime();

        const page = await browser.newPage();
        await page.goto(conference.Links[0], { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".contents");

        const getConfDate = await page.$$eval(".conflabels", (els) => {
            return els.map((el) => {
                return el.innerText;
            });
        });

        const location = getConfDate[0].split(" - ")[1]

        const findDate = dateFinder(getConfDate);

        conferenceDate.push({
            date: findDate[0].date,
            keyword: "Conference start",
            update_time: new Date(),
        });

        conferenceDate.push({
            date: findDate[1].date,
            keyword: "Conference end",
            update_time: new Date(),
        });

        const data = await page.$$eval(".second", (els) => {
            return els.map((el) => {
                return el.innerText;
            });
        });

        callForPaper = normalizeText(data.join(" "));

        let importantDate = await page.$$eval(".content", (els) => {
            return els.map((el) => {
                return el.innerText;
            });
        });

        importantDate = importantDate[0]
            .split("\n")
            .filter((line) => !/^\s*$/.test(line))
            .slice(0, 8);

        await extractDatesFromBody(
            submissionDate_keywords,
            importantDate.slice(0, 2).join("\n"),
            submissionDate,
            50
        );

        await extractDatesFromBody(
            notificationDate_keywords,
            importantDate.slice(2, 4).join("\n"),
            notificationDate,
            50
        );

        await extractDatesFromBody(
            notificationDate_keywords,
            importantDate.slice(4, 6).join("\n"),
            notificationDate,
            50
        );

        await extractDatesFromBody(
            cameraReady_keywords,
            importantDate.slice(6, 8).join("\n"),
            cameraReady,
            50
        );

        await Conference.findByIdAndUpdate(
            conference._id,
            {
                ConferenceDate: conferenceDate,
                SubmissonDate: submissionDate,
                NotificationDate: notificationDate,
                CameraReady: cameraReady,
                CallForPaper: callForPaper,
                Location: location
            },
            { new: true }
        );

        await page.close()
    } catch (error) {
        console.log("Error in getIARIAConferenceDetail: " + error);
    }
};

const getDOCENGConferenceDetail = async (browser, conference) => {
    try {
        console.log("getIARIAConferenceDetail");
        const submissionDate = [];
        const conferenceDate = [];
        const notificationDate = [];
        const cameraReady = [];
        let callForPaper = "";

        const {
            submissionDate_keywords,
            conferenceDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords,
        } = await readKeywordsFromDict();

        await waitForRandomTime();

        const page = await browser.newPage();
        await page.goto(conference.Links[0], { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#content");

        const getConfDate = await page.$$eval("p", (els) => {
            return els.map((el) => {
                return el.innerText;
            });
        });

        const findDate = dateFinder(getConfDate[0]);

        conferenceDate.push({
            date: findDate[0].date,
            keyword: "Conference start",
            update_time: new Date(),
        });

        conferenceDate.push({
            date: findDate[1].date,
            keyword: "Conference end",
            update_time: new Date(),
        });

        callForPaper = getConfDate.slice(1, 4).join("\n\n");

        let deletedData = await page.$$eval("del", (els) => {
            return els.map((el) => {
                return el.innerText;
            });
        });

        let importantDate = await page.$$eval("table", (els) => {
            return els.map((el) => {
                return el.innerText;
            });
        });

        importantDate = replaceOldDate(importantDate[0], deletedData).split(
            "\n"
        );

        await extractDatesFromBody(
            submissionDate_keywords,
            convertDateInString(
                importantDate[2].split("\t").slice(0, 2).join(" ")
            ),
            submissionDate,
            50
        );

        await extractDatesFromBody(
            submissionDate_keywords,
            convertDateInString2(
                importantDate[3].split("\t").slice(0, 2).join(" ")
            ),
            submissionDate,
            50
        );

        await extractDatesFromBody(
            notificationDate_keywords,
            convertDateInString(
                importantDate[4].split("\t").slice(0, 2).join(" ")
            ),
            notificationDate,
            50
        );

        await Conference.findByIdAndUpdate(
            conference._id,
            {
                ConferenceDate: conferenceDate,
                SubmissonDate: submissionDate,
                NotificationDate: notificationDate,
                CameraReady: cameraReady,
                CallForPaper: callForPaper,
            },
            { new: true }
        );
    } catch (error) {
        console.log("Error in getDOCENGConferenceDetail: " + error);
    }
};

const getRESEARCHRConferenceDetail = async (browser, conference) => {
    try {
        console.log("getRESEARCHRConferenceDetail");
        const submissionDate = [];
        const conferenceDate = [];
        const notificationDate = [];
        const cameraReady = [];
        let callForPaper = "";

        const {
            submissionDate_keywords,
            conferenceDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords,
        } = await readKeywordsFromDict();

        await waitForRandomTime();

        const page = await browser.newPage();
        await page.goto(conference.Links[0], { waitUntil: "domcontentloaded" });
        await page.waitForSelector("#content");

        if (conference._id == "6639c1b66e0c3f3fe99c564f") {
            const findDate = dateFinder("December 4, 2023. December 7, 2023.");
            conferenceDate.push({
                date: findDate[0].date,
                keyword: "Conference start",
                update_time: new Date(),
            });

            conferenceDate.push({
                date: findDate[1].date,
                keyword: "Conference end",
                update_time: new Date(),
            });
            console.log(conferenceDate);
        } else {
            if (conference._id == "6639d68ab9c725a1d3ed3d7d") {
                let findDate = dateFinder(
                    "Sat 25 February 2023 - Wed 1 March 2023"
                );
                conferenceDate.push({
                    date: findDate[0].date,
                    keyword: "Conference start",
                    update_time: new Date(),
                });

                conferenceDate.push({
                    date: findDate[1].date,
                    keyword: "Conference end",
                    update_time: new Date(),
                });
            } else {
                let getConfDate = await page.$$eval(".place", (els) => {
                    return els[0].innerText;
                });

                if (dateFinder(getConfDate).length > 0) {
                    let findDate = dateFinder(
                        convertDateInString3(getConfDate)
                    );
                    if (findDate == "") {
                        conferenceDate.push({
                            date: dateFinder(getConfDate)[0].date,
                            keyword: "Conference start",
                            update_time: new Date(),
                        });
                    } else {
                        conferenceDate.push({
                            date: findDate[0].date,
                            keyword: "Conference start",
                            update_time: new Date(),
                        });

                        conferenceDate.push({
                            date: findDate[1].date,
                            keyword: "Conference end",
                            update_time: new Date(),
                        });
                    }
                } else {
                    getConfDate = await page.$$eval(
                        ".row.date-facets",
                        (els) => {
                            return els.map((el) => {
                                return el.innerText;
                            });
                        }
                    );

                    const findDate = dateFinder(getConfDate);

                    conferenceDate.push({
                        date: findDate[0].date,
                        keyword: "Conference start",
                        update_time: new Date(),
                    });

                    conferenceDate.push({
                        date: findDate[1].date,
                        keyword: "Conference end",
                        update_time: new Date(),
                    });
                }
            }

            const importantDate = await page.$$eval(
                ".table.table-hover.important-dates-in-sidebar",
                (els) => {
                    return els.map((el) => {
                        return el.innerText;
                    });
                }
            );

            if (importantDate.length > 0) {
                await extractDatesFromBody(
                    submissionDate_keywords,
                    importantDate[0],
                    submissionDate,
                    50
                );

                await extractDatesFromBody(
                    notificationDate_keywords,
                    importantDate[0],
                    notificationDate,
                    50
                );

                await extractDatesFromBody(
                    cameraReady_keywords,
                    importantDate[0],
                    cameraReady,
                    50
                );
            }

            let getCallForPaper = await page.$$eval(
                "#Call-for-Papers",
                (els) => {
                    return els.map((el) => {
                        return el.innerText;
                    });
                }
            );

            if (getCallForPaper.length > 0) {
                callForPaper = getCallForPaper[0].replace(
                    "Call for Papers",
                    ""
                );
            } else {
                getCallForPaper = await page.$$eval(
                    "#Call-for-Research-Papers",
                    (els) => {
                        return els.map((el) => {
                            return el.innerText;
                        });
                    }
                );
                if (getCallForPaper.length > 0) {
                    callForPaper = getCallForPaper[0];
                } else {
                    getCallForPaper = await page.$$eval(
                        "#Call-for-Papers-of-the-research-track",
                        (els) => {
                            return els.map((el) => {
                                return el.innerText;
                            });
                        }
                    );
                    if (getCallForPaper.length > 0) {
                        callForPaper = getCallForPaper[0].replace(
                            "Call for Papers of the research track",
                            ""
                        );
                    }
                }
            }
        }

        await Conference.findByIdAndUpdate(
            conference._id,
            {
                ConferenceDate: conferenceDate,
                SubmissonDate: submissionDate,
                NotificationDate: notificationDate,
                CameraReady: cameraReady,
                CallForPaper: callForPaper,
            },
            { new: true }
        );
    } catch (error) {
        console.log("Error in getRESEARCHRConferenceDetail: " + error);
    }
};

// Loại bỏ những ngày cũ, đã bị thay đổi
const replaceOldDate = (webContent, oldDate) => {
    oldDate.forEach((date) => {
        if (webContent.includes(date)) {
            webContent = webContent.split(date).join("");
        }
    });
    return webContent;
};

const normalizeText = (text) => {
    return text.replace(/\n{3,}/g, "\n");
};

module.exports = {
    isContainsAnyException,
    handleConferenceException,
};
