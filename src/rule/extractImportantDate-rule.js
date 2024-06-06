const { readKeywordsFromDict } = require("../services/web-scraper-service");
const webScraperService = require("../services/web-scraper-service");
/*
    Kiểm tra xem trong bodyContent có 3 key (sub, noti, cam) không
    Nếu đủ thì trả về 3 key tìm được

    Nếu không đủ thì click vô thẻ a có innerText chứa hoặc href 'date'

    Lấy lại bodyContent vì lúc này đã vô site khác

    Kiểm tra xem trong bodyContent mới có 3 key (sub, noti, cam) không
    Nếu đủ thì trả về 3 key tìm được

    Nếu không đủ thì click vô thẻ a có innerText hoặc href chứa 'call' 

    Lấy lại bodyContent vì lúc này đã vô site khác

    Kiểm tra xem trong bodyContent mới có 3 key (sub, noti, cam) không
    Nếu đủ thì trả về 3 key tìm được
    */

// Lấy important date từ một link

const getImportantDates = async (browser, link) => {
    try {
        console.log(">> Getting important date from: " + link);

        let submissionDate = [];
        let notificationDate = [];
        let cameraReady = [];

        let page = await browser.newPage();
        await page.goto(link, { waitUntil: "domcontentloaded" });
        let bodyContent = await page.content();

        const {
            submissionDate_keywords,
            notificationDate_keywords,
            cameraReady_keywords,
        } = readKeywordsFromDict();

        const roundKeys = ["Regular", "Position", "Abstracts"];

        const countKeywords = (content, keywords) => {
            const counts = {};
            for (const keyword of keywords) {
                let shouldCount = true;
                for (let existingKeyword in counts) {
                    existingKeyword = existingKeyword.toLowerCase();
                    if (existingKeyword.includes(keyword.toLowerCase())) {
                        shouldCount = false;
                        break;
                    }
                }
                if (!shouldCount) {
                    continue;
                }
                const regex = new RegExp(keyword, "g");
                const matches = content.match(regex);
                if (matches) {
                    counts[keyword] = matches.length;
                }
            }
            return counts;
        };

        const findClosestRoundKeys = (content, keyword, roundKeys) => {
            const keywordRegex = new RegExp(keyword, "g");
            let match;
            let closestRoundKeys = new Set();

            while ((match = keywordRegex.exec(content)) !== null) {
                const keywordIndex = match.index;

                for (const roundKey of roundKeys) {
                    const roundKeyRegex = new RegExp(roundKey, "g");
                    let roundMatch;

                    while (
                        (roundMatch = roundKeyRegex.exec(content)) !== null
                    ) {
                        const roundKeyIndex = roundMatch.index;

                        if (
                            Math.abs(keywordIndex - roundKeyIndex) < 100 &&
                            Math.abs(keywordIndex - roundKeyIndex) !== 0
                        ) {
                            closestRoundKeys.add(roundKey);
                        }
                    }
                }
            }

            return Array.from(closestRoundKeys);
        };

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

        if (
            hasAllImportantDates(
                submissionDateCounts,
                notificationDateCounts,
                cameraReadyDateCounts
            )
        ) {
            await page.close();
            const result = [];

            const combineKeywordsWithRoundKeys = (keywordCounts, roundKeys) => {
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
            };

            combineKeywordsWithRoundKeys(submissionDateCounts, roundKeys);
            combineKeywordsWithRoundKeys(notificationDateCounts, roundKeys);
            combineKeywordsWithRoundKeys(cameraReadyDateCounts, roundKeys);


            await page.close();
            
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

            return {submissionDate, notificationDate, cameraReady};
        }

        const clickAndReload = async (page, text) => {
            await page.evaluate((text) => {
                const link = Array.from(document.querySelectorAll("a")).find(
                    (a) =>
                        a.innerText.toLowerCase().includes(text) ||
                        a.href.toLowerCase().includes(text)
                );
                if (link) link.click();
            }, text);
            await page.waitForNavigation({ waitUntil: "domcontentloaded" });
            return await page.$eval("body", (el) => {
                return el.innerText;
            });
        };

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
            const result = [];
            const combineKeywordsWithRoundKeys = (keywordCounts, roundKeys) => {
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
            };

            combineKeywordsWithRoundKeys(submissionDateCounts, roundKeys);
            combineKeywordsWithRoundKeys(notificationDateCounts, roundKeys);
            combineKeywordsWithRoundKeys(cameraReadyDateCounts, roundKeys);

            await page.close();
            
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

            return {submissionDate, notificationDate, cameraReady};
        }

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
            const result = [];
            const combineKeywordsWithRoundKeys = (keywordCounts, roundKeys) => {
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
            };

            combineKeywordsWithRoundKeys(submissionDateCounts, roundKeys);
            combineKeywordsWithRoundKeys(notificationDateCounts, roundKeys);
            combineKeywordsWithRoundKeys(cameraReadyDateCounts, roundKeys);

            await page.close();
            
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

            return {submissionDate, notificationDate, cameraReady};
        }

        await page.close();
        console.log("Important dates not found for link: " + link);
        return null;
    } catch (error) {
        console.log("Error in getImportantDates rule: " + error);
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
        if (shouldAdd) {
            filteredKeywords.push(keywordData[i].keyword);
        }
    }

    let result = [];

    for (let i = 0; i < filteredKeywords.length; i++) {
        let shouldAdd = true;
        for (let j = 0; j < filteredKeywords.length; j++) {
            if (i !== j && filteredKeywords[j].includes(filteredKeywords[i])) {
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
            })
        ) {
            result.push(filteredKeywords[i]);
        }
    }

    return result;
    return filteredKeywords;
};

module.exports = {
    getImportantDates,
};
