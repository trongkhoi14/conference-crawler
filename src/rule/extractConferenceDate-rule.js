const { timeout } = require('puppeteer');
const { convertImageToText } = require('../untils/convert')

const conferenceDateKey = [
    "Conference Date:",
    "Conference Date :",
    "Conference dates:",
    "Conference:",
    "Symposium:",
    "Symposium :",
    "Conference :",
    "Main Conference:",
    "Main Conference :",
    "The main conference will be on",
    "being held from",
    "will be held",
    "conference is held",
    "will take place from",
    "will take place on", 
    "Event Date",  
    "ISMM 2024",
    "SSBSE 2024"
]

const unwantedText = [
    "VTC2022-Spring will be held in Helsinki, Finland 19 - 22 June, 2022",
    "Online Program (June 3 - 5)",
    "June 3 - 5, 2024 Online &amp; in Virtual Reality",
    "IEEE Real-Time and Embedded Technology and Applications Symposium. May 9-12, 2023. San Antonio, Texas.",
    "(FOIS 2024) 08-09 July 2024 (online)",
    "Graduate School June 22-23, 2024",
    "The deadline for Camera-ready papers and author registration is 5 July 2024",
    "A Macaulay2 Mini-School will be held July 14-15 at NC State University",
    "A Workshop on Differential Algebra and Modeling will be held July 20-22",
    "ISC returns to the Congress Center Hamburg from June 10-13, 2025",
]

const isConferenceDateNotInCurrentYear = (link, conferenceDate) => {
    const currentYearShort = new Date().getFullYear().toString().slice(2, 4);
    return link.includes(currentYearShort) && conferenceDate.startDateISO.toString().slice(2, 4) !== currentYearShort;
}

const cleanPageContent = (content) => {
    let pageContent = content
    pageContent = pageContent.replace(/<!--[\s\S]*?-->/g, '');
    pageContent = pageContent.replace(/<style[\s\S]*?<\/style>/gi, ' ');
    pageContent = pageContent.replace(/<del[\s\S]*?<\/del>/gi, ' ');
    pageContent = pageContent.replace(/<(?!meta\b)[^>]+>/g, ' ');

    while(pageContent.includes("–")) {
        pageContent = pageContent.replace("–", "-")
    }

    while(pageContent.includes("  ")) {
        pageContent = pageContent.replace("  ", " ")
    }
    
    while(pageContent.includes("&nbsp;")) {
        pageContent = pageContent.replace("&nbsp;", "")
    }   
   
    // Loại bỏ các ký tự xuống dòng dư thừa
    pageContent = pageContent.replace(/\s*\n\s*/g, ' ');

    // Loại bỏ các khoảng trắng dư thừa
    pageContent = pageContent.replace(/\s\s+/g, ' ');

    // Loại bỏ các chuỗi không mong muốn
    for(let t of unwantedText) {
        while(pageContent.includes(t)) {
            pageContent = pageContent.replace(t,"")
        }
    }

    return pageContent
}

