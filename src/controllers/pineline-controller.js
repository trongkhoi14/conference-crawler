const Conference = require("../models/conference-model");
const dbConnect = require('../config/dbconnect');
const { getImportantDates } = require('../rule/extractImportantDate-rule');
const { dataPinelineAPI } = require("../etl/datapineline");
const startBrowser = require('../untils/browser');

const pinelineController = async (req, res) => {
    
}

const getConferenceToPineline = async (conferenceId) => {
    const allConference = await Conference.find({
        _id: conferenceId,
    });

    for (const conference of allConference) {
        if (conference.Links.length == 1 
            && new Date((conference.ConferenceDate[0].date)).getUTCFullYear() > 2023
        ) {
            const organizations = [
                {
                    name: "default",
                    location: conference.Location? conference.Location : "",
                    type: conference.Type? conference.Type : "",
                    start_date: conference.ConferenceDate[0]?.date,
                    end_date: conference.ConferenceDate[1]?.date
                },
            ];
            const importantDates = [
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

            const processedConf = {
                conf_name: conference.Title,
                acronym: conference.Acronym,
                callForPaper: conference.CallForPaper? conference.CallForPaper : "Not found",
                link: conference.Links[0],
                rank: conference.Rank,
                fieldsOfResearch: getFieldOfRearchName(conference.PrimaryFoR)
                    ? [getFieldOfRearchName(conference.PrimaryFoR)]
                    : ["none"],
                importantDates: importantDates? importantDates : [""],
                nkey: conference._id.toString(),
                organizations: organizations? organizations : [""],
                source: "CORE2023"
            };  

            return processedConf
        } else {
            const processedConf = {
                conf_name: conference.Title,
                acronym: conference.Acronym,
                callForPaper: "Not found",
                link: "Not found",
                rank: conference.Rank,
                fieldsOfResearch: getFieldOfRearchName(conference.PrimaryFoR)
                    ? [getFieldOfRearchName(conference.PrimaryFoR)]
                    : ["none"],
                nkey: conference._id.toString(),
                source: "CORE2023"
            };  

            return processedConf
        }
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

        const data = getConferenceToPineline(conference._id)

        const endTime = Date.now(); 
        const duration = endTime - startTime; 

        if(data) {
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
    scrapeConference
};