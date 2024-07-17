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
const { getLocation, isInDict } = require("../rule/extractLocation-rule");
const startBrowser = require("../untils/browser");
const { stringify } = require("csv-stringify/sync");
const safeConferenceList = require("../config/safeList");
const { getType } = require("../rule/extractType-rule");
const { updateJobProgress } = require("../services/job-service");

// Handle job update now
const crawlConferenceById = async (job) => {
  let browser = await startBrowser();
  console.log(">> Browser is opening ...");

  try {
    const conference = await Conference.findById(job.conf_id);

    if (!conference) {
      return {
        status: false,
        message: "Conference not found",
      };
    }

    // Xử lý nếu conference chưa có link
    // Cần cào thêm các thông tin khác (getLocation, getConferenceDates, getConferenceLink)

    // Cào important dates
    await updateJobProgress(job._id, 10, "Crawling important dates");
    let newImportantDates;
    if (conference.Links[0].length > 0) {
      newImportantDates = await getImportantDates(browser, conference.Links[0]);
    } else {
      return {
        status: true,
        message: "Conference hasn't new update",
      };
    }

    if (!newImportantDates) {
      return {
        status: false,
        message:
          "Navigation timeout of 30000 ms exceeded when go to " +
          conference.Links[0],
      };
    } else {
      await updateJobProgress(
        job._id,
        40,
        "Crawling important dates successfully"
      );
    }
    console.log(newImportantDates);

    const oldImportantDates = {
      submissionDate: conference.SubmissonDate.map((item) => ({
        date: item.date,
        keyword: item.keyword,
        update_time: item.update_time,
      })),
      notificationDate: conference.NotificationDate.map((item) => ({
        date: item.date,
        keyword: item.keyword,
        update_time: item.update_time,
      })),
      cameraReady: conference.CameraReady.map((item) => ({
        date: item.date,
        keyword: item.keyword,
        update_time: item.update_time,
      })),
    };

    console.log(oldImportantDates);

    // So sánh và cập nhật cơ sở dữ liệu nếu có sự thay đổi
    const updates = {
      SubmissonDate: [],
      NotificationDate: [],
      CameraReady: [],
    };

    const compareDatesOnly = (date1, date2) => {
      const d1 = new Date(date1).toISOString().split("T")[0];
      const d2 = new Date(date2).toISOString().split("T")[0];
      return d1 === d2;
    };

    let hasNewChange = false;

    const checkAndUpdate = (oldDates, newDates, type) => {
      oldDates.forEach((oldItem) => {
        const newItem = newDates.find(
          (newItem) => newItem.keyword === oldItem.keyword
        );
        if (newItem && !compareDatesOnly(oldItem.date, newItem.date)) {
          updates[type].push(newItem);
          hasNewChange = true;
          console.log(
            "+ " +
              oldItem.keyword +
              ": " +
              new Date(oldItem.date).toISOString().split("T")[0] +
              " change to " +
              new Date(newItem.date).toISOString().split("T")[0]
          );
        } else {
          updates[type].push(oldItem);
        }
      });
    };

    await updateJobProgress(job._id, 50, "Check for updates");

    checkAndUpdate(
      oldImportantDates.submissionDate,
      newImportantDates.submissionDate,
      "SubmissonDate"
    );
    checkAndUpdate(
      oldImportantDates.notificationDate,
      newImportantDates.notificationDate,
      "NotificationDate"
    );
    checkAndUpdate(
      oldImportantDates.cameraReady,
      newImportantDates.cameraReady,
      "CameraReady"
    );

    if (safeConferenceList.some((i) => i == job.conf_id) && hasNewChange) {
      await Conference.findByIdAndUpdate(job.conf_id, updates);
      console.log(">> Save new update to database successfully");
      await updateJobProgress(
        job._id,
        60,
        "Save new update to database successfully"
      );
    } else {
      console.log(">> Important date not change or not in safe list");
      await updateJobProgress(job._id, 60, "Important date not change");
      // return {
      //     status: true,
      //     message: "Important date not change or not in safe list"
      // };
    }
    await updateJobProgress(job._id, 70, "ETL data to destination");
    // Pineline
    const isPinelineSuccess = await dataPinelineAPI(job.conf_id);
    if (isPinelineSuccess) {
      await updateJobProgress(job._id, 90, "ETL data to CONFHUB successfully");
      return {
        status: true,
        message: "Update conference successfully",
      };
    } else {
      return {
        status: false,
        message: "Something occurred in data pipeline",
      };
    }
  } catch (error) {
    console.log("Error in Conference controller/crawlConferenceById: " + error);
    return {
      status: false,
      message: error,
    };
  } finally {
    await browser.close();
    console.log(">> Browser is closed");
  }
};

