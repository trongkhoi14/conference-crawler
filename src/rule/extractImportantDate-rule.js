const { readKeywordsFromDict, readRoundkeysFromDict } = require("../services/web-scraper-service");
const webScraperService = require("../services/web-scraper-service");
const { convertImageToText } = require("../untils/convert")

const unwantedSelectors = [
    // "s", "del", "strike", "button",
    ".cancel", ".title",
    "*[style*='text-decoration: line-through']",
];

const getImportantDates = async (browser, link) => {
    try {
        console.log(">> Getting important date from: " + link);

        const {
            submissionDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords,
        } = readKeywordsFromDict();

        const roundKeys = readRoundkeysFromDict()

        let page = await browser.newPage();

        await page.goto(link, { waitUntil: "domcontentloaded" });

        // Go to home site

        let bodyContent = await getContentAndRemoveUnwantedSelectors(page)

        let submissionDateCounts = countKeywords(bodyContent, submissionDate_keywords);
        let notificationDateCounts = countKeywords(bodyContent, notificationDate_keywords);
        let cameraReadyDateCounts = countKeywords(bodyContent, cameraReady_keywords);

        if (hasAllImportantDates(submissionDateCounts, notificationDateCounts, cameraReadyDateCounts)) {
            return await processImportantDates(
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

        submissionDateCounts = countKeywords(bodyContent, submissionDate_keywords);
        notificationDateCounts = countKeywords(bodyContent, notificationDate_keywords);
        cameraReadyDateCounts = countKeywords(bodyContent, cameraReady_keywords);

        if (hasAllImportantDates(submissionDateCounts, notificationDateCounts, cameraReadyDateCounts)) {
            return await processImportantDates(
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
        submissionDateCounts = countKeywords(bodyContent, submissionDate_keywords);
        notificationDateCounts = countKeywords(bodyContent, notificationDate_keywords);
        cameraReadyDateCounts = countKeywords(bodyContent, cameraReady_keywords);

        if (hasAllImportantDates(submissionDateCounts, notificationDateCounts, cameraReadyDateCounts)) {
            return await processImportantDates(
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

        await page.goto(link, { waitUntil: "domcontentloaded" });
        bodyContent = await getContentAndRemoveUnwantedSelectors(page)

        // console.log(bodyContent)

        submissionDateCounts = countKeywords(bodyContent, submissionDate_keywords);
        notificationDateCounts = countKeywords(bodyContent, notificationDate_keywords);
        cameraReadyDateCounts = countKeywords(bodyContent, cameraReady_keywords);
        
        if (hasImportantDates(submissionDateCounts, notificationDateCounts, cameraReadyDateCounts)) {
            return await processImportantDates(
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

const countKeywords = (content, keywords) => {
    const counts = {};
    for (const keyword of keywords) {
        let shouldCount = true;
        for (let existingKeyword in counts) {
            existingKeyword = existingKeyword.toLowerCase();
            if (existingKeyword.includes(keyword.toLowerCase()) 
                && !content.includes(keyword + ':'))  {
                shouldCount = false;
                break;
            }
        }
        if (!shouldCount) continue;

        const regex = new RegExp(keyword, "g");
        const matches = content.match(regex);
        if (matches) counts[keyword] = matches.length;
    }
    return counts;
};

const findClosestRoundKeys = (content, keyword, roundKeys) => {
    let subContent = content
    const keywordRegex = new RegExp(keyword, "g");
    let match;
    let closestRoundKeys = new Set();

    while ((match = keywordRegex.exec(subContent)) !== null) {
        const keywordIndex = match.index;

        for (const roundKey of roundKeys) {
            const roundKeyRegex = new RegExp(roundKey, "g");
            let roundMatch;

            while ((roundMatch = roundKeyRegex.exec(subContent)) !== null) {
                const roundKeyIndex = roundMatch.index;

                if (Math.abs(keywordIndex - roundKeyIndex) < 250 
                && Math.abs(keywordIndex - roundKeyIndex) !== 0
                && roundKeyIndex < keywordIndex) {
                    closestRoundKeys.add(roundKey);
                }
            }
        }
    }

    return Array.from(closestRoundKeys);
};

const hasAllImportantDates = (submissionCounts, notificationCounts, cameraReadyCounts) => {
    return (
        Object.keys(submissionCounts).length > 0 &&
        Object.keys(notificationCounts).length > 0 &&
        Object.keys(cameraReadyCounts).length > 0
    );
};

const hasImportantDates = (submissionCounts, notificationCounts, cameraReadyCounts) => {
    return (
        Object.keys(submissionCounts).length > 0 &&
        Object.keys(notificationCounts).length > 0 
    );
};

const getContentAndRemoveUnwantedSelectors = async (page) => {
    return await page.evaluate((unwantedSelectors) => {
        // Remove unwanted elements
        unwantedSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => element.remove());
        });

        // Function to insert separator div
        const insertSeparator = (elements) => {
            if (elements.length === 0) return;

            const startSeparator = document.createElement('div');
            startSeparator.innerText = '*'.repeat(50);
            elements[0].insertAdjacentElement('beforebegin', startSeparator);
            
            elements.forEach((element, index) => {
                if (index < elements.length) { // Avoid inserting after the last element
                    const separator = document.createElement('div');
                    separator.innerText = '*'.repeat(50);
                    element.insertAdjacentElement('afterend', separator);
                }
            });
        };

        const insertSeparatorBefore = (els) => {
            if(els.length === 0) return;

            els.forEach((element, index) => {
                if (index < els.length) { // Avoid inserting after the last element
                    const separator = document.createElement('div');
                    separator.innerText = '$'.repeat(100);
                    element.insertAdjacentElement('beforebegin', separator);
                }
            });
        }

        // Find and insert separators for li and tr elements
        const liElements = document.querySelectorAll('li');
        const trElements = document.querySelectorAll('tr');
        const aElements = document.querySelectorAll('a');
        insertSeparator(liElements);
        insertSeparator(trElements);
        insertSeparatorBefore(aElements);

        return document.body.innerText;
    }, unwantedSelectors);
}

const clickAndReload = async (page, text) => {
    try {
        await page.evaluate((text) => {
            const link = Array.from(document.querySelectorAll("a")).find(
                (a) =>
                    a.innerText.toLowerCase().includes(text) ||
                    a.href.toLowerCase().includes(text)
            );
            if (link) link.click();
        }, text);
        await page.waitForNavigation({ waitUntil: "domcontentloaded" });
        
        let bodyContent = await getContentAndRemoveUnwantedSelectors(page)
    
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
            if (i !== j && keywordj.includes(keywordi) && keywordi !== keywordj) {
                shouldAdd = false;
                break;
            }
        }
        if (shouldAdd) filteredKeywords.push(keywordData[i].keyword);
    }

    let result = [];
    // console.log(filteredKeywords)
    for (let i = 0; i < filteredKeywords.length; i++) {
        let shouldAdd = true;
        for (let j = 0; j < filteredKeywords.length; j++) {
            if (i !== j && 
                (filteredKeywords[j].includes(filteredKeywords[i])
                || filteredKeywords[j].toLowerCase().includes(filteredKeywords[i].slice(0, -1).toLowerCase()))) {
                shouldAdd = false;
                break;
            }
        }
        if (
            shouldAdd &&
            submissionDate_keywords.some((keyword) => {
                if (filteredKeywords[i].includes(" - ")
                ) {
                    return filteredKeywords[i].split(" - ")[1] === keyword;
                }
                return filteredKeywords[i] === keyword;
            })
            && !filteredKeywords[i].split(" - ")[0].includes(filteredKeywords[i].split(" - ")[1])
        ) {
            result.push(filteredKeywords[i]);
        }
    }

    return result;
};

const combineKeywordsWithRoundKeys = (keywordCounts, roundKeys, bodyContent) => {
    const result = [];
    for (const [keyword, count] of Object.entries(keywordCounts)) {
        const closestRoundKeys = findClosestRoundKeys(bodyContent, keyword, roundKeys);
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

    const submissionDateCounts = countKeywords(bodyContent, submissionDate_keywords);
    const notificationDateCounts = countKeywords(bodyContent, notificationDate_keywords);
    const cameraReadyDateCounts = countKeywords(bodyContent, cameraReady_keywords);

    const result = [];
    result.push(...combineKeywordsWithRoundKeys(submissionDateCounts, roundKeys, bodyContent));
    result.push(...combineKeywordsWithRoundKeys(notificationDateCounts, roundKeys, bodyContent));
    result.push(...combineKeywordsWithRoundKeys(cameraReadyDateCounts, roundKeys, bodyContent));
    // console.log(result)
    await webScraperService.extractDatesFromBody(
        filterKey(result, submissionDate_keywords),
        bodyContent,
        submissionDate,
        50
    );

    await webScraperService.extractDatesFromBody(
        filterKey(result, notificationDate_keywords),
        bodyContent,
        notificationDate,
        50
    );
    await webScraperService.extractDatesFromBody(
        filterKey(result, cameraReady_keywords),
        bodyContent,
        cameraReady,
        50
    );

    // await page.close();
    return { submissionDate, notificationDate, cameraReady };
};

const findCallForPapersPDFLinks = async (page) => {
    const links = await page.evaluate(() => {
        // Tìm tất cả các thẻ a và div
        const anchorTags = Array.from(document.querySelectorAll('a'));
        const iframeTags = Array.from(document.querySelectorAll('iframe[data-src]'));

        // Tìm các liên kết phù hợp trong thẻ a
        const cfpLinksFromAnchors = anchorTags.filter(anchor => {
            const href = anchor.href.toLowerCase();
            return href.includes('call-for-papers') || 
                   ((href.toLocaleLowerCase().includes('cfp') 
                   || href.toLocaleLowerCase().includes('call')) && href.endsWith('.pdf')) ||
                   href.includes('drive.google.com');
        }).map(anchor => anchor.href);

        // Tìm các liên kết phù hợp trong thẻ div
        const cfpLinksFromDivs = iframeTags.filter(iframe=> {
            const dataSource = iframe.getAttribute('data-src').toLowerCase();
            return dataSource.includes('drive.google.com');
        }).map(iframe => iframe.getAttribute('data-src'));

        // Kết hợp các liên kết từ thẻ a và thẻ div
        return [...cfpLinksFromAnchors, ...cfpLinksFromDivs];
    });

    return links;
};

module.exports = {
    getImportantDates,
};
