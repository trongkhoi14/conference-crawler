const startBrowser = require('./src/untils/browser');
const { crawlController, crawlAllConferencesDetail } = require('./src/controllers/conference-controller')
const { notificationController } = require('./src/controllers/notification-controller')
const { dataPinelineAPI } = require('./src/etl/datapineline')
const dbConnect = require('./src/config/dbconnect');
const { scrapeConference } = require('./src/controllers/pineline-controller')
var cron = require('node-cron');
const express = require('express');
const cookieParser = require('cookie-parser')

const main = async () => {
    // Connect to database
    await dbConnect();

    // Create browser
    let browser = startBrowser();

    // Crawl data
    await crawlController(browser);
    // notificationController();
    // Notification
    // notificationController();
    // cron.schedule("15 16 * * *", async () => {
    //     console.log("Sending email notifications...");
    //     notificationController();
    //     crawlAllConferencesDetail(browser);
    // }, {
    //     timezone: "Asia/Ho_Chi_Minh" // Đặt múi giờ cho lịch
    // });
};  

main();

const app = express()
const port = process.env.PORT || 8081

app.use(cookieParser())

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// app.get('/', async (req, res) => {
//     await dbConnect()
//     notificationController()
//     res.status(200).json({
//         message: "Send emmail successfully"
//     })
// })

app.get('/api/scrape/conference/:id', scrapeConference)

app.listen(process.env.PORT, ()=> {
    console.log(`Server was running on port ${process.env.PORT}`)
})





