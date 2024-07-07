const { convertImageToText } = require('../untils/convert')
const sharp = require('sharp');
const axios = require("axios");
const webp=require('webp-converter');
const dateFinder = require("datefinder");
const { getLocation } = require('./extractLocation-rule')

//Check lại conf này
//6639d0b12aa97d8b888060c7

const getConferenceDates = async (browser, link) => {
    try {
        console.log(">> Getting conference date from: " + link);

        let page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("frame")
        
        let imageLinks = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll("img"));
            return images
                .filter(img => img.src.toLowerCase().includes('banner') 
                || img.src.toLocaleLowerCase().includes('ban')
                || (img.alt && img.alt.toLowerCase().includes('banner')))
                .map(img => img.src);
        });

        await page.close();
        imageLinks = imageLinks[0];

        console.log(imageLinks)

        const textFromImage = await convertImageToText(imageLinks);
        console.log(textFromImage)
        const conferenceDate = extractConferenceDate(textFromImage);
        return conferenceDate;
    } catch (error) {
        console.log(">> Error in getConferenceDates: " + error);
        return null;
    }
}

const extractConferenceDate = (text) => {
    // Biểu thức chính quy để tìm ngày tháng: 17 - 19 November, 2024
    const dateRegex = /(\d{1,2})\s*-\s*(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s*(\d{4})/i;

    // Tìm các kết quả khớp với biểu thức chính quy
    const match = text.match(dateRegex);

    if (match) {
        let startDay = match[1];
        let endDay = match[2];
        let month = match[3];
        let year = match[4];
        
        if(startDay > 70 && startDay < 80) {
            startDay = startDay - 60
        }

        // Tạo chuỗi ngày tháng hoàn chỉnh cho startDate và endDate
        const startDateString = `${month} ${startDay}, ${year}`;
        const endDateString = `${month} ${endDay}, ${year}`;

        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);
    
        // Đảm bảo đúng múi giờ UTC
        const startDateISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString();
        const endDateISO = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();
        
        return {
            startDateISO,
            endDateISO,
        };

    //October 17-19, 2024
    //March 25, 2024
    } else {
        return null;
    }
}

module.exports = {
    getConferenceDates,
};