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
    "*[style*='text-decoration: line-through']",
];

const listHasKeyRound = [
    "documentengineering.org",
    "sigsac.org/ccs/CCS2024",
    "ic3k.scitevents.org",
    "cscw.acm.org/2024",
    "2024.sigmod.org",
    "group.acm.org/conferences",
    "documentengineering.org/doceng2024",
    "eics.acm.org/2024"
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
        if (link.includes("conf.researchr.org/track/apsec-2024")) {
            submissionDate_keywords = submissionDate_keywords.filter(
                (k) => k !== "Paper Deadline"
            );
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
    // console.log(subContent)
    const keywordRegex = new RegExp(keyword, "g");
    let match;
    let closestRoundKeys = new Set();

    while ((match = keywordRegex.exec(subContent)) !== null) {
        const keywordIndex = match.index;

        for (const roundKey of roundKeys) {
            // Case khó
            if (
                roundKey == "JULY 2023 CYCLE" ||
                roundKey == "JANUARY 2024 CYCLE"
            ) {
                closestRoundKeys.add(roundKey);
            } else {
                const roundKeyRegex = new RegExp(roundKey, "g");
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
        Object.keys(submissionCounts).length > 0 &&
        Object.keys(notificationCounts).length > 0
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
        insertSeparator(liElements);
        insertSeparator(trElements);
        insertSeparatorBefore(aElements);
        insertImportantDateSeparator();

        return document.body.innerText;
    }, unwantedSelectors);
};

const clickAndReload = async (page, text) => {
    try {
        await page.evaluate((text) => {
            const priorityTexts = ["MAIN-TRACK PAPERS", "call for paper"];
            
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

            let link = findLink(priorityTexts);

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
    console.log(filteredKeywords);
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

    await webScraperService.extractDatesFromBody(
        PositionDateBeforeKeyword,
        subFilteredKey,
        bodyContent,
        submissionDate,
        50
    );

    await webScraperService.extractDatesFromBody(
        PositionDateBeforeKeyword,
        notiFilteredKey,
        bodyContent,
        notificationDate,
        50
    );

    await webScraperService.extractDatesFromBody(
        PositionDateBeforeKeyword,
        camFilteredKey,
        bodyContent,
        cameraReady,
        50
    );

    // await page.close();
    return { submissionDate, notificationDate, cameraReady };
};

// Nếu từ chữ important date đến ngày trước thì ngày đứng trước key, và ngược lại
const isPositionDateBeforeKeyword = (link, bodyContent) => {
    if (
        listConfHasDateBeforeKeyword.some((domain) => {
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
        console.log(indexOfFirstDate);
        console.log(indexOfFirstKey);
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
                    href.includes("drive.google.com")
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
