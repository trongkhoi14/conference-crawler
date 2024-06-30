const Conference = require("../models/conference-model");
const { postConference } = require("../services/conference-service");

const dataPineline = async (conferenceId) => {
    const allConference = await Conference.find({
        _id: conferenceId,
    });

    for (const conference of allConference) {
        // console.log(new Date((conference.ConferenceDate[0].date)).getUTCFullYear())
        // console.log(new Date((conference.ConferenceDate[0].date)).getUTCMonth())

        if (conference.Links.length == 1 
            // && (conference.SubmissonDate.length > 0 ||
            //     conference.NotificationDate.length > 0 ||
            //     conference.CameraReady.length > 0
            // )
            && new Date((conference.ConferenceDate[0].date)).getUTCFullYear() >= 2023
            && (conference.Rank == 'C' || conference.Rank == 'B' || conference.Rank == 'A' || conference.Rank == 'A*')
           
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
            // console.log(processedConf)

            await postConference(processedConf)
            
            setTimeout(() => {
                console.log("waiting ... ");
            }, 1000);
        } else if(conference.Rank == 'C' || conference.Rank == 'B' || conference.Rank == 'A' || conference.Rank == 'A*') {
            console.log(conference.Rank)
            const processedConf = {
                conf_name: conference.Title,
                acronym: conference.Acronym,
                callForPaper: "Not found",
                link: conference.Links[0]? conference.Links[0] : "Not found",
                rank: conference.Rank,
                fieldsOfResearch: getFieldOfRearchName(conference.PrimaryFoR)
                    ? [getFieldOfRearchName(conference.PrimaryFoR)]
                    : ["none"],
                nkey: conference._id.toString(),
                source: "CORE2023"
            };  
            // console.log(processedConf)

            await postConference(processedConf)
            
            setTimeout(() => {
                console.log("waiting ... ");
            }, 1000);
        }
    }
};

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

const getFieldOfRearchName = (forCode) => {
    for (let i = 0; i < fieldOfRearchCategories.length; i++) {
        const category = fieldOfRearchCategories[i];
        if (category.hasOwnProperty(forCode)) {
            return category[forCode];
        }
    }
    return null;
};

const dataPinelineAPI = async (conferenceId) => {
    const allConference = await Conference.find({
        _id: conferenceId,
    });


    for (const conference of allConference) {
        if (conference.Links.length == 1) {
            const organizations = [
                {
                    name: "default",
                    location: conference.Location? conference.Location : "updating",
                    type: conference.Type? conference.Type : "updating",
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
                source: conference.Source
            };  

            return await postConference(processedConf)

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
                source: conference.Source
            };  

            return await postConference(processedConf)
        }
    }
};

const fieldOfRearchCategories = [
    {
        46: "Information and Computing Sciences",
    },
    {
        4601: "Applied computing",
    },
    {
        4602: "Artificial intelligence",
    },
    {
        4603: "Computer vision and multimedia computation",
    },
    {
        4604: "Cybersecurity and privacy",
    },
    {
        4605: "Data management and data science",
    },
    {
        4606: "Distributed computing and systems software",
    },
    {
        4607: "Graphics, augmented reality and games",
    },
    {
        4608: "Human-centred computing",
    },
    {
        4611: "Machine learning",
    },
    {
        4612: "Software engineering",
    },
    {
        4613: "Theory of computation",
    },
];

module.exports = {
    dataPineline,
    dataPinelineAPI,
    getConferenceToPineline
};