// Handle job import conf
const crawlNewConferenceById = async (job) => {
  let browser = await startBrowser();
  console.log(">> Browser is opening ...");

  try {
    const conference = await Conference.findById(job.conf_id);

    if (!conference) {
      return {
        status: false,
        message: "Conference not found",
      };
    }

    // Trường hợp conf đã có link
    if (conference.Links[0].length > 0) {
      // Cào important dates
      await updateJobProgress(job._id, 10, "Crawling important dates");
      setTimeout(() => {}, 4000);
      //Cào Conference Dates
      await updateJobProgress(job._id, 30, "Crawling conference dates");
      setTimeout(() => {}, 2000);
      //Cào Location
      await updateJobProgress(job._id, 50, "Crawling location");
      setTimeout(() => {}, 2000);
      //Cào Type
      await updateJobProgress(job._id, 60, "Crawling type");
      setTimeout(() => {}, 2000);
      //Cào cfp
      await updateJobProgress(job._id, 80, "Crawling call for papers");
      setTimeout(() => {}, 2000);

      // Update to database
    } else {
      // Trường hợp conf chưa có link
      let links = await webScraperService.searchConferenceLinksByTitle(
        browser,
        conference,
        4
      );
      for (let link of links) {
        let importantDate = await getImportantDates(browser, link);
      }

      // Update to database
    }

    // Pineline
    await updateJobProgress(job._id, 80, "ETL data to destination");
    const isPinelineSuccess = await dataPinelineAPI(job.conf_id);
    if (isPinelineSuccess) {
      await updateJobProgress(
        job._id,
        90,
        "ETL data to destination successfully"
      );
      return {
        status: true,
        message: "Update conference successfully",
      };
    } else {
      return {
        status: false,
        message: "Something occurred in data pipeline",
      };
    }
  } catch (error) {
    console.log("Error in Conference controller/crawlConferenceById: " + error);
    return {
      status: false,
      message: error,
    };
  } finally {
    await browser.close();
    console.log(">> Browser is closed");
  }
};

const crawlController = async (browserInstance) => {
  try {
    // Create browser
    let browser = await browserInstance;

    // const isSuccess = await crawlConferenceById("6639c523078f0b3454c91c0e")
    // console.log(isSuccess)
    // await crawlAllConferencesDetail(browser);
    // await processConferenceError(browser);

    // await lastHope();
    // await getCallForPaper(browser);

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

    // await dataPineline("6639c4bc078f0b3454c91bb4")
    // /*
    //     6639cee1c521b3f2ad611493

    //     */

    // await saveEvaluationDataset(browser)

    // await savePageContent(browser)

    //-----------
    // Test bộ luật
    await testLocationExtraction(browser);
    // await getConferenceDates(browser, "https://mswimconf.com/2023/")
  } catch (error) {
    console.log("Error in crawlController: " + error);
  }
};

// const testTypeExtraction = async (browser) => {
//     try {
//         const conferences = await conferenceModel.find({
//             Rank: { $in: ["A", "B", "C", "A*"] }
//         });

//         let total = 0;
//         let correct = 0;
//         let isNull = 0;
//         //
//         for (let i=0; i < 150; i++) {
//             const expectedType = conferences[i].Type;
//             console.log("---------------------------")
//             console.log(">> " + i)
//             console.log(">> " + conferences[i]._id)
//             const extractedType = await getType(browser, conferences[i].Links[0]);
//             if (extractedType == null) {
//                 isNull++;
//                 continue;
//             }
//             if (expectedType.toLowerCase() == extractedType.toLowerCase()) {
//                 console.log("True")
//                 correct++;
//             }
//             else {
//                 console.log(conferences[i]._id)
//                 console.log(extractedType.toLowerCase())
//             }
//             total++;
//         }

