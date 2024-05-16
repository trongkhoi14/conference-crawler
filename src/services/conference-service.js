const axios = require("axios");

const postConference = async (conference) => {
    await axios
        .post("https://conference-searching.onrender.com/api/v1/post/etl", conference)
        .then((response) => {
            console.log(response.data);
        })
        .catch((error) => {
            console.log(error.data);
        });
};

module.exports = {
    postConference,
};
