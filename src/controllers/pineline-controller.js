const Conference = require("../models/conference-model");
const dbConnect = require('../config/dbconnect');
const { getImportantDates } = require('../rule/extractImportantDate-rule');
const { dataPinelineAPI, getConferenceToPineline } = require("../etl/datapineline");
const startBrowser = require('../untils/browser');

const pinelineController = async (req, res) => {
    
}

const scrapeConferenceById = async (confId) => {
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

const scrapeConference = async (req, res) => {
    const startTime = Date.now(); 

    try {
        await dbConnect()
        let browser = await startBrowser();
        
        const conference = await Conference.findById(req.params.id);

        if (!conference) {
            const endTime = Date.now(); 
            const duration = endTime - startTime; 
            return res.status(404).json({ 
                message: 'Conference not found' ,
                duration: `${duration} ms`
            });
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

        if(data) {
            console.log("Successfully")
            res.json({
                message: "Successfully",
                data: data,
                duration: `${duration} ms`
            });
        } else {
            res.status(400).json({
                message: "Sorry something went wrong",
                duration: `${duration} ms`
            });
        }
        
    } catch (error) {
        const endTime = Date.now(); // Lấy thời gian kết thúc
        const duration = endTime - startTime; // Tính thời gian thực hiện

        res.status(500).json({
            message: error.message,
            duration: `${duration} ms`
        });
    } 
}
module.exports = {
    pinelineController,
    scrapeConference,
    scrapeConferenceById
};