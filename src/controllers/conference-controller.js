const cron = require('node-cron');
const schedule = require('node-schedule');
const webScraperService = require('../services/web-scraper-service')
const emailService = require('../services/email-service')
const dbConference = require('../models/conference-model');
const dbFollow = require('../models/follow-model');
const conferenceModel = require('../models/conference-model');

const crawlController = async (browserInstance) => {
    try {
        // Create browser 
        let browser = await browserInstance;

        // Schedule the job to run at 2:00 AM every day
        // Code to here
        // await crawlNewConferences(browser);

        // Schedule the job to run for each conference in the database
        // Code to here
        // await crawlAllConferencesDetail(browser);

        // Send email
        // const followList = await dbFollow.find({});
        // console.log(followList)
        // for(let i=0; i<followList.length; i++) {
        //     emailService.sendingEmail(followList[i].userId, followList[i].confId);
        // }

        // Lấy ra ngày hiện tại
        const currentDate = new Date();

        // Tạo ngày sau một tuần từ ngày hiện tại
        const oneWeekLater = new Date(currentDate);
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);

        const upcommingConf = await dbConference.find({
            $or: [
                { 'ConferenceDate.date': { $gte: currentDate, $lt: oneWeekLater } },
                { 'SubmissionDate.date': { $gte: currentDate, $lt: oneWeekLater } },
                { 'NotificationDate.date': { $gte: currentDate, $lt: oneWeekLater } }
            ]
        });
        
        let upcomingEvents = [];

        upcommingConf.forEach(conf => {
            conf.ConferenceDate.forEach(confDate => {
                if (confDate.date >= currentDate && confDate.date < oneWeekLater) {
                    upcomingEvents.push({ 
                        title: conf.Title,
                        date: confDate.date, 
                        keyword: confDate.keyword });
                }
            });
        
            conf.SubmissonDate.forEach(submissionDate => {
                if (submissionDate.date >= currentDate && submissionDate.date < oneWeekLater) {
                    upcomingEvents.push({ 
                        title: conf.Title,
                        date: submissionDate.date, 
                        keyword: submissionDate.keyword });
                }
            });
        
            conf.NotificationDate.forEach(notificationDate => {
                if (notificationDate.date >= currentDate && notificationDate.date < oneWeekLater) {
                    upcomingEvents.push({ 
                        title: conf.Title,
                        date: notificationDate.date, 
                        keyword: notificationDate.keyword });
                }
            });

        });
        
        console.log(upcomingEvents);


    } catch (error) {
        console.log('Error in crawlController: ' + error);
    }
}

// Get new conferences from Core portal
const crawlNewConferences = async (browser) => {
    // Step 1: Get conference list from Core portal
    console.log('>> Getting conference list from Core portal...')
    const conferenceList = await webScraperService.getConferenceList(browser);
    console.log('>> Conference list from Core portal: ' + conferenceList.length);

    // Step 2: Compare with conference list in Database 
    const existingConferences = await dbConference.find({}, 'Title');
    console.log('>> ExistingConferences: ', existingConferences.length);
    const newConferences = getNewConferences(conferenceList, existingConferences);
    console.log('>> NewConferences: ', newConferences.length)

    // Step 3: For each new conference, get conference link
    console.log('>> Getting conferences link...')
    for (let i = 0; i < newConferences.length; i++) {
        console.log(i)
        let conferenceLink = await webScraperService.searchConferenceLinks(browser, newConferences[i])
        newConferences[i].Links = conferenceLink;

        // Store new conference
        await dbConference.create(newConferences[i]);

        // Create ramdom time to outplay Captcha
        setTimeout(function () {
        }, Math.floor(Math.random() * 2000) + 1000)

        //if(i==98) break;
    }
    console.log('>> Get conferences link successfully');
}

// Get all conferences detail from conference link
const crawlAllConferencesDetail = async (browser) => {
    console.log('>> Crawling all conference detail...')
    // Step 1: Get all conference from Database
    let allConferences = await Conference.find({});
    // console.log(allConferences.length)
    // Step 2: For each conference, get detail
    for (let i = 0; i < allConferences.length; i++) {
        console.log(i)
        await webScraperService.getConferenceDetails(browser, allConferences[i]);

        // Create ramdom time to outplay Captcha
        setTimeout(function () {
        }, Math.floor(Math.random() * 2000) + 1000)

        if (i == 199) break;
        /* 
            Cần có một file log, lưu lại i nào bị lỗi --> cần cào lại
            một lần chỉ cào một số ít thôi, lưu lại lần cuối cào thì i bằng 
            bao nhiêu rồi
        */
    }

    console.log('>> Crawl all conference detail successfully')
}

// Get new conferences
const getNewConferences = (newList, existingList) => {
    // Compare new list with existing list based on name
    return newList.filter(newConf => !existingList.some(existingConf => existingConf.Title === newConf.Title));
};

module.exports = { crawlController };