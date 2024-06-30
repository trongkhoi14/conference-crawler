const {
    readKeywordsFromDict,
    readRoundkeysFromDict,
} = require("../services/web-scraper-service");
const webScraperService = require("../services/web-scraper-service");
const { convertImageToText } = require("../untils/convert");
const listConfHasDateBeforeKeyword = require("../config/listConferenceHasDateBeforeKeyword");
const dateFinder = require("datefinder");
const { listenerCount } = require("../models/conference-model");

let unwantedSelectors = [
    "s",
    "del",
    "strike",
    "button",
    ".cancel",
    ".title",
    ".tachado",
    ".text-tachado",
    "*[style*='text-decoration: line-through']",
    "*[style*='text-decoration:line-through']",
];

const listHasKeyRound = [
    "conferences.sigcomm.org/co-next/2024",
    "documentengineering.org",
    "sigsac.org/ccs/CCS2024",
    "ic3k.scitevents.org",
    "cscw.acm.org/2024",
    "2024.sigmod.org",
    "group.acm.org/conferences",
    "documentengineering.org/doceng2024",
    "eics.acm.org/2024",
    "csf2024.ieee-security.org",
    "sp2024.ieee-security.org",
    "wp.nyu.edu/acns2024",
    "collaboratecom.eai-conferences.org/2024/",
    "chira.scitevents.org",
    "icde2024.github.io",
    "icinco.scitevents.org",
    "keod.scitevents.org",
    "icmla-conference.org/icmla24",
    "webist.scitevents.org",
    "ijcci.scitevents.org",
    "scitevents.org",
    "usenix.org/conference/nsdi24",
    "sss2024.github.io",
    "usenix.org/conference/usenixsecurity24",
    "apweb2024.zjnu.edu.cn",
    "ches.iacr.org",
    "iiis2024.org/wmsci/website"
];

const hasRoundKey = (link) => {
    return listHasKeyRound.some((domain) => {
        return link.includes(domain);
    });
};