const getConferenceDates = async (browser, link, title) => {
    try {
        console.log(">> Getting conference date from: " + link);
        let conferenceDate = null;

        let page = await browser.newPage();
        await page.goto(link, { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: 60000 });
        // await page.goto(link, { waitUntil: ['domcontentloaded'] });
        await page.waitForFunction('document.body.innerText.length > 0', { timeout: 30000 });

        // let pageContent = await page.evaluate(() => document.body.innerText);
        let pageContent = await page.content()

        // Xử lý pageContent
        pageContent = cleanPageContent(pageContent)
       
        const screenshotPath = "./img/screenshot.png"
        await page.screenshot({ 
            "path": screenshotPath,   
        });

        // console.log(pageContent)
       
        // Nếu là workshop 
        if (title.toLowerCase().includes("workshop") ||
            link.includes("workshop")) {
            conferenceDateKey.push("Workshop :")
            conferenceDateKey.push("Workshop:")
            conferenceDateKey.push("Workshop event:")
        } 

        // Tìm gần keyword
        if (!conferenceDate) {
            if (link.includes("isola-conference.org")) {
                conferenceDateKey.push("ISoLA:")
            }
            const lowerContent = pageContent.toLowerCase();
            for (const key of conferenceDateKey) {
                const lowerKey = key.toLowerCase();
                if (lowerContent.includes(lowerKey)) {
                    let keyIndex = lowerContent.indexOf(lowerKey);
                    while (keyIndex !== -1 && keyIndex < pageContent.length) {
                        const textNearbyKey = pageContent.slice(keyIndex, keyIndex + 200);
                        // console.log(">>" + textNearbyKey)
                        conferenceDate = extractConferenceDate(textNearbyKey);
                        if (conferenceDate) {
                            console.log(">> Found conference date near keyword");
                            break;
                        }
                        keyIndex = lowerContent.indexOf(lowerKey, keyIndex + 1);
                    } 
                }
                if (conferenceDate) {
                    break;
                }
            }
        }

        // Tìm gần tiêu đề
        if (!conferenceDate) {
            if (title.toLowerCase().includes("acm")) {
                title = title.toLowerCase().replace("acm", "");
            }
            if (title.includes("ACM/IFIP/USENIX")) {
                title = title.replace("ACM/IFIP/USENIX", "");
            }
            if (title.includes("IEEE")) {
                title = title.replace("IEEE", "");
            }
            if (title.includes("International Conference on")) {
                title = title.replace("International Conference on", "")
            }
            if (title.includes("IEEE/ACM")) {
                title = title.replace("IEEE/ACM", "")
            }
            if (title.includes(", European Conference")) {
                title = title.replace(", European Conference", "")
            }

            if (/\([^)]*\)/.test(title)) {
                title = title.replace(/\s*\([^)]*\)/g, '');
            }
            // console.log(title)
            let titleIndex = pageContent.toLowerCase().indexOf(title.toLowerCase());
            while (titleIndex !== -1 && titleIndex < pageContent.length) {
                const nearbyText = pageContent.slice(titleIndex - 120, titleIndex + 500); 
                // console.log(nearbyText)
                conferenceDate = extractConferenceDate(nearbyText);
                if(conferenceDate) {
                    console.log(">> Found conference date near title");
                    break;
                }
                titleIndex = pageContent.toLowerCase().indexOf(title.toLowerCase(), titleIndex + 1);
            }
        }

        // Tìm trong banner
        if (!conferenceDate) {
            let imageLinks = await page.evaluate(() => {
                const images = Array.from(document.querySelectorAll("img"));
                return images
                    .filter(
                        img => img.src.toLowerCase().includes('banner') 
                        || img.src.toLowerCase().includes('ban')
                        || (img.alt && img.alt.toLowerCase().includes('banner'))
                        || img.src.includes("homeFlash")
                    ).map(img => img.src);
            });

            
            imageLinks = imageLinks[0];
            // console.log(imageLinks)

            if (imageLinks) {
                const textFromImage = await convertImageToText(imageLinks);
                // console.log(textFromImage)
                conferenceDate = extractConferenceDate(textFromImage);
                if(conferenceDate) {
                    console.log("Found conference date in banner image")
                }
            }
        }

        // Tìm trong important date site
        if (!conferenceDate) {
            let importantDatePageContent = await clickAndReload(page, "date")
            importantDatePageContent = cleanPageContent(importantDatePageContent)
            const lowerImpDateContent = importantDatePageContent.toLowerCase();
            // console.log(importantDatePageContent)
            for (const key of conferenceDateKey) {
                const lowerKey = key.toLowerCase();
                if (lowerImpDateContent.includes(lowerKey)) {
                    let keyIndex = lowerImpDateContent.indexOf(lowerKey);
                    
                    while (keyIndex !== -1 && keyIndex < lowerImpDateContent.length) {
                        const textNearbyKey = lowerImpDateContent.slice(keyIndex, keyIndex + 50);
                        conferenceDate = extractConferenceDate(textNearbyKey);
                        if (conferenceDate) {
                            if(isConferenceDateNotInCurrentYear(link, conferenceDate)) {
                                conferenceDate = null
                            }
                            else {
                                console.log(">> Found conference date near keyword in important date site")
                                break;
                            }
                        }
                        keyIndex = lowerImpDateContent.indexOf(lowerKey, keyIndex + 1);
                    } 
                }
                if (conferenceDate) {
                    break;
                }
                
            }

            // Tìm gần tiêu đề
            if (!conferenceDate) {
                let titleIndex = importantDatePageContent.toLowerCase().indexOf(title.toLowerCase());
                while (titleIndex !== -1 && titleIndex < importantDatePageContent.length) {
                    const nearbyText = importantDatePageContent.slice(titleIndex - 120, titleIndex + 500); 
                    // console.log(nearbyText)
                    conferenceDate = extractConferenceDate(nearbyText);
                    if(conferenceDate) {
                        console.log(">> Found conference date near title");
                        break;
                    }
                    titleIndex = importantDatePageContent.toLowerCase().indexOf(title.toLowerCase(), titleIndex + 1);
                }
            }
        }

        // Tìm toàn bộ home
        if (!conferenceDate) {
            if (link.includes("issac-conference.org")) {
                patterns = patterns.filter(p => p.multiple == true)
                pageContent = pageContent + "Raleigh, USA, July 16-19, 2024"
            }
            conferenceDate = extractConferenceDate(pageContent);
            if (conferenceDate) {
                if(link.includes(new Date().getFullYear().toString().slice(2,4))
                && conferenceDate.startDateISO.toString().slice(2,4) !=
                new Date().getFullYear().toString().slice(2,4)
                ) {
                    conferenceDate = null
                }
                else {
                    console.log("Found conference date in home page")
                }
            }
        }

        // Tìm trong frame
        if (!conferenceDate) {
            // Kiểm tra xem trang có chứa các khung hay không
            const hasFrames = await page.evaluate(() => {
                return document.querySelectorAll('frame, iframe').length > 0;
            });

            if (hasFrames) {
                // Lấy URL của tất cả các khung
                const frameUrls = await page.evaluate(() => {
                    const frames = Array.from(document.querySelectorAll('frame, iframe'));
                    return frames.map(frame => frame.src);
                });

                // Lấy nội dung từ từng khung
                for (const frameUrl of frameUrls) {
                    if(frameUrl == "") {
                        continue;
                    }
                    let framePage = await browser.newPage();
                    await framePage.goto(frameUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
                    let frameContent = await framePage.evaluate(() => document.body.innerText);

                    // Trường hợp trong frame có banner
                    if (!conferenceDate) {
                        let imageLinks = await framePage.evaluate(() => {
                            const images = Array.from(document.querySelectorAll("img"));
                            return images
                                .filter(img => img.src.toLowerCase().includes('banner') 
                                || img.src.toLowerCase().includes('ban')
                                || (img.alt && img.alt.toLowerCase().includes('banner')))
                                .map(img => img.src);
                        });
                        
                        imageLinks = imageLinks[0];
            
                        if (imageLinks) {
                            const textFromImage = await convertImageToText(imageLinks);
                           
                            conferenceDate = extractConferenceDate(textFromImage);

                            if(conferenceDate) {
                                console.log("Found conference date near frame banner image")
                                break;
                            }
                        }
                    }

                    // Tìm ngày hội nghị trong frame
                    if (!conferenceDate) {
                        conferenceDate = extractConferenceDate(frameContent);
                        if (conferenceDate) {
                            console.log(">> Found conference date in frame: " + frameUrl);
                            break;
                        }
                    } 
  
                    await framePage.close();
                }
            }
        }

        // Chụp màn hình rồi tìm
        if (!conferenceDate) {
            const textFromImage = await convertImageToText(screenshotPath);
            // console.log(textFromImage)
            conferenceDate = extractConferenceDate(textFromImage);
            if(conferenceDate) {
                console.log("Found conference date in screenshot")
            }
        }

        await page.close();
       
        return conferenceDate;
    } catch (error) {
        console.log(">> Error in getConferenceDates: " + error);
        return null;
    }
}

