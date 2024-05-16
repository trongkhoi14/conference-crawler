const Conference = require("../models/conference-model");
const { postConference } = require("../services/conference-service");

const dataPineline = async (conferenceId) => {
    const allConference = await Conference.findone({
        _id: conferenceId,
    });

    for (const conference of allConference) {
        if (conference.Links.length == 1) {

            const importantDates = [
                {
                    date_value: conference.ConferenceDate[0]?.date,
                    date_type: conference.ConferenceDate[0]?.keyword,
                },
                ...conference.SubmissonDate.map((item) => ({
                    date_value: item.date,
                    date_type: item.keyword,
                })),
                ...conference.NotificationDate.map((item) => ({
                    date_value: item.date,
                    date_type: item.keyword,
                })),
            ];

            const processedConf = {
                conf_name: conference.Title,
                acronym: conference.Acronym,
                callForPaper: "Not found",
                link: conference.Links[0],
                rank: conference.Rank,
                fieldsOfResearch: getFieldOfRearchName(conference.PrimaryFoR)
                    ? [getFieldOfRearchName(conference.PrimaryFoR)]
                    : ["none"],
                importantDates: importantDates,
                nkey: conference._id.toString(),
            };

            postConference(processedConf)

            setTimeout(() => {
                console.log("waiting ... ")
            }, 1000);
        }
    }
};

const getFieldOfRearchName = (forCode) => {
    for (let i = 0; i < fieldOfRearchCategories.length; i++) {
        const category = fieldOfRearchCategories[i];
        if (category.hasOwnProperty(forCode)) {
            return category[forCode];
        }
    }
    return null;
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
};
