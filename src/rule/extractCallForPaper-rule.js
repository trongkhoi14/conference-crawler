// CALL FOR DOCTORAL SYMPOSIUM PAPERS

const getCallForPaper = async (browser, link, acronym) => {
    try {
        console.log(">> Getting call for paper from: " + link);
        let callForPaper = null;

        let page = await browser.newPage();
        await page.goto(link, { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: 60000 });
        
        if(!link.includes("call-for-papers")) {
            await clickAndReload(page, "call", acronym)
        }  

        let pageContent = await page.content()

        if (pageContent.includes(`id="maincontent"`)) {
            await page.waitForSelector("#maincontent")
            callForPaper = await page.evaluate(() => document.querySelector('#maincontent').innerText);
        }
        else if (pageContent.includes(`class="page"`)){
            await page.waitForSelector(".page")
            callForPaper = await page.evaluate(() => document.querySelector('.page').innerText);
        }
        else {
            callForPaper = await page.evaluate(() => document.body.innerText);
        }

        await page.close();
        return callForPaper
    } catch (error) {
        return ""
    }
   
}

const clickAndReload = async (page, text, acronym) => {
    try {
        let result
        await page.evaluate((text, acronym) => {
            const priorityTexts = [
                "Call for Research Papers",
                "MAIN-TRACK PAPERS", 
                "call for paper", 
                "main track", 
                "Research Papers", 
                "Research Track",
                "Full Papers",
                "Call for Participation",
                "call-for-submissions",
                "CallPapers",
                "cfp",
            ];
            
            const findLink = (texts) => {
                for (const t of texts) {
                    const links = Array.from(document.querySelectorAll("a")).filter(
                        (a) =>
                            a.innerText.toLowerCase().includes(t.toLowerCase()) ||
                            a.href.toLowerCase().includes(t.toLowerCase())
                    );
                    if (links.length) return links;
                }
                return null;
            };
            let links = [];

            if (text == 'call') {
                links = findLink(priorityTexts);
            }

            if (!links || links.length === 0) {
                links = Array.from(document.querySelectorAll("a")).filter(
                    (a) =>
                        a.innerText.toLowerCase().includes(text.toLowerCase()) ||
                        a.href.toLowerCase().includes(text.toLowerCase())
                );
            }

            if (links.length > 0) {
                if (acronym) {
                    const abbrLink = links.find(
                        (a) => a.innerText.toLowerCase().includes(acronym.toLowerCase()) ||
                        a.href.toLowerCase().includes(acronym.toLowerCase())
                    );
                    if (abbrLink) {
                        abbrLink.click();
                        return;
                    }
                }
                links[0].click(); 
            }
        }, text, acronym);

        await page.waitForNavigation({ waitUntil: "domcontentloaded" });

        
        
        return result;
    } catch (error) {
        // console.log(error)
        return "";
    }
};

module.exports = {
    getCallForPaper,
};