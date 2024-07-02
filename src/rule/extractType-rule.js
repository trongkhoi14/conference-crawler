const type_offline = [
    "remote presentations are not allowed",
    "no hybrid mode",
    "offline",
    "face-to-face",
    "onsite participants",
    "in-person event only",
    "in person conference",
    "in-person conference",
    "present their work in person",
    "attend in person"
]

const type_online = [
    "online only participation option",
    "Virtual Conference", 
    "Virtual Conference Venue", 
    "only participating remotely",
    "Virtual Participation",
    "Remote attendance",
    "remote presentation",
    "online participation",
    "only remote",
    "remote", 
    "virtual", 

];

const type_hybrid = [
    "physical presence or virtual participation",
    "allowed to present remotely",
    // "Virtual Participation", 
    // "remote", "virtual", 
    // "Face-to-Face Participation",
    // "attend remotely",
    "Online & In-person participation", 
    "hybrid support", 
    "online and face-to-face", 
    "online participation options",
    "both online and onsite participants",
    "to be organized in hybrid",
    "an option to present remotely",
    "Dual-Mode Conference",
    "option to attend remotely",
    "hybrid"
];

const removeUnwantedKey = (content) => {
    let result = content
    const unwantedKey = [
        "Virtual Posters",
        "hybrid games",
        "Virtual Research Environments",
        "Hybrid Intelligence",
        "Virtual Personal Assistants",
        "May 2020, Virtual",
        "May 2021, Virtual",
        "May 2022, Virtual",
        "virtual humans",
        "hybrid systems",
        "virtual machines",
        "virtual machine",
        "may reassess the possibility for virtual or hybrid options",
        "virtualization technologies",
        "Hybrid Graphs",
        "Virtual Reality",
        "cancel the integrated virtual component",
        "hybrid AI systems",
        "virtual elements",
        "2022 - Virtual Conference",
        "2021 - Virtual Conference",
        "2020 - Virtual Conference",
        "innovative learning and teaching approach, which integrates the best of online and face-to-face experiences",
        "Real-time, hybrid, and cyber-physical systems",
        "remote presentations are not allowed",
        "virtual reality",
        "Operating systems and virtualization",
        "hybrid systems",
        "Virtual and Augmented Reality",
        "separate virtual volume",
        "Hybrid Approach for High-Performance Deep Learning",
        "Virtual Personal Assistants and Cognitive Experts",
        "Virtual, Mixed and Augmented Reality"
    ]
    for(key of unwantedKey) {
        while(result.toLowerCase().includes(key.toLowerCase())) {
            result = result.toLowerCase().replace(key.toLowerCase(), "")
        }
    }
    return result
}

const getType = async (browser, link) => {
    try {
        let page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });
        // Evaluate the body content
        // let bodyContent = await page.evaluate(() => document.body.innerText.toLowerCase());
        let bodyContent = await page.content()
        bodyContent = removeUnwantedKey(bodyContent)
        console.log(bodyContent)
        const containsKeyword = (content, keywords) => {
            for (const keyword of keywords) {
                if (content.includes(keyword.toLowerCase())) {
                    console.log(`Found keyword: ${keyword}`);
                    return true;
                }
            }
            return false;
        };

        let isOnline = false;
        let isOffline = false;
        let isHybrid = false;

        // Check initial content for keywords
        if (containsKeyword(bodyContent, type_hybrid)) {
            isHybrid = true;
        }
        if (containsKeyword(bodyContent, type_online)) {
            isOnline = true;
        }
        if (containsKeyword(bodyContent, type_offline)) {
            isOffline = true;
        }

        // Navigate to "Call for Contributions" or similar page and check again
        let callPageContent = await clickAndReload(page, "call");
        callPageContent = removeUnwantedKey(callPageContent)
        if (containsKeyword(callPageContent, type_hybrid)) {
            isHybrid = true;
        }
        if (containsKeyword(callPageContent, type_online)) {
            isOnline = true;
        }
        if (containsKeyword(callPageContent, type_offline)) {
            isOffline = true;
        }

        await page.close();

        if ((isOnline && isOffline) || isHybrid) {
            return "hybrid";
        } else if (isOnline) {
            return "online";
        } else {
            return "offline";
        }
    } catch (error) {
        console.error("Error in getType: ", error);
        return null;
    }
};

const clickAndReload = async (page, text) => {
    try {
        await page.evaluate((text) => {
            //Full Papers, Call for Participation, call-for-submissions

            //ngoài tìm link có date, còn có thể tìm 'sub'
            const priorityTexts = [
                "MAIN-TRACK PAPERS", 
                "call for paper", 
                "main track", 
                "Research Papers", 
                "Research Track",
                "Call for Contributions",
                "CFP"
            ];
            
            const findLink = (texts) => {
                for (const t of texts) {
                    const link = Array.from(document.querySelectorAll("a")).find(
                        (a) =>
                            a.innerText.toLowerCase().includes(t.toLowerCase()) ||
                            a.href.toLowerCase().includes(t.toLowerCase())
                    );
                    if (link) return link;
                }
                return null;
            };
            let link = null

            if(text == 'call') {
                link = findLink(priorityTexts);
            }

            if (!link) {
                link = Array.from(document.querySelectorAll("a")).find(
                    (a) =>
                        a.innerText.toLowerCase().includes(text.toLowerCase()) ||
                        a.href.toLowerCase().includes(text.toLowerCase())
                );
            }

            if (link) link.click();
        }, text);

        await page.waitForNavigation({ waitUntil: "domcontentloaded" });

        let bodyContent = page.evaluate(() => {
            return document.body.innerText;
        }, );

        return bodyContent;
    } catch (error) {
        return "";
    }
};

module.exports = {
    getType,
};