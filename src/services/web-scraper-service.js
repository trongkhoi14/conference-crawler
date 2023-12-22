const puppeteer = require('puppeteer');
const dateFinder = require('datefinder');
require('dotenv').config();

const getConferenceList = (browser) => new Promise(async(resolve, reject) => {
    try {
        let currentLink = `${process.env.PORTAL}?`
                        + `search=`
                        + `&by=${process.env.BY}`
                        + `&source=${process.env.CORE2023}`
                        + `&sort=${process.env.SORT}`
                        + `&page=${process.env.PAGE}`
        // Get total page
        const totalPages = await getTotalPages(browser, currentLink);

        // Array to store all conferences
        let allConferences = [];

        // Loop through each page and extract conferences
        for(let i=1; i<=totalPages; i++) {
            let conferencesOnPage = await getConferencesOnPage(browser, currentLink.slice(0, -1) + i)   
            //console.log(conferencesOnPage.length)
            allConferences = allConferences.concat(conferencesOnPage);
        }
        
        resolve(allConferences)
    } catch (error) {
        console.log("Error in web-scraper-service/getConferenceList");
        reject(error)
    }
})

const searchConferenceLinks  = (browser, conference) => new Promise(async(resolve, reject) => {
    try {
        // Total link need to collect
        const maxLinks = 4; 

        // Array to get all link from searching
        let links = [];

        // Open new page
        let page = await browser.newPage();

        // Searching with keyword = Title + 2023
        await page.goto('https://www.google.com/');
        await page.waitForSelector('#APjFqb');
        await page.keyboard.sendCharacter(conference.Title + ' 2023');
        await page.keyboard.press('Enter');
        await page.waitForNavigation();
        await page.waitForSelector('#search');

        while (links.length < maxLinks) {
            const linkList = await page.$$eval('#search a', (els) => {
                const result = [];
                // Remove some garbage link
                const googleScholarDomain = 'scholar.google'; // Tên miền của Google Scholar
                const googleTranslateDomain = 'translate.google';
                const googleDomain = 'google.com';

                for (const el of els) {
                    const href = el.href;
                    // Kiểm tra xem liên kết có chứa tên miền của Google Scholar không
                    if (href && !href.includes(googleScholarDomain) && !href.includes(googleTranslateDomain) && !href.includes(googleDomain)) {
                        result.push({
                            link: href
                        });
                    }
                }
                return result;
            });

            links = links.concat(linkList.map(item => item.link));

            // Nếu links có nhiều hơn maxLinks, cắt bớt đi
            if (links.length > maxLinks) {
                links = links.slice(0, maxLinks);
            }
            
            if (links.length < maxLinks) {
                // Chưa đủ liên kết, tiếp tục tìm kiếm bằng cách lướt xuống
                await page.keyboard.press('PageDown');
                await page.waitForTimeout(2000); // Wating for loading
            }
        }

        await page.close();

        resolve(links.slice(0, maxLinks));
        
    } catch (error) {
        console.log("Error in web-scraper-service/searchConferenceLinks ");
        reject(error)
    }
})

// Get conference date, submisstion date, notification date, ...
const getConferenceDetails  = (browser, conference) => new Promise(async(resolve, reject) => {
    try {

        
    } catch (error) {
        console.log("Error in web-scraper-service/getConferenceDetails");
        reject(error)
    }
})

const getTotalPages = async (browser, url) => {
    let page = await browser.newPage();

    // Navigate to the first page to get the total number of pages
    await page.goto(url);

    // Extract the total number of pages from core.portal.com
    const totalPages = await page.evaluate(() => {
        const pageElements = document.querySelectorAll('#search > a');
        let maxPage = 1;
        pageElements.forEach(element => {
            const pageValue = element.textContent.length < 5 ? 
                parseInt(element.textContent) : null;
            if (!isNaN(pageValue) && pageValue > maxPage) {
                maxPage = pageValue;
            }
        });
        return maxPage;
    });

    return totalPages;
};

const getConferencesOnPage = (browser, currentLink) => new Promise(async(resolve, reject) => {
    try {
        // Open new tab
        let page = await browser.newPage();

        // Go to current link
        await page.goto(currentLink);

        // Await loading
        await page.waitForSelector("#container");

        const scrapeData = [];

        const data = await page.$$eval('#search > table tr td', tds => tds.map((td) => {
            return td.innerText;
        }))

        let currentIndex = 0;

        while (currentIndex < data.length) {
            const obj = {
                Title: data[currentIndex],
                Acronym: data[currentIndex + 1],
                Source: data[currentIndex + 2],
                Rank: data[currentIndex + 3],
                Note: data[currentIndex + 4],
                DBLP: data[currentIndex + 5],
                PrimaryFoR: data[currentIndex + 6],
                Comments: data[currentIndex + 7],
                AverageRating: data[currentIndex + 8],
            };
            scrapeData.push(obj);
            currentIndex += 9
        };

        // Close tab
        await page.close();

        resolve(scrapeData);

    } catch (error) {
        reject(error);
    }
}) 



module.exports = {
    getConferenceList,
    searchConferenceLinks,
    getConferenceDetails
}