const getImportantDates = async (browser, link) => {
    try {
        console.log(">> Getting important date from: " + link);

        let {
            submissionDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords,
        } = readKeywordsFromDict();

        let roundKeys = [];

        if (hasRoundKey(link)) {
            roundKeys = readRoundkeysFromDict();
        }

        // Ngoại lệ
        if (link.includes("sensys.acm.org")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "Papers Due"
            );
            notificationDate_keywords = notificationDate_keywords.filter(
                (k) => k !== "Paper Notification" && k !== "Camera Ready"
            );
            cameraReady_keywords = cameraReady_keywords.filter(
                (k) => k !== "Camera Ready"
            );
        }
        if (link.includes("group.acm.org/conferences/group25")) {
            roundKeys = roundKeys.filter(
                (r) =>
                    r !== "2nd Round" &&
                    !r.toLowerCase().includes("research paper")
            );
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "Doctoral Consortium Deadline"
            );
            unwantedSelectors.push("h1");
        }
        if (link.includes("sigmobile.org/mobihoc/2024/")) {
            unwantedSelectors = unwantedSelectors.filter((s) => s != "del");
        }
        if (link.includes("uist.acm.org/2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "Submission deadline"
            );
            notificationDate_keywords = notificationDate_keywords.filter(k => k != "Acceptance notification")
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            bodyContent = bodyContent.replace("incl. title, abstract, author list", "")
            bodyContent = bodyContent.replace("incl. videos, supplementary materials, accessibility alt-text and video subtitles", "")
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("aiccsa.net/AICCSA2024/")) {
            notificationDate_keywords = notificationDate_keywords.filter(
                (k) => k !== "Notification of acceptance"
            );
        }
        if (link.includes("pstnet.ca/pst2024/")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "Paper Submission"
            );
            notificationDate_keywords = notificationDate_keywords.filter(
                (k) => !k.toLowerCase().includes("acceptance")
            );
            cameraReady_keywords = cameraReady_keywords.filter(
                (k) => k !== "Camera-Ready"
            );
        }
        if (link.includes("2024.sigdial")) {
            unwantedSelectors = unwantedSelectors.filter((s) => s !== "s");
        }
        if (link.includes("aspdac.com/aspdac2024")) {
            let page = await browser.newPage();

            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.waitForSelector("#navcontainer");

            let bodyContent = await clickAndReload(page, "call");

            let submissionDateCounts = countKeywords(
                bodyContent,
                submissionDate_keywords
            );
            let notificationDateCounts = countKeywords(
                bodyContent,
                notificationDate_keywords
            );
            let cameraReadyDateCounts = countKeywords(
                bodyContent,
                cameraReady_keywords
            );

            if (
                hasAllImportantDates(
                    submissionDateCounts,
                    notificationDateCounts,
                    cameraReadyDateCounts
                )
            ) {
                return await processImportantDates(
                    link,
                    page,
                    bodyContent,
                    submissionDate_keywords,
                    notificationDate_keywords,
                    cameraReady_keywords,
                    roundKeys
                );
            }
        }
        if (link.includes("apbjc.asia")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => !k.toLowerCase().includes("abstract")
            );
            cameraReady_keywords = cameraReady_keywords.filter(
                (k) => k !== "Early bird registration"
            );
            let page = await browser.newPage();

            await page.goto(link, { waitUntil: "domcontentloaded" });

            let bodyContent = await clickAndReload(page, "date");

            let submissionDateCounts = countKeywords(
                bodyContent,
                submissionDate_keywords
            );
            let notificationDateCounts = countKeywords(
                bodyContent,
                notificationDate_keywords
            );
            let cameraReadyDateCounts = countKeywords(
                bodyContent,
                cameraReady_keywords
            );

            if (
                hasImportantDates(
                    submissionDateCounts,
                    notificationDateCounts,
                    cameraReadyDateCounts
                )
            ) {
                return await processImportantDates(
                    link,
                    page,
                    bodyContent,
                    submissionDate_keywords,
                    notificationDate_keywords,
                    cameraReady_keywords,
                    roundKeys
                );
            }
        }
        if (link.includes("apnoms.org")) {
            let page = await browser.newPage();

            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.waitForSelector("#menu");
            let bodyContent = await clickAndReload(page, "call");

            let submissionDateCounts = countKeywords(
                bodyContent,
                submissionDate_keywords
            );
            let notificationDateCounts = countKeywords(
                bodyContent,
                notificationDate_keywords
            );
            let cameraReadyDateCounts = countKeywords(
                bodyContent,
                cameraReady_keywords
            );

            if (
                hasAllImportantDates(
                    submissionDateCounts,
                    notificationDateCounts,
                    cameraReadyDateCounts
                )
            ) {
                return await processImportantDates(
                    link,
                    page,
                    bodyContent,
                    submissionDate_keywords,
                    notificationDate_keywords,
                    cameraReady_keywords,
                    roundKeys
                );
            }
        }
        if (link.includes("researchr.org/track/ase-2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) =>
                    k !== "full paper submission" && k !== "abstract submission"
            );
        }
        if (link.includes("bmvc2024.org")) {
            notificationDate_keywords = notificationDate_keywords.filter(
                (k) => k !== "Decisions"
            );
        }
        if (link.includes("amtaweb.org/amta-2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "The submission deadline"
            );
        }
        if (link.includes("paclic2023.github.io")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "Early registration deadline"
            );
        }
        if (link.includes("scn.unisa.it/scn24")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "Submissions"
            );
        }
        if (link.includes("2024.softcom.fesb")) {
            let page = await browser.newPage();

            await page.goto(link, { waitUntil: "domcontentloaded" });

            await page.evaluate(() => {
                const link = Array.from(document.querySelectorAll("a")).find(
                    (a) =>
                        a.innerText.toLowerCase().includes("about softcom 2024") ||
                        a.href.toLowerCase().includes("about softcom 2024")
                );
                if (link) link.click();
            })
            await page.waitForNavigation({ waitUntil: "domcontentloaded" });

            let bodyContent = await page.evaluate((unwantedSelectors) => {
                unwantedSelectors.forEach((selector) => {
                    document
                        .querySelectorAll(selector)
                        .forEach((element) => element.remove());
                });
                const insertSeparator = () => {
                    const allElements = document.querySelectorAll("br");
                    allElements.forEach((element) => {
                        const separator = document.createElement("div");
                        separator.innerText = "$".repeat(50);
                        element.insertAdjacentElement("beforebegin", separator);
                    });
                };
                insertSeparator();
                return document.body.innerText;
            }, unwantedSelectors)

            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("dese.ai/dese-2024/")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date"); 
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        
        }  
        if (link.includes("ds2024.isti.cnr.it")) {
            let page = await browser.newPage();

            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.goto("http://ds2024.isti.cnr.it/call/CfP-DS2024.html", { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        } 
        if (link.includes("eics.acm.org")) {
            unwantedSelectors = unwantedSelectors.filter(s => s !== "*[style*='text-decoration: line-through']")
        }
        if (link.includes("euroxr.org/conference-2024")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.goto("https://www.euroxr.org/calls-and-guidelines/scientific-track", { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("dsd-seaa.com")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Submission Deadline")
            cameraReady_keywords = cameraReady_keywords.filter(k => k !== "Early bird registration")
        }
        if (link.includes("fmcad.org")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "abstract submission")
        }
        if (link.includes("fsttcs.org.in/2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k != "full papers")
        }
        if (link.includes("sigplan.org/home/haskellsymp-2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Paper submission")
            cameraReady_keywords = cameraReady_keywords.filter(k => k !== "Camera-ready Deadline")
        }
        if (link.includes("2024.acmmm.org")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.goto("https://2024.acmmm.org/regular-papers", { waitUntil: "domcontentloaded" });
            await page.waitForSelector(".header")
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("icteri.org/icteri-2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "paper submission" && k !== "abstract submission")
            cameraReady_keywords = cameraReady_keywords.filter(k => k !== "camera-ready papers")
        }
        if (link.includes("ieeesmc2024.org")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Deadline")
            let page = await browser.newPage();
            await page.goto("https://www.ieeesmc2024.org/call-for-paper", { waitUntil: "domcontentloaded" });
            await page.waitForSelector(".container-fluid")
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("researchfora.net/event/index.php?id=2622743")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("waset.org/global-software-engineering-conference-in-august-2024-in-moscow")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Abstract Submission" && k !== "Submission")
        }
        if (link.includes("secon2023.ieee-secon.org")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "call");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("soca-ieee.org")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await page.evaluate((unwantedSelectors) => {
                unwantedSelectors.forEach((selector) => {
                    document
                        .querySelectorAll(selector)
                        .forEach((element) => element.remove());
                });
                const insertSeparator = () => {
                    const allElements = document.querySelectorAll("strong");
                    allElements.forEach((element) => {
                        const separator = document.createElement("div");
                        separator.innerText = "$".repeat(50);
                        element.insertAdjacentElement("beforebegin", separator);
                    });
                };
                insertSeparator();
                return document.body.innerText;
            }, unwantedSelectors)

            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("conf.researchr.org/track/icsme-2024")) {
            notificationDate_keywords = notificationDate_keywords.filter(k => k !== "Final notification")
            cameraReady_keywords = cameraReady_keywords.filter(k => k !== "Camera-ready submission")
        }
        if (link.includes("ipccc.org")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            const cfpLink = await findCallForPapersPDFLinks(page);
            let bodyContent = await convertImageToText(cfpLink[0])
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("vissoft.info")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "submission");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("stevens.edu/page-right-nav/cifer-conference-2024")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.goto("https://www.stevens.edu/page-basic/cifer-2024-call-for-papers", { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("researchr.org/track/vlhcc-2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "paper submission deadline")
        }
        if (link.includes("asonam.cpsc.ucalgary.ca/2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Full paper submissions" && !k.toLocaleLowerCase().includes("paper submission deadline"))
        }
        if (link.includes("ieeeismar.org")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Submission Deadline for" && k !== "Abstract Deadline" && k !== "Paper Submission Deadline")
        }
        if (link.includes("pro-ve-2024.sciencesconf.org")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await page.evaluate((unwantedSelectors) => {
                // Remove unwanted elements
                unwantedSelectors.forEach((selector) => {
                    document
                        .querySelectorAll(selector)
                        .forEach((element) => element.remove());
                });
        
                // Function to insert separator div
                const insertSeparator = (elements) => {
                    if (elements.length === 0) return;
        
                    const startSeparator = document.createElement("div");
                    startSeparator.innerText = "*".repeat(50);
                    elements[0].insertAdjacentElement("beforebegin", startSeparator);
        
                    elements.forEach((element, index) => {
                        if (index < elements.length) {
                            // Avoid inserting after the last element
                            const separator = document.createElement("div");
                            separator.innerText = "*".repeat(50);
                            element.insertAdjacentElement("afterend", separator);
                        }
                    });
                };
        
                const insertSeparatorBefore = (els) => {
                    if (els.length === 0) return;
        
                    els.forEach((element, index) => {
                        if (index < els.length) {
                            // Avoid inserting after the last element
                            const separator = document.createElement("div");
                            separator.innerText = "$".repeat(100);
                            element.insertAdjacentElement("beforebegin", separator);
                        }
                    });
                };
        
                // Function to insert $ separator before elements containing "important date"
                const insertImportantDateSeparator = () => {
                    const allElements = document.querySelectorAll("body *");
                    allElements.forEach((element) => {
                        if (
                            element.innerText &&
                            element.innerText.toLowerCase().includes("important date")
                        ) {
                            const separator = document.createElement("div");
                            separator.innerText = "$".repeat(50);
                            element.insertAdjacentElement("beforebegin", separator);
                        }
                    });
                };
        
                // Find and insert separators for li and tr elements
                const liElements = document.querySelectorAll("li");
                const trElements = document.querySelectorAll("tr");
                insertSeparator(liElements);
                insertSeparator(trElements);
                insertImportantDateSeparator();
        
                return document.body.innerText;
            }, unwantedSelectors);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("lamda.nju.edu.cn/ijclr24/")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("ispec2024.github.io/ISPEC2024")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });

            await page.waitForSelector("#authors")
            await page.evaluate(() => {
                link = Array.from(document.querySelectorAll("a")).find(
                    (a) =>
                        a.innerText.toLowerCase().includes("authors")
                );
                if (link) link.click();
            });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("ieee-itw2024.org")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "call");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("wp.nyu.edu/acns2024")) {
            roundKeys = roundKeys.filter(k => k !== "Spring" && k !== "Cycle 1")
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "paper submission" && k !== "Submissions")
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let  bodyContent = await clickAndReload(page, "call");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("aimsaconference.org")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Submission deadline (extended)")
        }
        if (link.includes("collaboratecom.eai-conferences.org")) {
            roundKeys = roundKeys.filter(k => k)
        }
        if (link.includes("soc.uum.edu.my/icoci")) {
            unwantedSelectors.push("br")
        }
        if (link.includes("confest2024.github.io")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Paper submission")
        }
        if (link.includes("https://rtcsa2024.github.io/")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.goto("https://rtcsa2024.github.io/?page=cfp.html", { waitUntil: "domcontentloaded" });
            await page.waitForSelector(".header-container")
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("utwente.nl/en/eemcs/fois2024")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.goto("https://www.utwente.nl/en/eemcs/fois2024/calls/", { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("mobilehci.acm.org/2024")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.goto("https://mobilehci.acm.org/2024/callforpapers.php", { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("waset.org/image-analysis-and-recognition-conference-in-november-2024-in-bangkok")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });

            // await page.waitForSelector("#authors")
            await page.evaluate(() => {
                link = Array.from(document.querySelectorAll("a")).find(
                    (a) =>
                        a.innerText.toLowerCase().includes("date")
                );
                if (link) link.click();
            });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("keod.scitevents.org")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("icmlc.com/ICMLC")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("icmv.org/")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            bodyContent = bodyContent.substring(bodyContent.indexOf("Important Date"), bodyContent.indexOf("Important Date") + 200)
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("cods-comad.in")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "call");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("icseng.pl")) {

            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.waitForSelector(".elementor-element-7724f28")
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("kr.org/KR2024")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            bodyContent = bodyContent.substring(bodyContent.indexOf("Main Track"), bodyContent.indexOf("Main Track") + 500)
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("waset.org/")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            await page.evaluate(() => {
                link = Array.from(document.querySelectorAll("a")).find(
                    (a) =>
                        a.innerText.toLowerCase().includes("date")
                );
                if (link) link.click();
            });
            await page.waitForSelector("table")
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("cwi.nl/en/groups/networks-and-optimization/events/sagt-2024")) {
            notificationDate_keywords = notificationDate_keywords.filter(k => k !== "author notification" && k !== "notification")
        }
        if (link.includes("synasc.ro")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("isvc.net")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "paper submission deadline")
        }
        if (link.includes("wisa.or.kr")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "call");
            await page.waitForSelector(".content")
            console.log(bodyContent)
            const cfpLink = await findCallForPapersPDFLinks(page);
            console.log(cfpLink)
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("conferences.sigcomm.org/imc/2024/")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "call");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("caine-conf.org")) {
            let page = await browser.newPage();
            await page.goto("https://www.caine-conf.org/main/cfp/", { waitUntil: "domcontentloaded" });
            const cfpLink = await findCallForPapersPDFLinks(page);
            console.log(cfpLink)
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("jelia2023.inf.tu-dresden.de")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("nordichi2024.se")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "papers");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("pg2024.hsu.edu.cn")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
            while(bodyContent.includes("$$")) {
                bodyContent = bodyContent.replace("$$", "")
            }
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("usenix.org/conference/nsdi24")) {
            roundKeys = roundKeys.filter(k => k !== "Spring" && k !== "Fall")
        }
        if (link.includes("usenix.org/conference/usenixsecurity24")) {
            roundKeys = roundKeys.filter(k => k !== "Winter" && k !== "Fall" && k !== "Summer")
        }
        if (link.includes("fdtc.deib.polimi.it/FDTC24")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "Submission deadline")
        }
        if (link.includes("cyprusconferences.org")) {
            submissionDate_keywords = submissionDate_keywords.filter(k => k !== "paper submission deadline")
        }
        if (link.includes("iiwas.org/conferences/iiwas2024/")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("cisisconference.eu")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "date");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
        if (link.includes("conferences.sigcomm.org/co-next/2024")) {
            unwantedSelectors = unwantedSelectors.filter(s => s !== "strike")
        }
        if (link.includes("dsaa2024.dsaa.co")) {
            let page = await browser.newPage();
            await page.goto(link, { waitUntil: "domcontentloaded" });
            let bodyContent = await clickAndReload(page, "call");
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }
            
       
        

        //-------------------------------------

        let page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });

        // Go to home site

        let bodyContent = await getContentAndRemoveUnwantedSelectors(page);
        // console.log(bodyContent);
        let submissionDateCounts = countKeywords(
            bodyContent,
            submissionDate_keywords
        );
        let notificationDateCounts = countKeywords(
            bodyContent,
            notificationDate_keywords
        );
        let cameraReadyDateCounts = countKeywords(
            bodyContent,
            cameraReady_keywords
        );

        if (
            hasAllImportantDates(
                submissionDateCounts,
                notificationDateCounts,
                cameraReadyDateCounts
            )
        ) {
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }

        // Go to call for paper site

        bodyContent = await clickAndReload(page, "call");

        submissionDateCounts = countKeywords(
            bodyContent,
            submissionDate_keywords
        );
        notificationDateCounts = countKeywords(
            bodyContent,
            notificationDate_keywords
        );
        cameraReadyDateCounts = countKeywords(
            bodyContent,
            cameraReady_keywords
        );

        if (
            hasAllImportantDates(
                submissionDateCounts,
                notificationDateCounts,
                cameraReadyDateCounts
            )
        ) {
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }

        // Go to imp date site

        bodyContent = await clickAndReload(page, "date");

        submissionDateCounts = countKeywords(
            bodyContent,
            submissionDate_keywords
        );
        notificationDateCounts = countKeywords(
            bodyContent,
            notificationDate_keywords
        );
        cameraReadyDateCounts = countKeywords(
            bodyContent,
            cameraReady_keywords
        );

        if (
            hasAllImportantDates(
                submissionDateCounts,
                notificationDateCounts,
                cameraReadyDateCounts
            )
        ) {
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }

        // Trường hợp không tìm được imp date trong trang chủ lẫn các site con --> phải tìm pdf của cfp

        // await page.goto(link, { waitUntil: "domcontentloaded" });
        // bodyContent = await getContentAndRemoveUnwantedSelectors(page)
        // const cfpLinks = await findCallForPapersPDFLinks(page);

        // console.log('Found Call for Papers links:', cfpLinks);
        // await page.close();

        // Trường hợp không tìm được đầy đủ thông tin
        // Phải giảm điều kiện xuống, chỉ cần sub với noti

        await page.goto(link, { waitUntil: "domcontentloaded" });
        bodyContent = await getContentAndRemoveUnwantedSelectors(page);

        // console.log(bodyContent)

        submissionDateCounts = countKeywords(
            bodyContent,
            submissionDate_keywords
        );
        notificationDateCounts = countKeywords(
            bodyContent,
            notificationDate_keywords
        );
        cameraReadyDateCounts = countKeywords(
            bodyContent,
            cameraReady_keywords
        );

        if (
            hasImportantDates(
                submissionDateCounts,
                notificationDateCounts,
                cameraReadyDateCounts
            )
        ) {
            return await processImportantDates(
                link,
                page,
                bodyContent,
                submissionDate_keywords,
                notificationDate_keywords,
                cameraReady_keywords,
                roundKeys
            );
        }

        console.log("Important dates not found for link: " + link);
        return null;
    } catch (error) {
        // await page.close();
        console.log("Error in getImportantDates rule: " + error);
        
    }
};

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

