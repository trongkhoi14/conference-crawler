const cron = require('node-cron');
const schedule = require('node-schedule');
const webScraperService = require('../services/web-scraper-service')
const Conference = require('../models/conference-model');


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
        console.log('Error in crawlController: '+ error);
    }
    
   
}

// Get new conferences from Core portal
const crawlNewConferences = async (browser) => {
    // Step 1: Get conference list from Core portal
    console.log('>> Getting conference list from Core portal...')
    const conferenceList = await webScraperService.getConferenceList(browser);
    console.log('>> Conference list from Core portal: ' + conferenceList.length);
    
    // Step 2: Compare with conference list in Database 
    const existingConferences = await Conference.find({}, 'Title');
    console.log('>> ExistingConferences: ', existingConferences.length);
    const newConferences = getNewConferences(conferenceList, existingConferences);
    console.log('>> NewConferences: ', newConferences.length)
    
    // Step 3: For each new conference, get conference link
    console.log('>> Getting conferences link...')
    for(let i=0; i<newConferences.length; i++) {
        console.log(i)
        let conferenceLink = await webScraperService.searchConferenceLinks(browser, newConferences[i])
        newConferences[i].Links = conferenceLink;

        // Store new conference
        await Conference.create(newConferences[i]);

        // Create ramdom time to outplay Captcha
        setTimeout(function() {
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
    for(let i=0; i<allConferences.length; i++) {
        console.log(i)
        await webScraperService.getConferenceDetails(browser, allConferences[i]);
        
        // Create ramdom time to outplay Captcha
        setTimeout(function() {
        }, Math.floor(Math.random() * 2000) + 1000)

        if(i==199) break;
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