//         const accuracy = (correct / total) * 100;
//         console.log(`Total extracted: ${total}`);
//         console.log(`Correct Accuracy: ${accuracy.toFixed(2)}%`);
//         console.log(`Null: ${isNull}`)

//         return accuracy;
//     } catch (error) {
//         console.log("Error in testLocationExtraction: " + error);
//     }
// };

const compareLocations = (expected, actual) => {
  if (!expected || !actual) return false;
  return expected.toLowerCase() === actual.toLowerCase();
};

const testLocationExtraction = async (browser) => {
  try {
    const conferences = await conferenceModel.find({
      Rank: { $in: ["A", "B", "C", "A*"] },
    });

    let total = 0;
    let correct = 0;
    let isNull = 0;

    for (let i = 450; i < 480; i++) {
      console.log(i + " - " + conferences[i]._id);
      const expectedLocation = conferences[i].Location;
      let extractedLocation = "";

      //remove null confs
      if (
        conferences[i].Links[0] === "" ||
        typeof conferences[i].Links[0] === "undefined"
      ) {
        continue;
      }

      if (
        conferences[i].Links[0].includes("sigplan") ||
        conferences[i].Links[0].includes("researchr")
      ) {
        extractedLocation = await getLocation(
          browser,
          conferences[i].Links[0],
          true
        );
      } else {
        extractedLocation = await getLocation(
          browser,
          conferences[i].Links[0],
          false
        );
      }

      if (extractedLocation === "null") {
        isNull++;
        continue;
      }
      //crawl in default link
      if (compareLocations(expectedLocation, extractedLocation)) {
        console.log("True");
        correct++;
      } else {
        //crawl in home link
        let homeLink = trimUrl(conferences[i].Links[0]);

        if (homeLink !== conferences[i].Links[0]) {
          const newExtractedLocation = await getLocation(
            browser,
            homeLink,
            false
          );
          if (compareLocations(expectedLocation, newExtractedLocation)) {
            console.log("True");
            correct++;
          }
        }

        const result = await isInDict(browser, conferences[i].Links[0]);
        if (result[0]) {
          console.log("extracted location: " + result[1]);
          console.log("True");
          correct++;
        } else {
          console.log("crawl error: " + conferences[i]._id);
          console.log("expected location: " + expectedLocation);
        }
      }
      total++;
    }

    const accuracy = (correct / total) * 100;
    console.log(`\nTotal extracted: ${total}`);
    console.log(`Correct Accuracy: ${accuracy.toFixed(2)}%`);
    console.log(`Null: ${isNull}`);

    return accuracy;
  } catch (error) {
    console.log("Error in testLocationExtraction: " + error);
  }
};

function trimUrl(url) {
  // Define the year pattern and the domain pattern
  const yearPattern = /(202[3-4]|[23][3-4])/;
  const domainPattern = /(https?:\/\/[^\/]+)/;

  // Find the domain part of the URL first
  const domainMatch = url.match(domainPattern);
  if (domainMatch) {
    const domain = domainMatch[0];
    // Now check if there is a year pattern in the rest of the URL
    const restOfUrl = url.slice(domain.length);
    const yearMatch = restOfUrl.match(yearPattern);
    if (yearMatch) {
      const yearIndex = restOfUrl.indexOf(yearMatch[0]);
      return domain + restOfUrl.slice(0, yearIndex + yearMatch[0].length);
    }
    return domain;
  }

  // If no patterns matched, return the original URL
  return url;
}

// const saveEvaluationDataset = async (browser) => {
//   let conferenceIds = [];

//   const fileContent = fs.readFileSync("LastHope.csv", "utf8");
//   const existingData = csvParse(fileContent, { columns: true });

//   for (const row of existingData) {
//     conferenceIds.push(row.conference_id);
//   }

//   const results = [];

//   for (let i = 500; i < 700; i++) {
//     console.log(i);
//     const conference = await Conference.findOne({ _id: conferenceIds[i] });

//     if (!conference) continue;

//     if (
//       conference.Rank !== "A" &&
//       conference.Rank !== "A*" &&
//       conference.Rank !== "B" &&
//       conference.Rank !== "C"
//     )
//       continue;

