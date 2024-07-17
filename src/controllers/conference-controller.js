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
const { dataPineline, dataPinelineAPI } = require("../etl/datapineline");
const conferenceHasIncorrectLinks = require("../config/IncorrectLink");
const fs = require("fs");
const { parse } = require("json2csv");
const { parse: csvParse } = require("csv-parse/sync");
const { parse: json2csv } = require("json2csv");
const {
    isContainsAnyException,
    handleConferenceException,
} = require("../exceptions/conference-exception");
const { getImportantDates } = require("../rule/extractImportantDate-rule");
const { getConferenceDates } = require("../rule/extractConferenceDate-rule");
const { getLocation } = require("../rule/extractLocation-rule")
const startBrowser = require('../untils/browser');
const { stringify } = require('csv-stringify/sync');
const safeConferenceList = require('../config/safeList')
const { getType } = require('../rule/extractType-rule')
const { getCallForPaper } = require('../rule/extractCallForPaper-rule')
const { updateJobProgress } = require('../services/job-service')


// const crawlConferenceById = async (job) => {

//     let browser = await startBrowser();
//     console.log(">> Browser is opening ...")

//     try {
//         const conference = await Conference.findById(job.conf_id);

//         if (!conference) {
//             return {
//                 status: false,
//                 message: "Conference not found"
//             };
//         }

//         // Xử lý nếu conference chưa có link
//         // Cần cào thêm các thông tin khác (getLocation, getConferenceDates, getConferenceLink)

//         // Cào important dates
//         let newImportantDates;
//         if (conference.Links[0].length > 0) {
//             newImportantDates = await getImportantDates(browser, conference.Links[0]);
//         } else {
//             return {
//                 status: true,
//                 message: "Conference hasn't new update"
//             };
//         }

//         if(!newImportantDates) {
//             return {
//                 status: false,
//                 message: "Navigation timeout of 30000 ms exceeded when go to " + conference.Links[0]
//             };
//         } else {
            
//         }
//         // console.log(newImportantDates)

//         const oldImportantDates = {
//             submissionDate: conference.SubmissonDate.map(item => ({
//                 date: item.date,
//                 keyword: item.keyword,
//                 update_time: item.update_time
//             })),
//             notificationDate: conference.NotificationDate.map(item => ({
//                 date: item.date,
//                 keyword: item.keyword,
//                 update_time: item.update_time
//             })),
//             cameraReady: conference.CameraReady.map(item => ({
//                 date: item.date,
//                 keyword: item.keyword,
//                 update_time: item.update_time
//             })),
//         };

//         // console.log(oldImportantDates)

//         const updates = { SubmissonDate: [], NotificationDate: [], CameraReady: [] };

//         const compareDatesOnly = (date1, date2) => {
//             const d1 = new Date(date1).toISOString().split('T')[0];
//             const d2 = new Date(date2).toISOString().split('T')[0];
//             return d1 === d2;
//         };

//         let hasNewChange = false

//         const checkAndUpdate = (oldDates, newDates, type) => {
//             oldDates.forEach(oldItem => {
//                 const newItem = newDates.find(newItem => newItem.keyword === oldItem.keyword);
//                 if (newItem && !compareDatesOnly(oldItem.date, newItem.date)) {
//                     updates[type].push(newItem);
//                     hasNewChange = true
//                     console.log("+ " + oldItem.keyword + ": " + new Date(oldItem.date).toISOString().split('T')[0] + " change to " + new Date(newItem.date).toISOString().split('T')[0])
//                 } else {
//                     updates[type].push(oldItem)
//                 }
//             });
//         };


//         checkAndUpdate(oldImportantDates.submissionDate, newImportantDates.submissionDate, 'SubmissonDate');
//         checkAndUpdate(oldImportantDates.notificationDate, newImportantDates.notificationDate, 'NotificationDate');
//         checkAndUpdate(oldImportantDates.cameraReady, newImportantDates.cameraReady, 'CameraReady');

//         if(safeConferenceList.some(i => i == job.conf_id) && hasNewChange) {
//             await Conference.findByIdAndUpdate(job.conf_id, updates);
//         } else {
//             console.log(">> Important date not change or not in safe list")
//             return {
//                 status: true,
//                 message: "Important date not change or not in safe list"
//             };
//         }
        
//         // Pineline
//         const isPinelineSuccess = await dataPinelineAPI(job.conf_id)
//         if(isPinelineSuccess) {
//             return {
//                 status: true,
//                 message: "Update conference successfully"
//             };
//         } else {
//             return {
//                 status: false,
//                 message: "Something occurred in data pipeline"
//             }
//         }
       
