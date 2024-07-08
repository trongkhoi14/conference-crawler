const type_offline = [
    "will be held on-site",
    "F2F Presentations",
    "physical meeting",
    "physical conference",
    "in-person presentation",
    "no synchronous virtual",
    "live conference",
    "remote presentations are not allowed",
    "Paper presentation can be delivered on-site",
    "present their paper in person",
    "no hybrid mode",
    "face-to-face",
    "onsite participants",
    "In-Person Presenters",
    "in-person event only",
    "in person conference",
    "in-person conference",
    "in-person event",
    "presented in person",
    "present their work in person",
    "attend in person",
    "Physically (on-site)",
    "(physically) present",
    "will be in-person",
    "in-person meetings",
    "In Person:",
    "offline"
]

const type_online = [
    "online only participation option",
    "online presentations",
    "Virtual Presentations",
    "remote participation",
    "Online Attendance",
    "Virtual Conference", 
    "virtual conference",
    "Virtual Conference Venue", 
    "only participating remotely",
    "Virtual Participation",
    "Remote attendance",
    "remote presentation",
    "online participation",
    "will be held online",
    "take place online",
    "only remote",
    "remote option",
    "fully ONLINE",
    "Remotely (on-line)",
    "Virtual Access",
    ", Online (Virtual)",
    "(online)"
    // "remote", 
    // "virtual", 

];

const type_hybrid = [
    "consist of a virtual and a physical meeting",
    "A hybrid event",
    "online presentation is possible",
    "while also supporting remote attendance",
    "in-person or virtually",
    "physical presence or virtual participation",
    "in-person conference with virtual elements",
    "remote presentation options",
    "allowed to present remotely",
    "a virtual and a physical meeting",
    "Online & In-person participation", 
    "Remote Presentation Option",
    "in-person and online",
    "hybrid support", 
    "online and face-to-face", 
    "online participation options",
    "both online and onsite participants",
    "to be organized in hybrid",
    "an option to present remotely",
    "Dual-Mode Conference",
    "option to attend remotely",
    "will be held as Hybrid",
    "support for remote",
    "support online participation",
    "online attendance possible",
    "possibility for remote presentation",
    "the opportunity to present their work in the online",
    "Onsite and Online Hybrid Event",
    "hybrid mode",
    "Hybrid Conference",
    "(format: hybrid)",
    "(Hybrid)",
    "hybrid format",
    "online and in-person",
    "will be held hybrid",
    "Remote Presentation Instructions",
    "Virtual Conference Instructions",
    "assistance for remote presentation",
    "Remote presentations can be organized",
    "WILL BY HYBRID THIS YEAR",
    "or virtually",
    "Besides online sessions, there will be pure on-site sessions",
    "both in-person and virtual participation",
    "Hybrid participation information",
    "Onsite and virtual participation available",
    "possibility of remote presentation",
    "hybrid onsite/online sessions",
    "Japan and ONLINE",
    "HYBRID EVENT",
    "(hybrid support)",
    "Hybrid @"
    // "hybrid"
];