//     const links = await webScraperService.searchConferenceLinksByTitle(
//       browser,
//       conference,
//       4
//     );
//     const selectedLink = conference.Links.length > 0 ? conference.Links[0] : ""; // Link máy chọn là selectedLink trong database

//     let isTrue = "";
//     if (links[0].split("://")[1].includes(selectedLink.split("://")[1])) {
//       isTrue = "link1";
//     } else if (
//       links[1].split("://")[1].includes(selectedLink.split("://")[1])
//     ) {
//       isTrue = "link2";
//     } else if (
//       links[2].split("://")[1].includes(selectedLink.split("://")[1])
//     ) {
//       isTrue = "link3";
//     } else if (
//       links[3].split("://")[1].includes(selectedLink.split("://")[1])
//     ) {
//       isTrue = "link4";
//     }

//     const result = {
//       _id: conference._id,
//       title: conference.Title,
//       link1: links[0] || "",
//       link2: links[1] || "",
//       link3: links[2] || "",
//       link4: links[3] || "",
//       selectedLink: selectedLink || "",
//       isTrue: isTrue,
//     };

//     results.push(result);
//   }

//   const csvOutput = stringify(results, {
//     header: !fs.existsSync("EvaluationDataset_ByTitleAndAcronymAndYear.csv"),
//   });
//   fs.writeFileSync(
//     "EvaluationDataset_ByTitleAndAcronymAndYear.csv",
//     csvOutput,
//     { flag: "a" }
//   );
//   console.log("Successfully");
// };

// const saveKeywordsToFile = async () => {
//   try {
//     const conferences = await Conference.find();

//     let submissionDateKeywords = new Set();
//     let notificationDateKeywords = new Set();
//     let cameraReadyKeywords = new Set();

//     conferences.forEach((conference) => {
//       conference.SubmissonDate.forEach((item) => {
//         submissionDateKeywords.add(item.keyword);
//       });
//       conference.NotificationDate.forEach((item) => {
//         notificationDateKeywords.add(item.keyword);
//       });
//       conference.CameraReady.forEach((item) => {
//         cameraReadyKeywords.add(item.keyword);
//       });
//     });

//     // Convert sets to arrays and join them into strings
//     submissionDateKeywords = Array.from(submissionDateKeywords).join("\n");
//     notificationDateKeywords = Array.from(notificationDateKeywords).join("\n");
//     cameraReadyKeywords = Array.from(cameraReadyKeywords).join("\n");

//     // Write the keywords to files
//     fs.writeFileSync("./submission_date_keywords.txt", submissionDateKeywords);
//     fs.writeFileSync(
//       "./notification_date_keywords.txt",
//       notificationDateKeywords
//     );
//     fs.writeFileSync("./camera_ready_keywords.txt", cameraReadyKeywords);

//     console.log("Keywords saved to files successfully.");
//   } catch (error) {
//     console.error("Error saving keywords to files: ", error);
//   }
// };

// const isKeywordInvalid = (keyword) => {
//   if (!keyword) return false; // Kiểm tra keyword không phải là undefined hoặc null
//   const hasColon = keyword.includes(":");
//   const hasInvalidDash = keyword.includes("-") && !keyword.includes(" - ");

//   /*
//     Paper Submission Deadline *
//     Deadline
//     Deadlines for submissions - Papers (full and short)
//     Notification to authors - Paper
//     2nd Round: Abstract Submission
//     Notification of
//     Poster submission deadline
//     Notification of poster acceptance
//     */

//   return keyword == "Submission deadline (extended)";
//   return hasColon || hasInvalidDash;
// };

// const filterInvalidConferences = async () => {
//   try {
//     const conferences = await Conference.find();
//     console.log("Find in: " + conferences.length);
//     let invalidConferenceIds = [];

//     conferences.forEach((conference) => {
//       let hasInvalidKeyword = false;
//       // if(

//       //    conference.CallForPaper?.includes("pdf")
//       // ) {
//       //     hasInvalidKeyword = true;
//       // }

//       conference.ConferenceDate.forEach((item) => {
//         if (
//           new Date(item.date).getUTCFullYear() == 2024 &&
//           (conference.Rank == "A*" ||
//             conference.Rank == "A" ||
//             conference.Rank == "B" ||
//             conference.Rank == "C")
//         ) {
//           hasInvalidKeyword = true;
//         }
//       });

