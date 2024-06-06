const startBrowser = require('./src/untils/browser');
const { crawlController, crawlAllConferencesDetail } = require('./src/controllers/conference-controller')
const { notificationController } = require('./src/controllers/notification-controller')
const { dataPinelineAPI } = require('./src/etl/datapineline')
const dbConnect = require('./src/config/dbconnect');
var cron = require('node-cron');
const express = require('express');

const main = async () => {
    // Connect to database
    await dbConnect();

    // Create browser
    let browser = startBrowser();

    // Crawl data
    crawlController(browser);
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

// app.get('/', async (req, res) => {
//     await dbConnect()
//     notificationController()
//     res.status(200).json({
//         message: "Send emmail successfully"
//     })
// })

app.get('/pineline/:id', async (req, res) => {
    const confid = req.params;
    await dbConnect();

    const result = await dataPinelineAPI(confid)

    res.status(200).json({
        message: result
    })
})

app.listen(process.env.PORT, ()=> {
    console.log(`Server was running on port ${process.env.PORT}`)
})





