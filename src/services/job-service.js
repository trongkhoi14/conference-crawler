const Conference = require("../models/conference-model");
const dbConnect = require('../config/dbconnect');
const { getImportantDates } = require('../rule/extractImportantDate-rule');
const { dataPinelineAPI, getConferenceToPineline } = require("../etl/datapineline");
const startBrowser = require('../untils/browser');

const scrapeConference = async (confId) => {
    const startTime = Date.now(); 

    try {
        await dbConnect()
        let browser = await startBrowser();
        
        const conference = await Conference.findById(req.params.id);

        if (!conference) {
            const endTime = Date.now(); 
            const duration = endTime - startTime; 
            //
        }

        // Cào imp date 
        let newImportantDates;
        if(conference.Links[0].length > 0) {
            newImportantDates = await getImportantDates(browser, conference.Links[0])
        }
        
        const oldImportantDates = [
            ...conference.SubmissonDate.map((item) => ({
                date_value: item.date,
                date_type: item.keyword,
            })),
            ...conference.NotificationDate.map((item) => ({
                date_value: item.date,
                date_type: item.keyword,
            })),
            ...conference.CameraReady.map((item) => ({
                date_value: item.date,
                date_type: item.keyword,
            })),
        ];

        await browser.close()

        // Imp date có khác biệt thì vào update vào db
        // await updateConferenceById()

        const data = await getConferenceToPineline(conference._id)

        const endTime = Date.now(); 
        const duration = endTime - startTime; 

       
        
    } catch (error) {
        const endTime = Date.now(); // Lấy thời gian kết thúc
        const duration = endTime - startTime; // Tính thời gian thực hiện

    } 
}

module.exports = {
    scrapeConference
}