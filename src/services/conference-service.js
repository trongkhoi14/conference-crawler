const axios = require("axios");

const postConference = (conference) => {
    axios
        .post("https://conference-searching.onrender.com/api/v1/post/etl", conference)
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
};

module.exports = {
    postConference,
};