//     } catch (error) {
//         console.log("Error in Conference controller/crawlConferenceById: " + error);
//         return {
//             status: false,
//             message: error
//         };
//     } finally {
//         await browser.close();
//         console.log(">> Browser is closed")
//     }
// };

// Handle job update now
const crawlConferenceById = async (job) => {

    let browser = await startBrowser();
    console.log(">> Browser is opening ...")

    try {
        const conference = await Conference.findById(job.conf_id);

        if (!conference) {
            return {
                status: false,
                message: "Conference not found"
            };
        }

        // Xử lý nếu conference chưa có link
        // Cần cào thêm các thông tin khác (getLocation, getConferenceDates, getConferenceLink)

        // Cào important dates
        await updateJobProgress(job._id, 10, "Crawling important dates")
        let newImportantDates;
        if (conference.Links[0].length > 0) {
            newImportantDates = await getImportantDates(browser, conference.Links[0]);
        } else {
            return {
                status: true,
                message: "Conference hasn't new update"
            };
        }

        if(!newImportantDates) {
            return {
                status: false,
                message: "Navigation timeout of 30000 ms exceeded when go to " + conference.Links[0]
            };
        } else {
            await updateJobProgress(job._id, 40, "Crawling important dates successfully")
        }
        console.log(newImportantDates)

        const oldImportantDates = {
            submissionDate: conference.SubmissonDate.map(item => ({
                date: item.date,
                keyword: item.keyword,
                update_time: item.update_time
            })),
            notificationDate: conference.NotificationDate.map(item => ({
                date: item.date,
                keyword: item.keyword,
                update_time: item.update_time
            })),
            cameraReady: conference.CameraReady.map(item => ({
                date: item.date,
                keyword: item.keyword,
                update_time: item.update_time
            })),
        };

        console.log(oldImportantDates)

        // So sánh và cập nhật cơ sở dữ liệu nếu có sự thay đổi
        const updates = { SubmissonDate: [], NotificationDate: [], CameraReady: [] };

        const compareDatesOnly = (date1, date2) => {
            const d1 = new Date(date1).toISOString().split('T')[0];
            const d2 = new Date(date2).toISOString().split('T')[0];
            return d1 === d2;
        };

        let hasNewChange = false

        const checkAndUpdate = (oldDates, newDates, type) => {
            oldDates.forEach(oldItem => {
                const newItem = newDates.find(newItem => newItem.keyword === oldItem.keyword);
                if (newItem && !compareDatesOnly(oldItem.date, newItem.date)) {
                    updates[type].push(newItem);
                    hasNewChange = true
                    console.log("+ " + oldItem.keyword + ": " + new Date(oldItem.date).toISOString().split('T')[0] + " change to " + new Date(newItem.date).toISOString().split('T')[0])
                } else {
                    updates[type].push(oldItem)
                }
            });
        };

        await updateJobProgress(job._id, 50, "Check for updates")

        checkAndUpdate(oldImportantDates.submissionDate, newImportantDates.submissionDate, 'SubmissonDate');
        checkAndUpdate(oldImportantDates.notificationDate, newImportantDates.notificationDate, 'NotificationDate');
        checkAndUpdate(oldImportantDates.cameraReady, newImportantDates.cameraReady, 'CameraReady');

        

        if(safeConferenceList.some(i => i == job.conf_id) && hasNewChange) {
            await Conference.findByIdAndUpdate(job.conf_id, updates);
            console.log(">> Save new update to database successfully")
            await updateJobProgress(job._id, 60, "Save new update to database successfully")
        } else {
            console.log(">> Important date not change or not in safe list")
            await updateJobProgress(job._id, 60, "Important date not change")
            // return {
            //     status: true,
            //     message: "Important date not change or not in safe list"
            // };
        }
        await updateJobProgress(job._id, 80, "ETL data to destination")
        // Pineline
        const isPinelineSuccess = await dataPinelineAPI(job.conf_id)
        if(isPinelineSuccess) {
            await updateJobProgress(job._id, 100, "ETL data to CONFHUB successfully")
            return {
                status: true,
                message: "Update conference successfully"
            };
        } else {
            return {
                status: false,
                message: "Something occurred in data pipeline"
            }
        }
       
    } catch (error) {
        console.log("Error in Conference controller/crawlConferenceById: " + error);
        return {
            status: false,
            message: error
        };
    } finally {
        await browser.close();
        console.log(">> Browser is closed")
    }
};

