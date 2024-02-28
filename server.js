const startBrowser = require('./src/untils/browser');
const { crawlController } = require('./src/controllers/conference-controller')
const { notificationController } = require('./src/controllers/notification-controller')
const dbConnect = require('./src/config/dbconnect');
var cron = require('node-cron');

const main = async () => {
    // Connect to database
    await dbConnect();

    // Create browser
    let browser = startBrowser();

    // Crawl data
    // crawlController(browser);

    // Notification
    // notificationController();
    cron.schedule("50 14,15,16 * * *", async () => {
        console.log("Sending email notifications...");
        notificationController();
    }, {
        timezone: "Asia/Ho_Chi_Minh" // Đặt múi giờ cho lịch
    });
};

main();