//       // conference.SubmissonDate.forEach(item => {
//       //     if (new Date((item.date)).getUTCMonth() == 6 && new Date((item.date)).getUTCFullYear() == 2024) {
//       //         hasInvalidKeyword = true;
//       //     }
//       // });
//       // conference.NotificationDate.forEach(item => {
//       //     if (new Date((item.date)).getUTCMonth() == 6) {
//       //         console.log(new Date((item.date)).getUTCMonth())
//       //         hasInvalidKeyword = true;
//       //     }
//       // });
//       // conference.CameraReady.forEach(item => {
//       //     if (new Date((item.date)).getUTCMonth() == 6) {
//       //         console.log(new Date((item.date)).getUTCMonth())
//       //         hasInvalidKeyword = true;
//       //     }
//       // });

//       // conference.SubmissonDate.forEach(item => {
//       //     if (isKeywordInvalid(item.keyword)) {
//       //         hasInvalidKeyword = true;
//       //     }
//       // });
//       // conference.NotificationDate.forEach(item => {
//       //     if (isKeywordInvalid(item.keyword)) {
//       //         hasInvalidKeyword = true;
//       //     }
//       // });
//       // conference.CameraReady.forEach(item => {
//       //     if (isKeywordInvalid(item.keyword)) {
//       //         hasInvalidKeyword = true;
//       //     }
//       // });

//       if (hasInvalidKeyword) {
//         invalidConferenceIds.push(conference._id.toString());
//       }
//     });

//     // Write invalid conference IDs to a file
//     fs.writeFileSync(
//       "./invalid_conference_ids.txt",
//       invalidConferenceIds.join("\n")
//     );

//     console.log("Invalid conference IDs saved to file successfully.");
//   } catch (error) {
//     console.error("Error saving invalid conference IDs to file: ", error);
//   }
// };

// const compareArrays = (arr1, arr2) => {
//   if (arr1.length !== arr2.length) {
//     return false;
//   }

//   const sortedArr1 = arr1.sort((a, b) => a.date.localeCompare(b.date));
//   const sortedArr2 = arr2.sort((a, b) => a.date.localeCompare(b.date));

//   for (let i = 0; i < sortedArr1.length; i++) {
//     const obj1 = sortedArr1[i];
//     const obj2 = sortedArr2[i];

//     if (obj1.date !== obj2.date || obj1.keyword !== obj2.keyword) {
//       return false;
//     }
//   }

//   return true;
// };

// const etlDataToPostgre = async () => {
//   let conferenceIds = [];

//   const fileContent = fs.readFileSync("LastHope.csv", "utf8");
//   const existingData = csvParse(fileContent, { columns: true });

//   for (const row of existingData) {
//     conferenceIds.push(row.conference_id);
//   }
//   console.log(conferenceIds.length);
//   for (let i = 0; i < 200; i++) {
//     console.log(i);
//     await dataPineline(conferenceIds[i]);

//     setTimeout(() => {}, 1000);
//   }
//   console.log("okeeeeee");

//   // await dataPineline(conferenceIds[966]);
// };

// const getConferenceType = async (browser) => {
//   const allConferences = await Conference.find({});

//   console.log(allConferences.length);
//   for (let i = 0; i < 100; i++) {
//     console.log(allConferences[i]._id + " " + i);
//     let confType = await webScraperService.getConferenceType(
//       browser,
//       allConferences[i]
//     );
//     if (confType !== "") {
//       await Conference.findByIdAndUpdate(allConferences[i]._id, {
//         Type: confType,
//       });
//       console.log("Update conference type successfully");
//       await dataPineline(allConferences[i]._id);
//     }
//   }
// };

// const savePageContent = async (browser) => {
//   const filePath = "EvaluationDataset.csv";
//   const fileContent = fs.readFileSync(filePath, "utf8");
//   const existingData = csvParse(fileContent, { columns: true });

//   // Filter rows where machine equals human
//   const filteredData = existingData.filter((row) => row);

//   for (let i = 765; i < 778; i++) {
//     console.log(i);
//     const currentConference = await Conference.findOne({
//       _id: filteredData[i]._id.slice(1, -1),
//     });