// Handle job import conf
const crawlNewConferenceById = async (job) => {
    let browser = await startBrowser();
    console.log(">> Browser is opening ...")

    try {
        const conference = await Conference.findById(job.conf_id);

        if (!conference) {
            return {
                status: false,
                message: "Conference not found"
            };
        }

        // Trường hợp conf đã có link
        if (conference.Links[0]?.length > 0) {
            // Cào important dates
            await updateJobProgress(job._id, 10, "Crawling important dates")
            let newImportantDates = await getImportantDates(browser, link);
            //Cào Conference Dates
            await updateJobProgress(job._id, 30, "Crawling conference dates")
            let conferenceDates = await getConferenceDates(browser, link, conference.Title);
            //Cào Location
            await updateJobProgress(job._id, 50, "Crawling location")
            let location = await getLocation(browser, link)
            //Cào Type
            await updateJobProgress(job._id, 60, "Crawling type")
            let type = await getType(browser, link);
            //Cào cfp
            await updateJobProgress(job._id, 80, "Crawling call for papers")
            let callForPaper = await getCallForPaper(browser, link, conference.Acronym);
        } 
        else {
            // Trường hợp conf chưa có link
            let links = await webScraperService.searchConferenceLinksByTitle(
                browser,
                conference,
                4
            );
            for(let link of links) {
                await updateJobProgress(job._id, 10, "Crawling important dates")
                let importantDates = await getImportantDates(browser, link);

                await updateJobProgress(job._id, 30, "Crawling conference dates")
                let conferenceDates = await getConferenceDates(browser, link, conference.Title);
                
                await updateJobProgress(job._id, 50, "Crawling location")
                let location = await getLocation(browser, link)

                await updateJobProgress(job._id, 60, "Crawling type")
                let type = await getType(browser, link);

                await updateJobProgress(job._id, 80, "Crawling call for papers")
                let callForPaper = await getCallForPaper(browser, link, conference.Acronym);
                

                if (importantDates && conferenceDates && type) {
                    const result = {
                        Links: [link],
                        ConferenceDate: [
                            {
                                date: conferenceDates.startDateISO,
                                keyword: "Conference start",
                                update_time: new Date()
                            },
                            {
                                date: conferenceDates.endDateISO,
                                keyword: "Conference end",
                                update_time: new Date()
                            }
                        ],
                        SubmissonDate: importantDates.submissionDate,
                        NotificationDate: importantDates.notificationDate,
                        CameraReady: importantDates.cameraReady,
                        CallForPaper: callForPaper,
                        Location: location,
                        Type: type
                    }
                    // console.log(result)
                    await Conference.findByIdAndUpdate(conference._id, {
                        Links: [link],
                        ConferenceDate: [
                            {
                                date: conferenceDates.startDateISO,
                                keyword: "Conference start",
                                update_time: new Date()
                            },
                            {
                                date: conferenceDates.endDateISO,
                                keyword: "Conference end",
                                update_time: new Date()
                            }
                        ],
                        SubmissonDate: importantDates.submissionDate,
                        NotificationDate: importantDates.notificationDate,
                        CameraReady: importantDates.cameraReady,
                        CallForPaper: callForPaper,
                        Location: location,
                        Type: type
                    })
                    break;
                }
            }


        }

        // Pineline
        await updateJobProgress(job._id, 80, "ETL data to destination")
        const isPinelineSuccess = await dataPinelineAPI(job.conf_id)
        if(isPinelineSuccess) {
            await updateJobProgress(job._id, 100, "ETL data to destination successfully")
            return {
                status: true,
                message: "Update conference successfully"
            };
        } else {
            return {
                status: false,
                message: "Something occurred in data pipeline"
            }
        }

        
       
    } catch (error) {
        console.log("Error in Conference controller/crawlConferenceById: " + error);
        return {
            status: false,
            message: error
        };
    } finally {
        await browser.close();
        console.log(">> Browser is closed")
    }
};



