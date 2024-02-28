const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const dbConference = require('../models/conference-model');
const dbUser = require('../models/user-model');
const { notification } = require('../template/mail-template');

const GOOGLE_MAILER_CLIENT_ID = process.env.GOOGLE_MAILER_CLIENT_ID
const GOOGLE_MAILER_CLIENT_SECRET = process.env.GOOGLE_MAILER_CLIENT_SECRET
const GOOGLE_MAILER_REFRESH_TOKEN = process.env.GOOGLE_MAILER_REFRESH_TOKEN
const ADMIN_EMAIL_ADDRESS = process.env.ADMIN_EMAIL_ADDRESS

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