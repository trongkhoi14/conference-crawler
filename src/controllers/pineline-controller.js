const Conference = require("../models/conference-model");
const dbConnect = require('../config/dbconnect');
const { getImportantDates } = require('../rule/extractImportantDate-rule');
const { dataPinelineAPI } = require("../etl/datapineline");
const startBrowser = require('../untils/browser');

const pinelineController = async (req, res) => {
    
}

const scrapeConference = async (req, res) => {
    try {
        await dbConnect()
        let browser = await startBrowser();
        
        const conference = await Conference.findById(req.params.id);

        if (!conference) {
            return res.status(404).json({ 
                message: 'Conference not found' ,
                data: []
            });
        }
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

        // Khác biệt thì vào database update

        const etl = await dataPinelineAPI(conference._id)
        if(etl) {
            res.json({
                message: "Successfully" 
            });
        } else {
            res.status(400).json({
                message: "Sorry something went wrong" 
            });
        }
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    } 
}
module.exports = {
    pinelineController,
    scrapeConference
};