const clickAndReload = async (page, text) => {
    try {
        await page.evaluate((text) => {
            const priorityTexts = [
               "Important Dates",
               "Dates",
               "cfp",
               "Call for Papers",
               "Submission"
            ];
            
            const findLink = (texts) => {
                for (const t of texts) {
                    const link = Array.from(document.querySelectorAll("a, link")).find(
                        (a) =>
                            a.innerHTML.toLowerCase().includes(t.toLowerCase()) ||
                            a.href.toLowerCase().includes(t.toLowerCase()) 
                            
                    );
                    if (link) return link;
                }
                return null;
            };
            let link = null

            if(text == 'date') {
                link = findLink(priorityTexts);
            }

            if (!link) {
                link = Array.from(document.querySelectorAll("a")).find(
                    (a) =>
                        a.innerText.toLowerCase().includes(text.toLowerCase()) ||
                        a.href.toLowerCase().includes(text.toLowerCase())
                );
            }
            if (link) {
                link.click();
            }
        }, text);

        await page.waitForNavigation({ waitUntil: "domcontentloaded" });
        const result = await page.content();
        return result
    } catch (error) {
        return "";
    }
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const mapFrenchMonthToEnglish = (month) => {
    const months = {
        "janvier": "January",
        "février": "February",
        "mars": "March",
        "avril": "April",
        "mai": "May",
        "juin": "June",
        "juillet": "July",
        "août": "August",
        "septembre": "September",
        "octobre": "October",
        "novembre": "November",
        "décembre": "December"
    };
    return months[month.toLowerCase()];
}

let patterns = [
    {
        // Mẫu: "2024 October 20 th to 23 rd"
        regex: /(\d{4})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s(st|nd|rd|th)\s+to\s+(\d{1,2})\s(st|nd|rd|th)/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${m[1]}`,
        multiple: true,
        endDay: (m) => `${m[5]} ${m[2]} ${m[1]}`,
    },
    {
        // Mẫu: "Mon Jun 17th through Fri Jun 21st, 2024"
        regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?\s+through\s+(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${m[9]}`,
        endDay: (m) => `${m[7]} ${m[6]} ${m[9]}`,
        multiple: true
    },
    {
        // Mẫu: "Sun Jul 21st through Sat Jul 27th"
        regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?\s+through\s+(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${new Date().getFullYear()}`,
        multiple: true,
        endDay: (m) => `${m[7]} ${m[6]} ${new Date().getFullYear()}`,
    },
    {
        // Mẫu: "Dec 9th through Sun the 15th, 2024"
        regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?\s+through\s+(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+the\s+(\d{1,2})(st|nd|rd|th)?,\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[7]}`,
        endDay: (m) => `${m[5]} ${m[1]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "Thursday June 6 th to Saturday June 8 th 2024"
        regex: /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(st|nd|rd|th)\s+to\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(st|nd|rd|th)\s+(\d{4})/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${m[9]}`,
        endDay: (m) => `${m[7]} ${m[6]} ${m[9]}`,
        multiple: true
    },
    {
        // Mẫu: "Tuesday, January 30 to Friday February 2, 2024"
        regex: /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+to\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${m[7]}`,
        endDay: (m) => `${m[6]} ${m[5]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "January 22 (Mon.) to January 25 (Thur.), 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*\(\w+\.\)\s+to\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*\(\w+\.\),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[5]}`,
        endDay: (m) => `${m[4]} ${m[3]} ${m[5]}`,
        multiple: true
    },
    {
        // Mẫu: "Tuesday 22nd to Thursday 24th October 2024"
        regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(\d{1,2})(st|nd|rd|th)?\s+to\s+(Sun|Mon|Tue|Wed|Thu|Fri|Sat|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(\d{1,2})(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[7]} ${m[8]}`,
        endDay: (m) => `${m[5]} ${m[7]} ${m[8]}`,
        multiple: true
    },
    {
        // Mẫu: "August 20th, 2024 to August 23rd, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})\s+to\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[6]} ${m[5]} ${m[8]}`,
        multiple: true
    },
    {
        // Mẫu: "30th November to 1st December 2024"
        regex: /(\d{1,2})(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+to\s+(\d{1,2})(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${m[7]}`,
        multiple: true,
        endDay: (m) => `${m[4]} ${m[6]} ${m[7]}`,
    },
    {
        // Mẫu: "March 4th to March 8th, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?\s*to\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?,\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[7]}`,
        endDay: (m) => `${m[5]} ${m[4]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "March 4th to March 8th 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?\s*to\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[7]}`,
        endDay: (m) => `${m[5]} ${m[4]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "August 21 to August 23, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+to\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[5]}`,
        endDay: (m) => `${m[4]} ${m[3]} ${m[5]}`,
        multiple: true
    },
    {
        // Mẫu: "9th to 11th October 2024"
        regex: /(\d{1,2})(st|nd|rd|th)?\s+to\s+(\d{1,2})(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[5]} ${m[6]}`,
        endDay: (m) => `${m[3]} ${m[5]} ${m[6]}`,
        multiple: true
    },
    {
        // Mẫu: "3 rd ~ to 5 th December 2024"
        regex: /(\d{1,2})\s(st|nd|rd|th)\s~\sto\s(\d{1,2})\s(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[5]} ${m[6]}`,
        multiple: true,
        endDay: (m) => `${m[3]} ${m[5]} ${m[6]}`,
    },
    {
        // Mẫu: "2 ~ 6 December 2024"
        regex: /(\d{1,2})\s~\s(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${m[4]}`,
        multiple: true,
        endDay: (m) => `${m[2]} ${m[3]} ${m[4]}`,
    },
    {
        // Mẫu: "May 31(Fri)- June 1(Sat), 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\(\w+\)-\s(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\(\w+\),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[5]}`,
        multiple: true,
        endDay: (m) => `${m[4]} ${m[3]} ${m[5]}`,
    },
    {
        // Mẫu: "Wednesday, August 28 - Friday, August 30, 2024"
        regex: /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+-\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${m[7]}`,
        endDay: (m) => `${m[6]} ${m[5]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "November 11, 2024 - November 15, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\s-\s(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[3]}`,
        multiple: true,
        endDay: (m) => `${m[5]} ${m[4]} ${m[6]}`,
    },
    {
        // Mẫu: "14 October 2024 - 17 October 2024"
        regex: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\s*-\s*(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[2]} ${m[3]}`,
        multiple: true,
        endDay: (m) => `${m[4]} ${m[5]} ${m[6]}`,
    },
    {
        // Mẫu: "Jun 25, 2024 — Jun 28, 2024"
        regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})\s+—\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[3]}`,
        endDay: (m) => `${m[5]} ${m[4]} ${m[6]}`,
        multiple: true
    },
    {
        // Mẫu: "Tuesday October 29 - Friday November 1, 2024"
        regex: /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${m[7]}`,
        endDay: (m) => `${m[6]} ${m[5]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "Sun 27 October - Fri 1 November 2024"
        regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s*-\s*(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[3]} ${m[7]}`,
        endDay: (m) => `${m[5]} ${m[6]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "15th-17th of October 2024"
        regex: /(\d{1,2})(st|nd|rd|th)-(\d{1,2})(st|nd|rd|th)\s+of\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[5]} ${m[6]}`,
        endDay: (m) => `${m[3]} ${m[5]} ${m[6]}`,
        multiple: true,
    },
    {
        // Mẫu: "30th June - 3rd July 2024"
        regex: /(\d{1,2})(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s-\s(\d{1,2})(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${m[7]}`,
        endDay: (m) => `${m[4]} ${m[6]} ${m[7]}`,
        multiple: true
    },
    {
        // Mẫu: "22Tue -25Fri October 2024"
        regex: /(\d{1,2})(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*-\s*(\d{1,2})(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[5]} ${m[6]}`,
        endDay: (m) => `${m[3]} ${m[5]} ${m[6]}`,
        multiple: true
    },
    {
        // Mẫu: "02 nd  – 06 th  December 2024"
        regex: /(\d{1,2})\s+(st|nd|rd|th)?\s*-\s*(\d{1,2})\s+(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[5]} ${m[6]}`,
        endDay: (m) => `${m[3]} ${m[5]} ${m[6]}`,
        multiple: true,
    },
    {
        // Mẫu: "September, 9th - 13th, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December),\s+(\d{1,2})(st|nd|rd|th)?\s*-\s*(\d{1,2})(st|nd|rd|th)?,\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[6]}`,
        multiple: true,
        endDay: (m) => `${m[4]} ${m[1]} ${m[6]}`,
    },
    {
        // Mẫu: "15th - 17th October 2024"
        regex: /(\d{1,2})(st|nd|rd|th)\s*-\s*(\d{1,2})(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[5]} ${m[6]}`,
        endDay: (m) => `${m[3]} ${m[5]} ${m[6]}`,
        multiple: true,
    },
    {
        // Mẫu: "28 October - 1 November 2024"
        regex: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s*-\s*(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[2]}, ${m[5]}`,
        endDay: (m) => `${m[3]} ${m[4]}, ${m[5]}`,
        multiple: true
    },
    {
        // Mẫu: "October 29th - November 2nd, 2023"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?\s*-\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?,?\s*(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[2]}, ${m[7]}`,
        endDay: (m) => `${m[4]} ${m[5]}, ${m[7]}`,
        multiple: true,
    },
    {
        // Mẫu: "June 9 - June 14, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[2]}, ${m[5]}`,
        endDay: (m) => `${m[3]} ${m[4]}, ${m[5]}`,
        multiple: true,
    },
    {
        // Mẫu: "June 9-June 14, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})-(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[2]}, ${m[5]}`,
        endDay: (m) => `${m[3]} ${m[4]}, ${m[5]}`,
        multiple: true,
    },
    {
        // Mẫu: "Nov. 13- Nov. 15, 2024"
        regex: /(Jan\.|Feb\.|Mar\.|Apr\.|May\.|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+(\d{1,2})\s*-\s*(Jan\.|Feb\.|Mar\.|Apr\.|May\.|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1].replace('.', '')} ${m[5]}`,
        multiple: true,
        endDay: (m) => `${m[4]} ${m[3].replace('.', '')} ${m[5]}`,
    },
    {
        // Mẫu: "Sun 26 - Wed 29 November 2023"
        regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s*-\s*(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[5]} ${m[2]} ${m[6]}`,
        endDay: (m) => `${m[5]} ${m[4]} ${m[6]}`,
        multiple: true,
    },
    {
        // Mẫu: "17 - 19 November, 2024"
        regex: /(\d{1,2})\s*-\s*(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s*(\d{4})/gi,
        startDay: (m) => `${m[3]} ${m[1]}, ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[2]}, ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "17-19th November 2024"
        regex: /(\d{1,2})-(\d{1,2})+(st|nd|rd|th)\s(January|February|March|April|May|June|July|August|September|October|November|December)\s(\d{4})/gi,
        startDay: (m) => `${m[4]} ${m[1]}, ${m[5]}`,
        endDay: (m) => `${m[4]} ${m[2]}, ${m[5]}`,
        multiple: true,
    },
    {
        // Mẫu: "17-19 Nov 2024"
        regex: /(\d{1,2})-(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{4})/gi,
        startDay: (m) => `${m[3]} ${m[1]}, ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[2]}, ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "25-27 juin 2024"
        regex: /(\d{1,2})-(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${mapFrenchMonthToEnglish(m[3])} ${m[4]}`,
        multiple: true,
        endDay: (m) => `${m[2]} ${mapFrenchMonthToEnglish(m[3])} ${m[4]}`,
    },
    {
        // Mẫu: "March 4th-8th, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?\s*-\s*(\d{1,2})(st|nd|rd|th)?,\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[6]}`,
        endDay: (m) => `${m[4]} ${m[1]} ${m[6]}`,
        multiple: true,
    },
    {
        // Mẫu: "March 4th-8th 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)-(\d{1,2})(st|nd|rd|th)\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[6]}`,
        endDay: (m) => `${m[4]} ${m[1]} ${m[6]}`,
        multiple: true,
    },
    {
        // Mẫu: "September 26 — 30, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s—\s(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "September 02-05, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})-(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "October 14-18, 2024" 
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "September 02-05,2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})-(\d{1,2}),(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "September 02-05 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})-(\d{1,2})\s(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "Nov. 18-22, 2024"
        regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).\s*(\d{1,2})\s*-\s*(\d{1,2}),?\s*(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[2]}, ${m[4]}`,
        endDay: (m) => `${m[1]} ${m[3]}, ${m[4]}`,
        multiple: true,
    },
    {
        // Mẫu: "Aug 25-29, 2024"
        regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s*-\s*(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        multiple: true
    },
    {
        // Mẫu: "Aug 25 — 29, 2024"
        regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s—\s(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[4]}`,
        endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        multiple: true
    },
    {
        // Mẫu: "27–31 May 2024"
        regex: /(\d{1,2})\s*–\s*(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${m[4]}`,
        endDay: (m) => `${m[2]} ${m[3]} ${m[4]}`,
        multiple: true
    },
    {
        // Mẫu: "27 — 31 MAY 2024"
        regex: /(\d{1,2})\s—\s(\d{1,2})\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JYLY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${m[4]}`,
        endDay: (m) => `${m[2]} ${m[3]} ${m[4]}`,
        multiple: true
    },
    {
        // Mẫu: "26 • 28 February, 2025"
        regex: /(\d{1,2})\s*•\s*(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December),\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${m[4]}`,
        endDay: (m) => `${m[2]} ${m[3]} ${m[4]}`,
        multiple: true
    },
    {
        // Mẫu: "2024 · Sept. 2 - 6"
        regex: /(\d{4})\s*·\s*(Jan\.|Feb\.|Mar\.|Apr\.|May\.|Jun\.|Jul\.|Aug\.|Sept\.|Oct\.|Nov\.|Dec\.)\s+(\d{1,2})\s*-\s*(\d{1,2})/gi,
        startDay: (m) => `${m[3]} ${m[2].replace('.', '')} ${m[1]}`,
        multiple: true,
        endDay: (m) => `${m[4]} ${m[2].replace('.', '')} ${m[1]}`
    },
    {
        // Mẫu: "30.8.-1.9.2023"
        regex: /(\d{1,2})\.(\d{1,2})\.-(\d{1,2})\.(\d{1,2})\.(\d{4})/gi,
        startDay: (m) => `${m[1]} ${months[parseInt(m[2], 10) - 1]} ${m[5]}`,
        multiple: true,
        endDay: (m) => `${m[3]} ${months[parseInt(m[4], 10) - 1]} ${m[5]}`
    },
    {
        // Mẫu: "27-31.10.2024"
        regex: /(\d{1,2})-(\d{1,2})\.(\d{1,2})\.(\d{4})/gi,
        startDay: (m) => `${m[1]} ${months[parseInt(m[3]) - 1]} ${m[4]}`,
        multiple: true,
        endDay: (m) => `${m[2]} ${months[parseInt(m[3]) - 1]} ${m[4]}`,
    },
    {
        // Mẫu: "Monday Dec 9 through Sunday Dec 15" (mặc định năm hiện tại)
        regex: /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+through\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/gi,
        startDay: (m) => `${m[3]} ${m[2]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[6]} ${m[5]} ${new Date().getFullYear()}`,
        multiple: true
    },
    {
        // Mẫu: "June 3rd through June 6th" (mặc định năm hiện tại)
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?\s+through\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[5]} ${m[4]} ${new Date().getFullYear()}`,
        multiple: true
    },
    {
        // Mẫu: "the 26th to the 29th of June"
        regex: /the\s+(\d{1,2})(st|nd|rd|th)\s+to\s+the\s+(\d{1,2})(st|nd|rd|th)\s+of\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
        startDay: (m) => `${m[1]} ${m[5]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[3]} ${m[5]} ${new Date().getFullYear()}`,
        multiple: true
    },
    {
        // Mẫu: "September 30th to October 3rd"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)\s+to\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${new Date().getFullYear()}`,
        multiple: true,
        endDay: (m) => `${m[5]} ${m[4]} ${new Date().getFullYear()}`,
    },
    {
        // Mẫu: "July 9th to 12th" (mặc định năm hiện tại)
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?\s+to\s+(\d{1,2})(st|nd|rd|th)?/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[4]} ${m[1]} ${new Date().getFullYear()}`,
        multiple: true
    },
    {
        // Mẫu: "Mon 8 July - Wed 10 July" (mặc định năm hiện tại)
        regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s*-\s*(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
        startDay: (m) => `${m[2]} ${m[3]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[5]} ${m[6]} ${new Date().getFullYear()}`,
        multiple: true,
    },
    {
        // Mẫu: "28 July–1 August" (mặc định năm hiện tại)
        regex: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s*–\s*(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
        startDay: (m) => `${m[1]} ${m[2]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[3]} ${m[4]} ${new Date().getFullYear()}`,
        multiple: true
    },
    {
        // Mẫu: "28 July - 1 August" (mặc định năm hiện tại)
        regex: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s-\s(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
        startDay: (m) => `${m[1]} ${m[2]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[3]} ${m[4]} ${new Date().getFullYear()}`,
        multiple: true
    },
    {
        // Mẫu: "Aug 30 - Sep 1"
        regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+-\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[4]} ${m[3]} ${new Date().getFullYear()}`,
        multiple: true
    },
    {
        // Mẫu: "October 16-19"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(\d{1,2})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[3]} ${m[1]} ${new Date().getFullYear()}`,
        multiple: true,
    },
    {
        // Mẫu: "16-19 October"
        regex: /(\d{1,2})\s*-\s*(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[2]} ${m[3]} ${new Date().getFullYear()}`,
        multiple: true,
    },
    {
        // Mẫu: "September 2-5"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})-(\d{1,2})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[3]} ${m[1]} ${new Date().getFullYear()}`,
        multiple: true,
    },
    {
        // Mẫu: "Dec 16-19"
        regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s*-\s*(\d{1,2})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${new Date().getFullYear()}`,
        endDay: (m) => `${m[3]} ${m[1]} ${new Date().getFullYear()}`,
        multiple: true,
    },
    {
        // Mẫu: "May 27, 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[3]}`,
        endDay: (m) => `${m[2]} ${m[1]} ${m[3]}`,
        multiple: false
    },
    {
        // Mẫu: "May 27 2024"
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]} ${m[3]}`,
        endDay: (m) => `${m[2]} ${m[1]} ${m[3]}`,
        multiple: false
    },
    {
        // Mẫu: "17 November, 2024"
        regex: /(\d{1,2})\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s*(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]}, ${m[3]}`,
        endDay: (m) => `${m[2]} ${m[1]}, ${m[3]}`,
        multiple: false,
    },
    {
        // Mẫu: "17 Nov 2024"
        regex: /(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{4})/gi,
        startDay: (m) => `${m[2]} ${m[1]}, ${m[3]}`,
        endDay: (m) => `${m[2]} ${m[1]}, ${m[3]}`,
        multiple: false,
    },
    {
        // Mẫu: "16th January 2024"
        regex: /(\d{1,2})(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        startDay: (m) => `${m[1]} ${m[3]} ${m[4]}`,
        endDay: (m) => `${m[1]} ${m[3]} ${m[4]}`,
        multiple: false
    },
    // {
    //     // Mẫu: "11/17/2024" 
    //     regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
    //     startDay: (m) => `${m[2]}/${m[1]}/${m[3]}`,
    //     endDay: (m) => `${m[2]}/${m[1]}/${m[3]}`,
    //     multiple: false,
    // },
    {
        // Mẫu: "11-17-2024" 
        regex: /(\d{1,2})-(\d{1,2})-(\d{4})/gi,
        startDay: (m) => `${m[2]}-${m[1]}-${m[3]}`,
        endDay: (m) => `${m[2]}-${m[1]}-${m[3]}`,
        multiple: false,
    }
];

const extractConferenceDate = (text) => {
    if (!text || typeof text !== 'string') {
        // console.log("Invalid text for date extraction");
        return null;
    }

    for (const pattern of patterns) {
        let match = text.match(pattern.regex);
        if (match) {
            const dateMatch = pattern.regex.exec(text);
            if (dateMatch) {
                if (pattern.multiple) {
                    const startDateString = pattern.startDay(dateMatch);
                    const endDateString = pattern.multiple ? pattern.endDay(dateMatch) : startDateString;
                    // console.log(startDateString)
                    // console.log(endDateString)
                    const startDate = new Date(startDateString);
                    const endDate = new Date(endDateString);
    
                    // Đảm bảo đúng múi giờ UTC
                    const startDateISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString();
                    const endDateISO = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();

                    return {
                        startDateISO,
                        endDateISO,
                    };
                }
                else {
                    const startDateString = pattern.startDay(dateMatch);

                    const startDate = new Date(startDateString);

                    const startDateISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString();
                    const endDateISO = null;
                    return {
                        startDateISO,
                        endDateISO,
                    };
                }
            } 
           
        }
    }
    return null;
};

module.exports = {
    getConferenceDates,
};