const countKeywords = (content, keywords) => {
    const counts = {};
    for (const keyword of keywords) {
        let shouldCount = true;
        for (let existingKeyword in counts) {
            existingKeyword = existingKeyword.toLowerCase();
            if (
                existingKeyword.includes(keyword.toLowerCase()) &&
                !content.includes(keyword + ":")
            ) {
                shouldCount = false;
                break;
            }
        }

        // if(keyword == "All tracks (full paper, LB, WiP, Special Session): Camera ready") {
        //     shouldCount = true;
        //     counts[keyword] = 1;
        // }

        if (!shouldCount) continue;

        const escapedKeyword = escapeRegExp(keyword);
        const regex = new RegExp(escapedKeyword, "g");
        const matches = content.match(regex);
        if (matches) counts[keyword] = matches.length;
    }
    return counts;
};

const findClosestRoundKeys = (content, keyword, roundKeys) => {
    let subContent = content;
    while (subContent.includes("**")) {
        subContent = subContent.replace("**", "");
    }
    
    const keywordRegex = new RegExp(keyword, "g");
    let match;
    let closestRoundKeys = new Set();

    while ((match = keywordRegex.exec(subContent)) !== null) {
        const keywordIndex = match.index;

        for (const roundKey of roundKeys) {
            // Case khó
            if (
                roundKey === "JULY 2023 CYCLE" ||
                roundKey === "JANUARY 2024 CYCLE"
            ) {
                closestRoundKeys.add(roundKey);
            } else {
                const escapedRoundKey = escapeRegExp(roundKey);
                const roundKeyRegex = new RegExp(escapedRoundKey, "g");
                let roundMatch;

                while ((roundMatch = roundKeyRegex.exec(subContent)) !== null) {
                    const roundKeyIndex = roundMatch.index;

                    if (
                        Math.abs(keywordIndex - roundKeyIndex) < 500 &&
                        Math.abs(keywordIndex - roundKeyIndex) !== 0 &&
                        roundKeyIndex < keywordIndex
                    ) {
                        closestRoundKeys.add(roundKey);
                    }
                }
            }
        }
    }

    return Array.from(closestRoundKeys);
};