const crawlController = async (browserInstance) => {
    try {
        
        // Create browser
        // let browser = await browserInstance;
        // let list = [
        //     "6639d723b9c725a1d3ed3e0b"
        // ];
        // for(l of list) {
        //     console.log("------------------------------------------")
        //     console.log(">> " + l)
        //     const isSuccess = await crawlConferenceById({
        //         conf_id: l
        //     })
        //     console.log(isSuccess)
        // }
        await crawlNewConferenceById({
            conf_id: "6697864a60386000ce523e76"
        })
       
        //await crawlAllConferencesDetail(browser);
        // await processConferenceError(browser);


        // ETL dữ liệu vừa cào sang postgre
        // await etlDataToPostgre()

        // const importantDate = await getImportantDates(
        //     browser,"http://cisisconference.eu/")
        
        // console.log(importantDate)
        // const dateArr = [
        //     ...importantDate.submissionDate.map((item) => ({
        //         date_value: item.date,
        //         date_type: item.keyword,
        //     })),
        //     ...importantDate.notificationDate.map((item) => ({
        //         date_value: item.date,
        //         date_type: item.keyword,
        //     })),
        //     ...importantDate.cameraReady.map((item) => ({
        //         date_value: item.date,
        //         date_type: item.keyword,
        //     })),
        // ];

        // console.log(dateArr)
        // const conferenceDate = await getConferenceDates(browser,"https://ic3k.scitevents.org/")
        // const conferenceDate = await getConferenceDates(browser,"https://ic3k.scitevents.org/")

        
        // console.log(conferenceDate)

        // const title = "International Conference on Advanced Communications and Computation"
        // const link = "https://www.iaria.org/conferences2024/INFOCOMP24.html"
        // const location = await getLocation(browser, title, link)
        // console.log("Location: " + location)
        
        
        // filterInvalidConferences()

        // saveKeywordsToFile()
        
        // await dataPineline("")
        /* Cần ETL
            
            
        */

        // await saveEvaluationDataset(browser)

        // await savePageContent(browser)

        //-----------
        // Test bộ luật
        // await testTypeExtraction(browser)
        // await testConferenceDateExtraction(browser)
        // await testCallForPaper(browser)
        

    } catch (error) {
        console.log("Error in crawlController: " + error);
    }
};

