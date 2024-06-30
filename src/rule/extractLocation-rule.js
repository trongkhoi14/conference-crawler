const conferenceModel = require("../models/conference-model")
/*
Text lấy được từ banner 

Lấy title input --> slice ra từ chữ conference on/of/... về sau

Sau đó cắt bỏ ngày tháng

*/

const getLocation = async (browser, title, link) => {
    try {
        console.log(">> Getting location from: " + link);

        let page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });
        try {
            await page.waitForSelector(".container")
        } catch(error) {

        } finally {
            console.log("fanally")
            let bodyContent = await page.evaluate(() => {
                // let confLocation = Array.from(document.querySelectorAll("#conference-location"))
                // if(confLocation.length > 0) {
                //     return confLocation[0].innerText
                // }
                // const head = Array.from(document.querySelectorAll(".head"));

                // if(head.length > 0) {
                //     return head[0].innerText
                // }
                // let confDate = Array.from(document.querySelectorAll(".conference-date"))
                // if(confDate.length > 0) {
                //     return confDate[0].innerText
                // }
                
                return document.body.innerText;
            });
            console.log(bodyContent)

            await page.close()

            return extractLocation(bodyContent)
        }
        
        

        
    } catch (error) {
        console.log("Error in get Location: " + error)
        return "null"
    }
}

const extractLocation = (text) => {
    const locationPatterns = [
                // 1. Mẫu "in [City, Country]"
                /\bin\s([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 2. Mẫu "[City, Country] [dates]"
                /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)\s+(?:\d{1,2}\s*-\s*\d{1,2}|[a-zA-Z]+)\s+\d{4}/g,
                
                // 3. Mẫu "[dates] - [City, Country]"
                /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}(?:\s+to\s+\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})?)\s*-\s*([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
                
                // 4. Mẫu "[City, Country]"
                /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
                
                // 5. Mẫu "at [City, Country]"
                /\bat\s([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
                
                // 6. Mẫu "held in [City, Country]"
                /\bheld\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
                
                // 7. Mẫu "The [Title] Conference at [City, Country]"
                /\b(?:The\s+\w+\s+Conference|Symposium|Workshop)\s+(?:on|at)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
            
                // 8. Mẫu: "The [Title] Conference on [dates] in [City, Country]"
                /\b(?:The\s+\w+\s+Conference|Symposium|Workshop)\s+(?:on|at)\s+(?:\d{1,2}\s+\w+\s+\d{4}(?:\s+to\s+\d{1,2}\s+\w+\s+\d{4})?)\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 9. Mẫu "at the [City, Country]"
                /\bat\s+the\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
                
                // 10. Mẫu "located in [City, Country]"
                /\blocated\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 11. Mẫu "[City, Country] where [event details]"
                /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)\s+where\s+\w+/g,
        
                // 12. Mẫu "held at [City, Country]"
                /\bheld\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 13. Mẫu "conducted in [City, Country]"
                /\bconducted\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 14. Mẫu "organized at [City, Country]"
                /\borganized\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 15. Mẫu "taking place in [City, Country]"
                /\btaking\s+place\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 16. Mẫu "in the city of [City, Country]"
                /\bin\s+the\s+city\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 17. Mẫu "at the venue in [City, Country]"
                /\bat\s+the\s+venue\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 18. Mẫu "to be held in [City, Country]"
                /\bto\s+be\s+held\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 19. Mẫu "held at the [City, Country]"
                /\bheld\s+at\s+the\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 20. Mẫu "hosted in [City, Country]"
                /\bhosted\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 21. Mẫu "in the region of [City, Country]"
                /\bin\s+the\s+region\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 22. Mẫu "in the area of [City, Country]"
                /\bin\s+the\s+area\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 23. Mẫu "held in the city of [City, Country]"
                /\bheld\s+in\s+the\s+city\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 24. Mẫu "hosted at [City, Country]"
                /\bhosted\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 25. Mẫu "organized in [City, Country]"
                /\borganized\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 26. Mẫu "conference in [City, Country]"
                /\bconference\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 27. Mẫu "workshop in [City, Country]"
                /\bworkshop\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 28. Mẫu "symposium in [City, Country]"
                /\bsymposium\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 29. Mẫu "forum in [City, Country]"
                /\bforum\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 30. Mẫu "summit in [City, Country]"
                /\bsummit\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 31. Mẫu "colloquium in [City, Country]"
                /\bcolloquium\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 32. Mẫu "held at the venue in [City, Country]"
                /\bheld\s+at\s+the\s+venue\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 33. Mẫu "held in [City, Country] on [dates]"
                /\bheld\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)\s+on\s+\d{1,2}\s+\w+\s+\d{4}/g,
        
                // 34. Mẫu "held at [City, Country] on [dates]"
                /\bheld\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)\s+on\s+\d{1,2}\s+\w+\s+\d{4}/g,
        
                // 35. Mẫu "taking place at [City, Country]"
                /\btaking\s+place\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 36. Mẫu "hosted in the city of [City, Country]"
                /\bhosted\s+in\s+the\s+city\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 37. Mẫu "held in the area of [City, Country]"
                /\bheld\s+in\s+the\s+area\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 38. Mẫu "located at [City, Country]"
                /\blocated\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 39. Mẫu "held in the region of [City, Country]"
                /\bheld\s+in\s+the\s+region\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 40. Mẫu "taking place in the city of [City, Country]"
                /\btaking\s+place\s+in\s+the\s+city\s+of\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 41. Mẫu "to be conducted in [City, Country]"
                /\bto\s+be\s+conducted\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 42. Mẫu "to be organized at [City, Country]"
                /\bto\s+be\s+organized\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 43. Mẫu "to be hosted in [City, Country]"
                /\bto\s+be\s+hosted\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 44. Mẫu "to be held at [City, Country]"
                /\bto\s+be\s+held\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 45. Mẫu "to be organized in [City, Country]"
                /\bto\s+be\s+organized\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 46. Mẫu "scheduled to be held in [City, Country]"
                /\bscheduled\s+to\s+be\s+held\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 47. Mẫu "scheduled to be held at [City, Country]"
                /\bscheduled\s+to\s+be\s+held\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 48. Mẫu "to be hosted at [City, Country]"
                /\bto\s+be\s+hosted\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 49. Mẫu "scheduled in [City, Country]"
                /\bscheduled\s+in\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
        
                // 50. Mẫu "scheduled at [City, Country]"
                /\bscheduled\s+at\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
    ];

    for (const pattern of locationPatterns) {
        const match = pattern.exec(text);
        if (match) {
            return match[1];
        }
    }

    return 'null';
};



module.exports = {
    getLocation,
};
