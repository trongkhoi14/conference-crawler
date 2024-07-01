const type_offline = [
    "no hybrid mode",
    "offline",
    "face-to-face",
    "onsite participants"
]

const type_online = [
    "Virtual Conference", "Virtual Conference Venue", "only participating remotely"
];

const type_hybrid = [
    "remote", "hybrid", "virtual", "Face-to-Face Participation", "Virtual Participation", 
    "Online & In-person participation", "hybrid support", "allowed to present remotely",
    "online and face-to-face", "online participation options",
    "both online and onsite participants",
    "to be organized in hybrid",
    "an option to present remotely",
    "attend remotely",
    "Dual-Mode Conference",
    "option to attend remotely"
];

const getType = async (browser, link) => { 
    try {
        let page = await browser.newPage();
        await page.goto(link, {waitUntil: "domcontentloaded"});
        const bodyContent = await page.evaluate(() => {
            return document.body.innerText.toLowerCase();
        });
        const containsKeyword = (content, keywords) => {
            for (const keyword of keywords) {
                if (content.includes(keyword.toLowerCase())) {
                    return true;
                }
            }
            return false;
        };

        const isOnline = false;
        const isOffline = false;
        const isHybrid = false;
    
        let conferenceType = "not specified"; // Default value
        await page.close();
        // Kiểm tra nếu nội dung chứa từ khóa hybrid
        if (containsKeyword(bodyContent, type_hybrid)) {
            isHybrid = true
        }
    
        // Kiểm tra nếu nội dung chứa từ khóa online
        if (containsKeyword(bodyContent, type_online)) {
           isOnline = true
        }
        
        // Kiểm tra nếu nội dung chứa từ khóa offline
        if (containsKeyword(bodyContent, type_offline)) {
            isOffline = true
        }

        // Đi vào site: Call for Contributions
        
        if ((isOnline && isOffline) || isHybrid) {
            return "hybrid";
        } else if (isOnline) {
            return "online";
        } else {
            return "offline";
        } 


    
        // Đóng tab
        await page.close();
    
        return conferenceType;
    } catch (error) {
        return null
    }

    
}

module.exports = {
    getType,
};