//     const dirPath = `./dataset/${i}_${currentConference.Acronym}`;
//     // Ensure the directory exists
//     if (!fs.existsSync(dirPath)) {
//       fs.mkdirSync(dirPath, { recursive: true });
//     }

//     // link 1
//     let page = await browser.newPage();
//     await page.goto(filteredData[i].link1, {
//       waitUntil: "domcontentloaded",
//     });
//     let bodyContent = await page.content();
//     let fileSavePath = `${dirPath}/${currentConference.Acronym}_link1.html`;

//     fs.writeFile(fileSavePath, bodyContent, (err) => {
//       if (err) {
//         console.error("Error writing file:", err);
//       } else {
//         console.log("File saved successfully!");
//       }
//     });
//     await page.close();

//     // link 2
//     page = await browser.newPage();
//     await page.goto(filteredData[i].link2, {
//       waitUntil: "domcontentloaded",
//     });
//     bodyContent = await page.content();
//     fileSavePath = `${dirPath}/${currentConference.Acronym}_link2.html`;

//     fs.writeFile(fileSavePath, bodyContent, (err) => {
//       if (err) {
//         console.error("Error writing file:", err);
//       } else {
//         console.log("File saved successfully!");
//       }
//     });
//     await page.close();

//     // link 3
//     page = await browser.newPage();
//     await page.goto(filteredData[i].link3, {
//       waitUntil: "domcontentloaded",
//     });
//     bodyContent = await page.content();
//     fileSavePath = `${dirPath}/${currentConference.Acronym}_link3.html`;

//     fs.writeFile(fileSavePath, bodyContent, (err) => {
//       if (err) {
//         console.error("Error writing file:", err);
//       } else {
//         console.log("File saved successfully!");
//       }
//     });
//     await page.close();

//     // link 4
//     page = await browser.newPage();
//     await page.goto(filteredData[i].link4, {
//       waitUntil: "domcontentloaded",
//     });
//     bodyContent = await page.content();
//     fileSavePath = `${dirPath}/${currentConference.Acronym}_link4.html`;

//     fs.writeFile(fileSavePath, bodyContent, (err) => {
//       if (err) {
//         console.error("Error writing file:", err);
//       } else {
//         console.log("File saved successfully!");
//       }
//     });
//     await page.close();
//   }
// };

// const updateCSVConferenceLinks = async (browser) => {
//   const filePath = "formatted_conferences.csv";

//   // Read existing CSV data
//   if (!fs.existsSync(filePath)) {
//     console.error(`File ${filePath} does not exist.`);
//     return;
//   }

//   const fileContent = fs.readFileSync(filePath, "utf8");
//   const existingData = csvParse(fileContent, { columns: true });

//   // Iterate through each row to update links if newColumn is 'link 5'
//   for (const row of existingData) {
//     if (row.newColumn === "link 5") {
//       try {
//         const conference = await Conference.findOne({ _id: row.j_id });
//         if (!conference) {
//           console.error(`Conference with j_id ${row.j_id} not found.`);
//           continue;
//         }

//         const conferenceLinks = await webScraperService.searchConferenceLinks(
//           browser,
//           conference,
//           8
//         );
//         if (conferenceLinks.length === 8) {
//           row.link5 = conferenceLinks[4] || "";
//           row.link6 = conferenceLinks[5] || "";
//           row.link7 = conferenceLinks[6] || "";
//           row.link8 = conferenceLinks[7] || "";
//         }
//       } catch (error) {
//         console.error(
//           `Error updating conference with j_id ${row.j_id}:`,
//           error
//         );
//         row.link5 = "";
//         row.link6 = "";
//         row.link7 = "";
//         row.link8 = "";
//       }
//     }
//   }

//   // Convert results to CSV
//   const fields = Object.keys(existingData[0]);
//   const opts = { fields };

//   try {
//     const csv = parse(existingData, opts);
//     fs.writeFileSync(filePath, csv);
//     console.log("CSV file has been updated successfully.");
//   } catch (err) {
//     console.error(err);
//   }
// };

// const updateFormattedConferences = async () => {
//   const filePath = "formatted_conferences.csv";

//   // Read existing CSV data
//   if (!fs.existsSync(filePath)) {
//     console.error(`File ${filePath} does not exist.`);
//     return;
//   }

//   const fileContent = fs.readFileSync(filePath, "utf8");
//   const existingData = csvParse(fileContent, { columns: true });