const hasAllImportantDates = (
    submissionCounts,
    notificationCounts,
    cameraReadyCounts
) => {
    return (
        Object.keys(submissionCounts).length > 0 &&
        Object.keys(notificationCounts).length > 0 &&
        Object.keys(cameraReadyCounts).length > 0
    );
};

const hasImportantDates = (
    submissionCounts,
    notificationCounts,
    cameraReadyCounts
) => {
    return (
        (Object.keys(submissionCounts).length > 0 &&
        Object.keys(notificationCounts).length > 0) ||
        ( Object.keys(notificationCounts).length > 0 &&
        Object.keys(cameraReadyCounts).length > 0)
    );
};

const getContentAndRemoveUnwantedSelectors = async (page) => {
    return await page.evaluate((unwantedSelectors) => {
        // Remove unwanted elements
        unwantedSelectors.forEach((selector) => {
            document
                .querySelectorAll(selector)
                .forEach((element) => element.remove());
        });

        // Function to insert separator div
        const insertSeparator = (elements) => {
            if (elements.length === 0) return;

            const startSeparator = document.createElement("div");
            startSeparator.innerText = "*".repeat(50);
            elements[0].insertAdjacentElement("beforebegin", startSeparator);

            elements.forEach((element, index) => {
                if (index < elements.length) {
                    // Avoid inserting after the last element
                    const separator = document.createElement("div");
                    separator.innerText = "*".repeat(50);
                    element.insertAdjacentElement("afterend", separator);
                }
            });
        };

        const insertSeparatorBefore = (els) => {
            if (els.length === 0) return;

            els.forEach((element, index) => {
                if (index < els.length) {
                    // Avoid inserting after the last element
                    const separator = document.createElement("div");
                    separator.innerText = "$".repeat(100);
                    element.insertAdjacentElement("beforebegin", separator);
                }
            });
        };

        // Function to insert $ separator before elements containing "important date"
        const insertImportantDateSeparator = () => {
            const allElements = document.querySelectorAll("body *");
            allElements.forEach((element) => {
                if (
                    element.innerText &&
                    element.innerText.toLowerCase().includes("important date")
                ) {
                    const separator = document.createElement("div");
                    separator.innerText = "$".repeat(50);
                    element.insertAdjacentElement("beforebegin", separator);
                }
            });
        };

        // Find and insert separators for li and tr elements
        const liElements = document.querySelectorAll("li");
        const trElements = document.querySelectorAll("tr");
        const aElements = document.querySelectorAll("a");
        const specialElement = document.querySelectorAll("div[class*='blk']")
        insertSeparator(liElements);
        insertSeparator(trElements);
        insertSeparator(specialElement)
        insertSeparatorBefore(aElements);
        insertImportantDateSeparator();

        return document.body.innerText;
    }, unwantedSelectors);
};

