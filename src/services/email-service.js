const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const dbConference = require('../models/conference-model');
const dbUser = require('../models/user-model');
const { notification } = require('../template/mail-template');

const GOOGLE_MAILER_CLIENT_ID = '400969448988-lva8hj82r5m8ic0qsc8hc6e9msn26uth.apps.googleusercontent.com'
const GOOGLE_MAILER_CLIENT_SECRET = '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'
const GOOGLE_MAILER_REFRESH_TOKEN = '1//041ORfACDkn-UCgYIARAAGAQSNwF-L9IrmifO3y2uhZuI3Et98XZrhTM6LzjSR9xtqt4R06hvTCon6qEMfqd8S5FWYIoU_O0zBxk'
const ADMIN_EMAIL_ADDRESS = 'luongkhoi.14042002@gmail.com'

// Khởi tạo OAuth2Client với Client ID và Client Secret 
const myOAuth2Client = new OAuth2Client(
    GOOGLE_MAILER_CLIENT_ID,
    GOOGLE_MAILER_CLIENT_SECRET
)
// Set Refresh Token vào OAuth2Client Credentials
myOAuth2Client.setCredentials({
    refresh_token: GOOGLE_MAILER_REFRESH_TOKEN
})

const sendingEmail = async (payload) => {
   
    const myAccessTokenObject = await myOAuth2Client.getAccessToken();
    // Access Token nằm trong property 'token' trong Object vừa get được ở trên
    const myAccessToken = myAccessTokenObject?.token;
    const { data } = notification(payload)
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: ADMIN_EMAIL_ADDRESS,
            clientId: GOOGLE_MAILER_CLIENT_ID,
            clientSecret: GOOGLE_MAILER_CLIENT_SECRET,
            refresh_token: GOOGLE_MAILER_REFRESH_TOKEN,
            accessToken: myAccessToken
        }
    });

    try {
        // Gửi email
        await transport.sendMail(data)
        console.log(">> Send email successfully")
    } catch (error) {
        console.log("Error in SendingEmail: " + error);
    }
}

module.exports = {
    sendingEmail
}