//   // Iterate through each row to update the new column
//   for (const row of existingData) {
//     const j_id = row.j_id;

//     try {
//       const conference = await Conference.findOne({ _id: j_id });

//       if (!conference) {
//         row.newColumn = null;
//       } else {
//         const links = conference.Links;

//         if (links.length === 1) {
//           switch (links[0]) {
//             case row.link1:
//               row.newColumn = "link 1";
//               break;
//             case row.link2:
//               row.newColumn = "link 2";
//               break;
//             case row.link3:
//               row.newColumn = "link 3";
//               break;
//             case row.link4:
//               row.newColumn = "link 4";
//               break;
//             default:
//               row.newColumn = "link 5";
//               break;
//           }
//         } else if (links.length === 4) {
//           row.newColumn = "4 links";
//         } else {
//           row.newColumn = null;
//         }
//       }
//     } catch (error) {
//       console.error(`Error fetching conference with j_id ${j_id}:`, error);
//       row.newColumn = null;
//     }
//   }

//   // Convert results to CSV
//   const fields = [...Object.keys(existingData[0]), "newColumn"];
//   const opts = { fields };

//   try {
//     const csv = parse(existingData, opts);
//     fs.writeFileSync(filePath, csv);
//     console.log("CSV file has been updated successfully.");
//   } catch (err) {
//     console.error(err);
//   }
// };

// const formatEvaluationDataset = () => {
//   // Read and process the existing CSV file
//   try {
//     const fileContent = fs.readFileSync("conferences.csv", "utf8");
//     const records = csvParse(fileContent, { columns: true });

//     const groupedRecords = records.reduce((acc, record) => {
//       if (!acc[record.j_id]) {
//         acc[record.j_id] = [];
//       }
//       acc[record.j_id].push(record.link);
//       return acc;
//     }, {});

//     const formattedResults = [];

//     for (const [j_id, links] of Object.entries(groupedRecords)) {
//       formattedResults.push({
//         j_id: j_id,
//         link1: links[0] || "",
//         link2: links[1] || "",
//         link3: links[2] || "",
//         link4: links[3] || "",
//       });
//     }

//     const newFields = ["j_id", "link1", "link2", "link3", "link4"];
//     const newCsv = parse(formattedResults, { fields: newFields });
//     fs.writeFileSync("formatted_conferences.csv", newCsv);
//     console.log("Formatted CSV file has been written successfully.");
//   } catch (err) {
//     console.error(err);
//   }
// };

// const lastHope = async () => {
//   // let result = []
//   // for (let i = 0; i < conferenceHasIncorrectLinks.length; i++) {
//   //     const currentConference = await Conference.findOne({_id: conferenceHasIncorrectLinks[i]})
//   //     result.push(currentConference)
//   // }
//   // // Convert result to JSON string
//   // const jsonString = JSON.stringify(result, null, 2); // Pretty print with 2 spaces
//   // // Save JSON to file
//   // fs.writeFile('result.json', jsonString, (err) => {
//   //     if (err) {
//   //         console.error('Error writing to JSON file', err);
//   //     } else {
//   //         console.log('JSON file has been saved.');
//   //     }
//   // });

//   const data = fs.readFileSync("result.json", "utf-8");
//   const conferences = JSON.parse(data);
//   console.log(conferences.length);
//   for (let conference of conferences) {
//     // await Conference.updateOne(
//     //     { _id: conference._id }, // Match by the _id field
//     //     { $set: conference },
//     //     { upsert: false } // Insert if not found
//     // );
//     await dataPineline(conference._id);
//   }

//   console.log("Database update complete.");
// };

// const getCallForPaper = async (browser) => {
//   const link = "https://sighpc.ipsj.or.jp/HPCAsia2024/cfp.html";
//   const page = await browser.newPage();
//   await page.goto(link, { waitUntil: "domcontentloaded" });
//   await page.waitForSelector("main");

//   let data = await page.$$eval("main", (els) => {
//     return els.map((el) => {
//       return el.innerText;
//     });
//   });

//   console.log(data);
//   console.log(data.length);
//   // Convert the data array to a CSV format
//   const jsonString = JSON.stringify(data, null, 2); // Pretty print with 2 spaces

