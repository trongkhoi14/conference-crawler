
/*
Text lấy được từ banner 

Lấy title input --> slice ra từ chữ conference on/of/... về sau

Sau đó cắt bỏ ngày tháng

*/

const getLocation = async (browser, title, link) => {
    try {
        console.log(">> Getting conference date from: " + link);

        let page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });

        const bodyContent = await page.evaluate(() => {
            const head = Array.from(document.querySelectorAll(".head"));
            if(head.length > 0) {
                return head[0].innerText
            }
            return document.body.innerText;
        });

        console.log(bodyContent)
        const text3 = "The Fourteenth International Conference on Advanced Communications and Computation April 14, 2024 to April 18, 2024 - Venice, Italy";
        
        return extractLocation(bodyContent)
    } catch (error) {
        console.log("Error in get Location: " + error)
    }
}

const extractLocation = (text) => {
    // Mẫu biểu thức chính quy để tìm địa điểm
    const locationPatterns = [
        // Mẫu "in [City, Country]"
        /\bin\s([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g, 
        
        // Mẫu "[City, Country] [dates]"
        /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)\s+(?:\d{1,2}\s*-\s*\d{1,2}|[a-zA-Z]+)\s+\d{4}/g, 
        
        // // Mẫu "[dates] - [City, Country]"
        /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}(?:\s+to\s+\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})?)\s*-\s*([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g, 
        
        // Mẫu "[City, Country]"
        /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*,\s[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g,
    ];

    for (const pattern of locationPatterns) {
        const match = pattern.exec(text);
        if (match) {
            return match[1];
        }
    }

    return 'Location not found';
};

module.exports = {
    getLocation,
};
