const startBrowser = require('./src/untils/browser');
const { crawlController } = require('./src/controllers/conference-controller')
const dbConnect = require('./src/config/dbconnect');

const main = async () => {
    // Connect to database
    await dbConnect();

    // Create browser
    let browser = startBrowser();

    // Crawl data
    crawlController(browser);
};

main();