const clickAndReload = async (page, text) => {
    try {
        await page.evaluate((text) => {
            //Full Papers, Call for Participation, call-for-submissions

            //ngoài tìm link có date, còn có thể tìm 'sub'
            const priorityTexts = ["MAIN-TRACK PAPERS", "call for paper", "main track", "Research Papers", "Research Track"];
            
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

        let bodyContent = await getContentAndRemoveUnwantedSelectors(page);

        return bodyContent;
    } catch (error) {
        return "";
    }
};

const filterKey = (keywordData, submissionDate_keywords) => {
    const filteredKeywords = [];
    for (let i = 0; i < keywordData.length; i++) {
        let shouldAdd = true;
        let keywordi = keywordData[i].keyword;
        if (keywordi.includes(" - ")) {
            keywordi = keywordi.split(" - ")[1].toLowerCase();
        }
        for (let j = 0; j < keywordData.length; j++) {
            let keywordj = keywordData[j].keyword;

            if (keywordj.includes(" - ")) {
                keywordj = keywordj.split(" - ")[1].toLowerCase();
            }
            if (
                i !== j &&
                keywordj.includes(keywordi) &&
                keywordi !== keywordj
            ) {
                shouldAdd = false;
                break;
            }
        }
        if (shouldAdd) filteredKeywords.push(keywordData[i].keyword);
    }

    let result = [];
    // console.log(filteredKeywords);
    for (let i = 0; i < filteredKeywords.length; i++) {
        let shouldAdd = true;
        for (let j = 0; j < filteredKeywords.length; j++) {
            if (
                i !== j &&
                (filteredKeywords[j].includes(filteredKeywords[i]) ||
                    filteredKeywords[j]
                        .toLowerCase()
                        .includes(
                            filteredKeywords[i].slice(0, -1).toLowerCase()
                        ))
            ) {
                shouldAdd = false;
                break;
            }
        }
        if (
            shouldAdd &&
            submissionDate_keywords.some((keyword) => {
                if (filteredKeywords[i].includes(" - ")) {
                    return filteredKeywords[i].split(" - ")[1] === keyword;
                }
                return filteredKeywords[i] === keyword;
            }) &&
            !filteredKeywords[i]
                .split(" - ")[0]
                .includes(filteredKeywords[i].split(" - ")[1])
        ) {
            result.push(filteredKeywords[i]);
        }
    }

    return result;
};

const combineKeywordsWithRoundKeys = (
    keywordCounts,
    roundKeys,
    bodyContent
) => {
    const result = [];
    for (const [keyword, count] of Object.entries(keywordCounts)) {
        const closestRoundKeys = findClosestRoundKeys(
            bodyContent,
            keyword,
            roundKeys
        );
        if (closestRoundKeys.length > 0) {
            closestRoundKeys.forEach((roundKey) => {
                result.push({
                    keyword: `${roundKey} - ${keyword}`,
                    count,
                });
            });
        } else {
            result.push({ keyword, count });
        }
    }
    return result;
};

const processImportantDates = async (
    link,
    page,
    bodyContent,
    submissionDate_keywords,
    notificationDate_keywords,
    cameraReady_keywords,
    roundKeys
) => {
    let submissionDate = [];
    let notificationDate = [];
    let cameraReady = [];

    const submissionDateCounts = countKeywords(
        bodyContent,
        submissionDate_keywords
    );
    const notificationDateCounts = countKeywords(
        bodyContent,
        notificationDate_keywords
    );
    const cameraReadyDateCounts = countKeywords(
        bodyContent,
        cameraReady_keywords
    );

    const result = [];
    result.push(
        ...combineKeywordsWithRoundKeys(
            submissionDateCounts,
            roundKeys,
            bodyContent
        )
    );
    result.push(
        ...combineKeywordsWithRoundKeys(
            notificationDateCounts,
            roundKeys,
            bodyContent
        )
    );
    result.push(
        ...combineKeywordsWithRoundKeys(
            cameraReadyDateCounts,
            roundKeys,
            bodyContent
        )
    );
    // console.log(result)
    let PositionDateBeforeKeyword = isPositionDateBeforeKeyword(
        link,
        bodyContent
    );

    let subFilteredKey = filterKey(result, submissionDate_keywords);
    let notiFilteredKey = filterKey(result, notificationDate_keywords);
    let camFilteredKey = filterKey(result, cameraReady_keywords);

    let snapshotRange = 50
    if (link.includes("fm24.polimi.it")) {
        subFilteredKey.push("Abstract Submission")
    }
    if (link.includes("vrst.hosting.acm.org/vrst2024")) {
        notiFilteredKey.push("Author Notification for Papers");
    }
    if (link.includes("accv2024.org")) {
        PositionDateBeforeKeyword = false;
        subFilteredKey.push("Paper submission deadline");
    }
    if (link.includes("caadria2024.org")) {
        subFilteredKey.push("Open Call");
        subFilteredKey.push("Submission Deadline");
    }
    if (link.includes("2024.fedcsis.org")) {
        subFilteredKey.push("Paper submission");
    }
    if (link.includes("ieeevis.org/year/2024")) {
        subFilteredKey.push("Paper submission")
    }
    if (link.includes("icvs2023.conf.tuwien.ac.at")) {
        snapshotRange = 30
    }
    if (link.includes("dublincore.org/conferences")) {
        snapshotRange = 80
    }
    if (link.includes("isita.ieice.org")) {
        subFilteredKey.push("Paper Submission Deadline")
    }
    if (link.includes("scitevents.org")) {
        subFilteredKey = subFilteredKey.filter(k => k !== "Position Papers - Abstract Submission")
    }
    if (link.includes("attend.ieee.org/mmsp-2024")) {
        subFilteredKey.push("Paper Submission")
    }
    if (link.includes("conferences.sigcomm.org/imc/2024")) {
        notiFilteredKey.push("Notification")
    }
    if (link.includes("crises-deim.urv.cat/psd2024")) {
        subFilteredKey.push("Submission deadline")
        notiFilteredKey.push("Acceptance notification")
        camFilteredKey.push("Proceedings version due")
    }
    if (link.includes("2024.splc.net")) {
        notiFilteredKey.push("Notification")
    }
    if (link.includes("vecos-world.org")) {
        snapshotRange = 20
    }
    if (link.includes("ches.iacr.org")) {
        while(bodyContent.includes("$$")) {
            bodyContent = bodyContent.replace("$$", "")
        }
    }
 
    await webScraperService.extractDatesFromBody(
        PositionDateBeforeKeyword,
        subFilteredKey,
        bodyContent,
        submissionDate,
        snapshotRange
    );

    await webScraperService.extractDatesFromBody(
        PositionDateBeforeKeyword,
        notiFilteredKey,
        bodyContent,
        notificationDate,
        snapshotRange
    );

    await webScraperService.extractDatesFromBody(
        PositionDateBeforeKeyword,
        camFilteredKey,
        bodyContent,
        cameraReady,
        snapshotRange
    );

    await page.close();
    return { submissionDate, notificationDate, cameraReady };
};

// Nếu từ chữ important date đến ngày trước thì ngày đứng trước key, và ngược lại
const isPositionDateBeforeKeyword = (link, bodyContent) => {
    if (link.includes("eccv.ecva.net")) {
        return false
    }
    if (link.includes("iiwas.org/conferences/iiwas2024/")) {
        return false
    }
    if (link.includes("conferences.miccai.org")) {
        return false
    }
    if (link.includes("isvc.net")) {
        return false
    }
    if(link.includes("ieee-smart-world.org")) {
        return false
    }
    if(link.includes("hpcn.exeter.ac.uk/trustcom2023")) {
        return false
    }
    if(link.includes("tapconference.github.io")) {
        return true
    }
    if(link.includes("sinconf.org/sin2024")) {
        return false
    }
    if(link.includes("iclp24.utdallas.edu")) {
        return false
    }
    if(link.includes("iiwas.org/conferences/momm2024")) {
        return true
    }
    if(link.includes("acii-conf.net")) {
        return false
    }
    if(link.includes("cloudcom2024.org")) {
        return false
    }
    if (listConfHasDateBeforeKeyword.some((domain) => {
            return link.includes(domain);
        })
    ) {
        return true;
    }

    const {
        submissionDate_keywords,
        notificationDate_keywords,
        cameraReady_keywords,
    } = readKeywordsFromDict();

    if (bodyContent.toLowerCase().includes("important dates")) {
        let subBodyContent = bodyContent.substring(
            bodyContent.toLowerCase().indexOf("important dates"),
            bodyContent.length
        );
        let indexOfFirstKey = 0;
        for (let i = 0; i < submissionDate_keywords.length; i++) {
            if (subBodyContent.includes(submissionDate_keywords[i])) {
                let indexCurrentKey = subBodyContent.indexOf(
                    submissionDate_keywords[i]
                );

                if (indexCurrentKey < indexOfFirstKey || indexOfFirstKey == 0) {
                    indexOfFirstKey = indexCurrentKey;
                }
            }
        }
        let indexOfFirstDate = dateFinder(subBodyContent)[0]?.startIndex;
        // console.log(indexOfFirstDate);
        // console.log(indexOfFirstKey);
        if (indexOfFirstDate < indexOfFirstKey) {
            return true;
        } else {
            return false;
        }
    }
};

const findCallForPapersPDFLinks = async (page) => {
    const links = await page.evaluate(() => {
        // Tìm tất cả các thẻ a và div
        const anchorTags = Array.from(document.querySelectorAll("a"));
        const iframeTags = Array.from(
            document.querySelectorAll("iframe[data-src]")
        );

        // Tìm các liên kết phù hợp trong thẻ a
        const cfpLinksFromAnchors = anchorTags
            .filter((anchor) => {
                const href = anchor.href.toLowerCase();
                return (
                    href.includes("call-for-papers") ||
                    ((href.toLocaleLowerCase().includes("cfp") ||
                        href.toLocaleLowerCase().includes("call")) &&
                        href.endsWith(".pdf")) ||
                    href.includes("drive.google.com") ||
                    href.includes("WISA")
                );
            })
            .map((anchor) => anchor.href);

        // Tìm các liên kết phù hợp trong thẻ div
        const cfpLinksFromDivs = iframeTags
            .filter((iframe) => {
                const dataSource = iframe
                    .getAttribute("data-src")
                    .toLowerCase();
                return dataSource.includes("drive.google.com");
            })
            .map((iframe) => iframe.getAttribute("data-src"));

        // Kết hợp các liên kết từ thẻ a và thẻ div
        return [...cfpLinksFromAnchors, ...cfpLinksFromDivs];
    });

    return links;
};

module.exports = {
    getImportantDates,
};