const testCallForPaper = async (browser) => {
    try {
        let conferenceIds = [];

        const fileContent = fs.readFileSync("EvaluationDataset.csv", "utf8");
        const existingData = csvParse(fileContent, { columns: true });

        for (const row of existingData) {
            while(row._id.includes(`"`)) {
                row._id = row._id.replace(`"`, "");
            }
            conferenceIds.push(row._id);
        }

        let total = 0;
        let correct = 0;
        let isNull = 0;
        let isLinkEmpty = 0;

        let index = 198
        for (let i=index; i<index+1; i++) {
            const conference = await conferenceModel.findOne({ _id: conferenceIds[i] });

            console.log("---------------------------");
            console.log(">> " + i);
            console.log(">> " + conference._id);

            if (!conference.Links[0] || conference.Links[0].length == 0) {
                isLinkEmpty++;
                console.log("Hasn't link");
                continue;
            }

            const expectedCallForPaper = conference.CallForPaper;
            
            const extractedCallForPaper = await getCallForPaper(browser, conference.Links[0], conference.Acronym);
            if (extractedCallForPaper == null) {
                isNull++;
                console.log("False");
                continue;
            }

            if (expectedCallForPaper.substring(0, 200).replace("\n", " ") 
                == extractedCallForPaper.substring(0, 200).replace("\n", " ")) {
                console.log(">> Extracted Call For Paper: " + extractedCallForPaper);
                console.log("True");
                correct++;
            } else {
                console.log(">> Expected Call For Paper: " + expectedCallForPaper.substring(0, 100));
                // console.log(">> Extracted Call For Paper: " + extractedCallForPaper.substring(0, 100));
                // console.log(">> Expected Call For Paper: " + expectedCallForPaper);
                console.log(">> Extracted Call For Paper: " + extractedCallForPaper);
                console.log("False");
            }
            total++;
        }

        const accuracy = (correct / total) * 100;
        console.log(`Total extracted: ${total}`);
        console.log(`Correct Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`Null: ${isNull}`);
        console.log(`Hasn't link: ${isLinkEmpty}`);

        return accuracy;
    } catch (error) {
        console.log("Error in testCallForPaper: " + error);
    }
};

const logToFile = (message) => {
    fs.appendFileSync('log.txt', message + '\n', 'utf8');
};

const testConferenceDateExtraction = async (browser) => {
    try {
        let conferenceIds = [];

        const fileContent = fs.readFileSync("EvaluationDataset.csv", "utf8");
        const existingData = csvParse(fileContent, { columns: true });

        for (const row of existingData) {
            while(row._id.includes(`"`)) {
                row._id = row._id.replace(`"`, "")
            }
            conferenceIds.push(row._id);
        }

        let total = 0;
        let correct = 0;
        let isNull = 0;
        let isLinkEmpty = 0;

        let index = 639
        for (let i=index; i<index+1; i++) {
            const conference = await conferenceModel.findOne({ _id: conferenceIds[i] });

            console.log("---------------------------")
            console.log(">> " + i)
            console.log(">> " + conference._id)

            if (!conference.Links[0] || conference.Links[0].length == 0) {
                isLinkEmpty++;
                console.log("Hasn't link")
                continue;
            }

            const expectedStartDate = new Date(conference.ConferenceDate[0].date).toISOString();
            let expectedEndDate;
            if(conference.ConferenceDate.length == 1) {
                expectedEndDate = null
            } else {
                expectedEndDate = new Date(conference.ConferenceDate[1]?.date).toISOString();
            }
            
            const extractedDates = await getConferenceDates(browser, conference.Links[0], conference.Title);
            if (extractedDates == null) {
                isNull++;
                console.log("False");
                continue;
            }

            const extractedStartDate = extractedDates.startDateISO;
            const extractedEndDate = extractedDates.endDateISO;

            if (expectedStartDate == extractedStartDate && expectedEndDate == extractedEndDate) {
                // console.log("Extracted Start Date:", extractedStartDate);
                // console.log("Extracted End Date:", extractedEndDate);
                console.log("True");
                correct++;
            } else {
                console.log("Expected Start Date:", expectedStartDate);
                console.log("Expected End Date:", expectedEndDate);
                console.log("Extracted Start Date:", extractedStartDate);
                console.log("Extracted End Date:", extractedEndDate);
                console.log("False");
            }
            total++;
        }

        const accuracy = (correct / total) * 100;
        console.log(`Total extracted: ${total}`);
        console.log(`Correct Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`Null: ${isNull}`);
        console.log(`Hasn't link: ${isLinkEmpty}`);

        return accuracy;
    } catch (error) {
        console.log("Error in testConferenceDateExtraction: " + error);
    }
};

// const testConferenceDateExtraction = async (browser) => {
//     try {
//         let conferenceIds = [];

//         const fileContent = fs.readFileSync("EvaluationDataset.csv", "utf8");
//         const existingData = csvParse(fileContent, { columns: true });

//         for (const row of existingData) {
//             while(row._id.includes(`"`)) {
//                 row._id = row._id.replace(`"`, "");
//             }
//             conferenceIds.push(row._id);
//         }

//         let total = 0;
//         let correct = 0;
//         let isNull = 0;
//         let isLinkEmpty = 0;

//         let index = 515;
//         for (let i=index; i<index+1; i++) {
//             const conference = await conferenceModel.findOne({ _id: conferenceIds[i] });
//             console.log(i)
//             logToFile("---------------------------");
//             logToFile(">> " + i);
//             logToFile(">> " + conference._id);

//             if (!conference.Links[0] || conference.Links[0].length == 0) {
//                 isLinkEmpty++;
//                 logToFile("Hasn't link");
//                 continue;
//             }

//             const expectedStartDate = new Date(conference.ConferenceDate[0].date).toISOString();
//             let expectedEndDate;
//             if(conference.ConferenceDate.length == 1) {
//                 expectedEndDate = null;
//             } else {
//                 expectedEndDate = new Date(conference.ConferenceDate[1]?.date).toISOString();
//             }

//             const extractedDates = await getConferenceDates(browser, conference.Links[0], conference.Title);
//             if (extractedDates == null) {
//                 isNull++;
//                 logToFile("False");
//                 continue;
//             }

//             const extractedStartDate = extractedDates.startDateISO;
//             const extractedEndDate = extractedDates.endDateISO;

//             if (expectedStartDate == extractedStartDate && expectedEndDate == extractedEndDate) {
//                 logToFile("True");
//                 correct++;
//             } else {
//                 logToFile("Expected Start Date: " + expectedStartDate);
//                 logToFile("Expected End Date: " + expectedEndDate);
//                 logToFile("Extracted Start Date: " + extractedStartDate);
//                 logToFile("Extracted End Date: " + extractedEndDate);
//                 logToFile("False");
//             }
//             total++;
//         }

//         const accuracy = (correct / total) * 100;
//         logToFile(`Total extracted: ${total}`);
//         logToFile(`Correct Accuracy: ${accuracy.toFixed(2)}%`);
//         logToFile(`Null: ${isNull}`);
//         logToFile(`Hasn't link: ${isLinkEmpty}`);

//         return accuracy;
//     } catch (error) {
//         logToFile("Error in testConferenceDateExtraction: " + error);
//     }
// };

const testTypeExtraction = async (browser) => {
    try {
        let conferenceIds = [];

        const fileContent = fs.readFileSync("EvaluationDataset.csv", "utf8");
        const existingData = csvParse(fileContent, { columns: true });

        for (const row of existingData) {
            while(row._id.includes(`"`)) {
                row._id = row._id.replace(`"`, "")
            }
            conferenceIds.push(row._id);
        }

        let total = 0;
        let correct = 0;
        let isNull = 0;
        let isLinkEmpty = 0;
        //
        for (let i=750; i < 778; i++) {
            const conference = await Conference.findOne({ _id: conferenceIds[i] });
            const expectedType = conference.Type;
            console.log("---------------------------")
            console.log(">> " + i)
            console.log(">> " + conference._id)
            if(!conference.Links[0] || conference.Links[0].length == 0) {
                isLinkEmpty ++;
                continue;
            }
            const extractedType = await getType(browser, conference.Links[0]);
            if (extractedType == null) {
                isNull++;
                continue;
            }
            if (expectedType.toLowerCase() == extractedType.toLowerCase()) {
                console.log("True")
                correct++;
            }
            else {
                console.log(conference._id)
                console.log(extractedType.toLowerCase())
                console.log("False")
            }
            total++;
        }

        const accuracy = (correct / total) * 100;
        console.log(`Total extracted: ${total}`);
        console.log(`Correct Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`Null: ${isNull}`)
        console.log(`Hasn't link: ${isLinkEmpty}`)

        return accuracy;
    } catch (error) {
        console.log("Error in testLocationExtraction: " + error);
    }
};

const compareLocations = (expected, actual) => {
    if(!expected || !actual) return false
    return expected.toLowerCase() === actual.toLowerCase();
};

const testLocationExtraction = async (browser) => {
    try {
        let conferenceIds = [];

        const fileContent = fs.readFileSync("EvaluationDataset.csv", "utf8");
        const existingData = csvParse(fileContent, { columns: true });

        for (const row of existingData) {
            while(row._id.includes(`"`)) {
                row._id = row._id.replace(`"`, "")
            }
            conferenceIds.push(row._id);
        }

        let total = 0;
        let correct = 0;
        let isNull = 0;

        for (let i =2; i < 3; i++) {
            const conference = await Conference.findOne({ _id: conferenceIds[i] });
            const expectedLocation = conference.Location;
            const extractedLocation = await getLocation(browser, conference.Title, conference.Links[0]);
            if (extractedLocation == null) {
                isNull++;
                continue;
            }
            if (compareLocations(expectedLocation, extractedLocation)) {
                console.log("True")
                correct++;
            }
            total++;
        }

        const accuracy = (correct / total) * 100;
        console.log(`Total extracted: ${total}`);
        console.log(`Correct Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`Null: ${isNull}`)

        return accuracy;
    } catch (error) {
        console.log("Error in testLocationExtraction: " + error);
    }
};


const saveEvaluationDataset = async (browser) => {
    let conferenceIds = [];

    const fileContent = fs.readFileSync("LastHope.csv", "utf8");
    const existingData = csvParse(fileContent, { columns: true });

    for (const row of existingData) {
        conferenceIds.push(row.conference_id);
    }

    const results = [];

    for (let i=500; i<700; i++) {
        console.log(i)
        const conference = await Conference.findOne({ _id: conferenceIds[i] });

        if (!conference) continue;

        if (conference.Rank !== 'A' &&
            conference.Rank !== 'A*' &&
            conference.Rank !== 'B' &&
            conference.Rank !== 'C'
        ) continue;

        const links = await webScraperService.searchConferenceLinksByTitle(browser, conference, 4);
        const selectedLink = conference.Links.length > 0 ? conference.Links[0] : ""; // Link máy chọn là selectedLink trong database

        let isTrue = ""
        if (links[0].split("://")[1].includes(selectedLink.split("://")[1])) {
            isTrue = "link1"
        } else if (links[1].split("://")[1].includes(selectedLink.split("://")[1])) {
            isTrue = "link2"
        } else if (links[2].split("://")[1].includes(selectedLink.split("://")[1])) {
            isTrue = "link3"
        } else if (links[3].split("://")[1].includes(selectedLink.split("://")[1])) {
            isTrue = "link4"
        }

        const result = {
            _id: conference._id,
            title: conference.Title,
            link1: links[0] || '',
            link2: links[1] || '',
            link3: links[2] || '',
            link4: links[3] || '',
            selectedLink: selectedLink || '',
            isTrue: isTrue,
        };

        results.push(result);
    }

    const csvOutput = stringify(results, { header: !fs.existsSync('EvaluationDataset_ByTitleAndAcronymAndYear.csv') });
    fs.writeFileSync('EvaluationDataset_ByTitleAndAcronymAndYear.csv', csvOutput, { flag: 'a' });
    console.log("Successfully")
}

const saveKeywordsToFile = async () => {
    try {
        const conferences = await Conference.find();

        let submissionDateKeywords = new Set();
        let notificationDateKeywords = new Set();
        let cameraReadyKeywords = new Set();

        conferences.forEach(conference => {
            conference.SubmissonDate.forEach(item => {
                submissionDateKeywords.add(item.keyword);
            });
            conference.NotificationDate.forEach(item => {
                notificationDateKeywords.add(item.keyword);
            });
            conference.CameraReady.forEach(item => {
                cameraReadyKeywords.add(item.keyword);
            });
        });

        // Convert sets to arrays and join them into strings
        submissionDateKeywords = Array.from(submissionDateKeywords).join('\n');
        notificationDateKeywords = Array.from(notificationDateKeywords).join('\n');
        cameraReadyKeywords = Array.from(cameraReadyKeywords).join('\n');

        // Write the keywords to files
        fs.writeFileSync('./submission_date_keywords.txt', submissionDateKeywords);
        fs.writeFileSync('./notification_date_keywords.txt', notificationDateKeywords);
        fs.writeFileSync('./camera_ready_keywords.txt', cameraReadyKeywords);

        console.log('Keywords saved to files successfully.');
    } catch (error) {
        console.error('Error saving keywords to files: ', error);
    }
};

const isKeywordInvalid = (keyword) => {
    if (!keyword) return false;  // Kiểm tra keyword không phải là undefined hoặc null
    const hasColon = keyword.includes(':');
    const hasInvalidDash = keyword.includes('-') && !keyword.includes(' - ');
    
    /*
    Paper Submission Deadline *
    Deadline
    Deadlines for submissions - Papers (full and short)
    Notification to authors - Paper
    2nd Round: Abstract Submission
    Notification of
    Poster submission deadline
    Notification of poster acceptance
    */

    return keyword == "Submission deadline (extended)"
    return hasColon || hasInvalidDash;
};

const filterInvalidConferences = async () => {
    try {
        const conferences = await Conference.find();
        console.log("Find in: " + conferences.length)
        let invalidConferenceIds = [];

        conferences.forEach(conference => {
            let hasInvalidKeyword = false;
            // if( 
                
            //    conference.CallForPaper?.includes("pdf")
            // ) {
            //     hasInvalidKeyword = true;
            // }

            conference.ConferenceDate.forEach(item => {
                if (new Date((item.date)).getUTCFullYear() == 2024
                && (
                    conference.Rank == "A*" ||
                    conference.Rank == "A" ||
                    conference.Rank == "B" ||
                    conference.Rank == "C" 
                )) {
                    hasInvalidKeyword = true;
                }
            });

            // conference.SubmissonDate.forEach(item => {
            //     if (new Date((item.date)).getUTCMonth() == 6 && new Date((item.date)).getUTCFullYear() == 2024) {
            //         hasInvalidKeyword = true;
            //     }
            // });
            // conference.NotificationDate.forEach(item => {
            //     if (new Date((item.date)).getUTCMonth() == 6) {
            //         console.log(new Date((item.date)).getUTCMonth())
            //         hasInvalidKeyword = true;
            //     }
            // });
            // conference.CameraReady.forEach(item => {
            //     if (new Date((item.date)).getUTCMonth() == 6) {
            //         console.log(new Date((item.date)).getUTCMonth())
            //         hasInvalidKeyword = true;
            //     }
            // });
            

            // conference.SubmissonDate.forEach(item => {
            //     if (isKeywordInvalid(item.keyword)) {
            //         hasInvalidKeyword = true;
            //     }
            // });
            // conference.NotificationDate.forEach(item => {
            //     if (isKeywordInvalid(item.keyword)) {
            //         hasInvalidKeyword = true;
            //     }
            // });
            // conference.CameraReady.forEach(item => {
            //     if (isKeywordInvalid(item.keyword)) {
            //         hasInvalidKeyword = true;
            //     }
            // });

            if (hasInvalidKeyword) {
                invalidConferenceIds.push(conference._id.toString());
            }
        });

        // Write invalid conference IDs to a file
        fs.writeFileSync('./invalid_conference_ids.txt', invalidConferenceIds.join('\n'));

        console.log('Invalid conference IDs saved to file successfully.');
    } catch (error) {
        console.error('Error saving invalid conference IDs to file: ', error);
    }
};

const compareArrays = (arr1, arr2) => {
    if (arr1.length !== arr2.length) {
        return false;
    }

    const sortedArr1 = arr1.sort((a, b) => a.date.localeCompare(b.date));
    const sortedArr2 = arr2.sort((a, b) => a.date.localeCompare(b.date));

    for (let i = 0; i < sortedArr1.length; i++) {
        const obj1 = sortedArr1[i];
        const obj2 = sortedArr2[i];

        if (
            obj1.date !== obj2.date ||
            obj1.keyword !== obj2.keyword
        ) {
            return false;
        }
    }

    return true;
};

const savePageContent = async (browser) => {
    const filePath = "EvaluationDataset.csv";
    const fileContent = fs.readFileSync(filePath, "utf8");
    const existingData = csvParse(fileContent, { columns: true });

    // Filter rows where machine equals human
    const filteredData = existingData.filter(
        (row) => row
    );

    for (let i = 765; i < 778; i++) {
        console.log(i);
        const currentConference = await Conference.findOne({
            _id: filteredData[i]._id.slice(1,-1),
        });

        const dirPath = `./dataset/${i}_${currentConference.Acronym}`;
        // Ensure the directory exists
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // link 1
        let page = await browser.newPage();
        await page.goto(filteredData[i].link1, {
            waitUntil: "domcontentloaded",
        });
        let bodyContent = await page.content();
        let fileSavePath = `${dirPath}/${currentConference.Acronym}_link1.html`;

        fs.writeFile(fileSavePath, bodyContent, (err) => {
            if (err) {
                console.error("Error writing file:", err);
            } else {
                console.log("File saved successfully!");
            }
        });
        await page.close();

        // link 2
        page = await browser.newPage();
        await page.goto(filteredData[i].link2, {
            waitUntil: "domcontentloaded",
        });
        bodyContent = await page.content();
        fileSavePath = `${dirPath}/${currentConference.Acronym}_link2.html`;

        fs.writeFile(fileSavePath, bodyContent, (err) => {
            if (err) {
                console.error("Error writing file:", err);
            } else {
                console.log("File saved successfully!");
            }
        });
        await page.close();

        // link 3
        page = await browser.newPage();
        await page.goto(filteredData[i].link3, {
            waitUntil: "domcontentloaded",
        });
        bodyContent = await page.content();
        fileSavePath = `${dirPath}/${currentConference.Acronym}_link3.html`;

        fs.writeFile(fileSavePath, bodyContent, (err) => {
            if (err) {
                console.error("Error writing file:", err);
            } else {
                console.log("File saved successfully!");
            }
        });
        await page.close();

        // link 4
        page = await browser.newPage();
        await page.goto(filteredData[i].link4, {
            waitUntil: "domcontentloaded",
        });
        bodyContent = await page.content();
        fileSavePath = `${dirPath}/${currentConference.Acronym}_link4.html`;

        fs.writeFile(fileSavePath, bodyContent, (err) => {
            if (err) {
                console.error("Error writing file:", err);
            } else {
                console.log("File saved successfully!");
            }
        });
        await page.close();
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
    return await Conference.find({
        updatedAt: { $lt: lastUpdateTime },
        _id: { $nin: errorConferences },
    })
        .sort({ updatedAt: 1 })
        .limit(100);
    let result = [];
    for (let i = 0; i < conferenceHasIncorrectLinks.length; i++) {
        const currentConference = await Conference.findById(
            conferenceHasIncorrectLinks[i]
        );
        result.push(currentConference);
    }
    return result;
};

const updateLastUpdateTime = async (lastUpdateTimeDoc) => {
    lastUpdateTimeDoc.lastUpdateTime = Date.now();
    await lastUpdateTimeDoc.save();
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processConference = async (browser, conference) => {
    console.log(conference._id);

    let isCrawlSuccess = false;

    if (
        conference.Links.length === 1 &&
        isContainsAnyException(conference.Links[0])
    ) {
        isCrawlSuccess = await handleConferenceException(
            browser,
            conference._id
        );
    } else {
        let fullInformationPoint = conference.Links.length > 1 ? 3 : 2;
        isCrawlSuccess = await webScraperService.getConferenceDetails(
            browser,
            conference,
            fullInformationPoint
        );
    }
    isCrawlSuccess = true;

    await webScraperService.getLocation(browser, conference)
    // const isGetConferenceDate = await webScraperService.getConferenceDate(browser, conference)
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
        let i = 0;
        for (const conference of allConferences) {
            try {
                await processConference(browser, conference);
                console.log(i);
                i++;
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
    crawlConferenceById,
    crawlNewConferenceById
};