//   // Save the JSON to a file
//   fs.writeFile("callforpaper.json", jsonString, (err) => {
//     if (err) {
//       console.error("Error writing to JSON file", err);
//     } else {
//       console.log("JSON file has been saved.");
//     }
//   });
// };

// const getEvaluationDataset = async (browser) => {
//   const allConferences = await Conference.find({});
//   console.log(allConferences.length);

//   const results = [];

//   for (let i = 0; i < conferenceHasIncorrectLinks.length; i++) {
//     const currentConference = await conferenceModel.findOne({
//       _id: conferenceHasIncorrectLinks[i],
//     });

//     const conferenceLinks =
//       await webScraperService.searchConferenceLinksByTitle(
//         browser,
//         currentConference,
//         4
//       );

//     results.push({
//       j_id: currentConference._id,
//       link: conferenceLinks,
//     });

//     console.log(currentConference._id + " " + i);
//   }

//   // Read existing CSV data if file exists
//   let existingData = [];
//   const filePath = "formatted_conferences.csv";
//   if (fs.existsSync(filePath)) {
//     const fileContent = fs.readFileSync(filePath, "utf8");
//     existingData = csvParse(fileContent, { columns: true });
//   }

//   // Create a map of existing records by j_id
//   const existingMap = existingData.reduce((acc, record) => {
//     acc[record.j_id] = record;
//     return acc;
//   }, {});

//   // Update existing records or add new ones
//   results.forEach((result) => {
//     const { j_id, link } = result;

//     existingMap[j_id] = {
//       j_id,
//       link1: link[0],
//       link2: link[1],
//       link3: link[2],
//       link4: link[3],
//     };
//   });

//   // Convert the updated map back to an array
//   const updatedData = Object.values(existingMap);

//   // Convert results to CSV
//   const fields = ["j_id", "link1", "link2", "link3", "link4"];
//   const opts = { fields };

//   try {
//     const csv = parse(updatedData, opts);
//     fs.writeFileSync(filePath, csv);
//     console.log("Formatted CSV file has been written successfully.");
//   } catch (err) {
//     console.error(err);
//   }
// };

// const processConferenceHasWrongLink = async (browser) => {
//   console.log(conferenceHasIncorrectLinks.length);
//   for (let i = 0; i < conferenceHasIncorrectLinks.length; i++) {
//     const currentConference = await conferenceModel.findOne({
//       _id: conferenceHasIncorrectLinks[i],
//     });
//     let conferenceLink = await webScraperService.searchConferenceLinksByTitle(
//       browser,
//       currentConference,
//       4
//     );
//     currentConference.Links = conferenceLink;

//     await conferenceModel.findByIdAndUpdate(currentConference._id, {
//       Links: conferenceLink,
//     });
//     console.log(currentConference._id + " " + i);
//   }
// };

// Get new conferences from Core portal
const crawlNewConferences = async (browser) => {
  // Step 1: Get conference list from Core portal
  console.log(">> Getting conference list from Core portal...");
  const conferenceList = await webScraperService.getConferenceList(browser);
  console.log(">> Conference list from Core portal: " + conferenceList.length);

  // Step 2: Compare with conference list in Database
  const existingConferences = await Conference.find({}, "Title");
  console.log(">> ExistingConferences: ", existingConferences.length);
  const newConferences = getNewConferences(conferenceList, existingConferences);
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
    await setTimeout(function () {}, Math.floor(Math.random() * 2000) + 1000);

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
    isCrawlSuccess = await handleConferenceException(browser, conference._id);
  } else {
    let fullInformationPoint = conference.Links.length > 1 ? 3 : 2;
    isCrawlSuccess = await webScraperService.getConferenceDetails(
      browser,
      conference,
      fullInformationPoint
    );
  }
  isCrawlSuccess = true;

  await webScraperService.getLocation(browser, conference);
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
        const isCrawlSuccess = await webScraperService.getConferenceDetails(
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
          "Error occurred for conference: " + conference._id + " - " + error
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
      !existingList.some((existingConf) => existingConf.Title === newConf.Title)
  );
};

module.exports = {
  crawlController,
  crawlNewConferences,
  crawlAllConferencesDetail,
  processConferenceError,
  crawlConferenceById,
  crawlNewConferenceById,
};