const removeUnwantedKey = (content) => {
    let result = content
    const unwantedKey = [
        "Hybrid-Dynamic Quantum Logic",
        "hybrid conference rotation cycle",
        "Virtual Posters",
        "virtual_posters",
        "hybrid games",
        "hybrid approaches",
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
        "Blog post: Improving the hybrid conference experience",
        "virtualization technologies",
        "Hybrid Graphs",
        "Virtual Reality",
        "virtual-reality",
        "cancel the integrated virtual component",
        "hybrid AI systems",
        "virtual elements",
        "2022 - Virtual Conference",
        "2021 - Virtual Conference",
        "2020 - Virtual Conference",
        "&nbsp;– virtual conference",
        "– Virtual conference<br/>",
        "2021</a> – virtual conference<br>",
        "2020</a> – virtual conference<br>",
        "[**Virtual Conference Website**]",
        "(2022, hybrid)",
        "innovative learning and teaching approach, which integrates the best of online and face-to-face experiences",
        "Last years, iiWAS2020, iiWAS2021 and iiWAS2022 conferences were held as virtual conferences",
        "Last years, MoMM2020, MoMM2021 and MoMM2022 conferences were held as virtual conferences",
        "Due to the current pandemic, our plans may change and require a virtual conference",
        "Remote presentations and pre-recorded videos are not allowed",
        "online presentations will be accommodated only in exceptional cases",
        "remote presentations are possible only as exceptional",
        "Real-time, hybrid, and cyber-physical systems",
        "remote presentations are not allowed",
        "virtual reality",
        "Operating systems and virtualization",
        "hybrid systems",
        "Virtual and Augmented Reality",
        "separate virtual volume",
        "Hybrid Approach for High-Performance Deep Learning",
        "Virtual Personal Assistants and Cognitive Experts",
        "Virtual, Mixed and Augmented Reality",
        "Remote Memory",
        "remote presentations is not allowed",
        "The conference is not able to entertain a hybrid option, a remote presentation",
        "with the exception of workshops, which may be conducted either in-person or virtually",
        "multi-theme hybrid conference which groups AMSTA-22, HCIS-22, IDT-22, InMed-22, SEEL-22 and STS-22 in one venue",
        "VECoS 2021</a> in Beijing as a virtual conference due to COVID'19",
        "<dd><small>Hybrid Conference, Oklahoma City, USA</small></dd>",
        "<dd><small>virtual conference</small></dd>",
        `<a href="vcc.php" class="astyle2">KES Virtual Conference Centre</a>`,
        "virtual conference due to COVID-19",
        "ICSIP 2020 | Virtual Conference",
        "Virtual participation in the conference will no longer be supported",
        "this has changed only for 2021 virtual conference",
        "hybrid models",
        "Policy regarding Remote Presentation",
        "remote presentations or videos will not be accepted",
        "Any allowance for remote presentation will be considered only after clear evidence that attendance is impossible",
        "We expect to hold a hybrid conference (virtual + physical). We look forward to meeting you in Singapore",
        "IEEE ICNP 2021 conference will be held as a full virtual conference",
        "virtual conference platform</a>, or if you are in-person attendee in Guangzhou",
        "not transmit on-site presentations outside the conference (online)",
        `<a href="https://bpm2024.agh.edu.pl/" rel="home">Virtual Conference</a>`,
        "Israel (online) 2021",
        "2021</span></a><span> in Daejeon (hybrid)",
        "Simulation Around the World (Hybrid)",
        "virtual conference site",
        "as in no hybrid mode",
        // Selector
        `data-facet-badge="Remote"`,
        `<span class="label-primary label">Remote</span>`,
        `<!-- <a class="dropdown-item" href="/2024/virtual.php">
            Remote attendance
        </a>`,
        
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
        // let bodyContent = await page.evaluate(() => document.documentElement.innerText.toLowerCase());
        let bodyContent = await page.content()
        bodyContent = bodyContent.replace(/<!--[\s\S]*?-->/g, '');
        bodyContent = removeUnwantedKey(bodyContent)
        const containsKeyword = (content, keywords) => {
            for (const keyword of keywords) {
                if (content.toLowerCase().includes(keyword.toLowerCase())) {
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

        // console.log(callPageContent)
        
        if (containsKeyword(callPageContent, type_hybrid)) {
            isHybrid = true;
        }
        if (containsKeyword(callPageContent, type_online)) {
            isOnline = true;
        }
        if (containsKeyword(callPageContent, type_offline)) {
            isOffline = true;
        }

        if(!isHybrid && !isOnline && !isOffline) {
            // Navigate to "Registration" 
            let registrationPageContent = await clickAndReload(page, "Registration");
            registrationPageContent = removeUnwantedKey(registrationPageContent)

            if (containsKeyword(registrationPageContent, type_hybrid)) {
                isHybrid = true;
            }
            if (containsKeyword(registrationPageContent, type_online)) {
                isOnline = true;
            }
            if (containsKeyword(registrationPageContent, type_offline)) {
                isOffline = true;
            }
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
                "call-for-contributions-acm/papers/",
                "Call for Contributions",
                "page_id=145",
                "CFP",
            ];
            
            const findLink = (texts) => {
                for (const t of texts) {
                    const link = Array.from(document.querySelectorAll("a, link")).find(
                        (a) =>
                            a.href !== "https://aclrollingreview.org/cfp" &&
                            (
                            a.innerHTML.toLowerCase().includes(t.toLowerCase()) ||
                            a.href.toLowerCase().includes(t.toLowerCase()) 
                            )
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

            if (link) {
                link.click();
            }
        }, text);

        await page.waitForNavigation({ waitUntil: "domcontentloaded" });

        return await page.content();
    } catch (error) {
        return "";
    }
};

module.exports = {
    getType,
};