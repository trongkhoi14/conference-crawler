const puppeteer = require('puppeteer');

const startBrowser = async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: 
                process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
            //Không hiển thị GUI lên
            headless: false,
            defaultViewport: false,
            args: ["--disable-setuid-sandbox"],
            'ignoreHTTPSErrors': true,
            product: 'chrome'
        })
        
    } catch (error) {
        console.log("Không tạo được browser: "+ browser);
    };
    
    return browser;

}

module.exports = startBrowser;