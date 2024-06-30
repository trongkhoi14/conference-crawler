const dateFinder = require("datefinder");
const moment = require("moment");

const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

const getMonthName = (monthNumber) => {
    return monthNames[parseInt(monthNumber) - 1];
};

const customDateFinder = (text) => {
    // Các mẫu regex để tìm các định dạng ngày tháng
    const patterns = [
        {
            // Mẫu: "24th June 202" (lấy năm mặc định là 2024)
            regex: /(\d{1,2})(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+202\s/gi,
            format: (m) => `${m[1]} ${m[3]} 2024`,
            multiple: false
        },
        {
            // Mẫu: "Aug 15, 2024"
            regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/gi,
            format: (m) => `${m[2]} ${m[1]} ${m[3]}`,
            multiple: false
        },
        {
            // Mẫu: "15 May 2024"
            regex: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
            format: (m) => `${m[1]} ${m[2]} ${m[3]}`,
            multiple: false
        },
        {
            // Mẫu: "10th Jun 2024"
            regex: /(\d{1,2})(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/gi,
            format: (m) => `${m[1]} ${m[3]} ${m[4]}`,
            multiple: false
        },
        {
          // Mẫu: "April 29th, 2024"
          regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})/gi,
          format: (m) => `${m[2]} ${m[1]} ${m[4]}`,
          multiple: false
        },
        {
            // Mẫu: "1st of May 2023"
            regex: /(\d{1,2})(st|nd|rd|th)?\s+of\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
            format: (m) => `${m[1]} ${m[3]} ${m[4]}`,
            multiple: false,
        },
        {
            // Mẫu: "24th April, 2023"
            regex: /(\d{1,2})(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s+(\d{4})/gi,
            format: (m) => `${m[1]} ${m[3]} ${m[4]}`,
            multiple: false,
        },
        {
            // Mẫu: "Sun 26 - Wed 29 November 2023"
            regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s*-\s*(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
            format: (m) => `${m[2]} ${m[5]} ${m[6]}`,
            multiple: true,
            endDay: (m) => `${m[4]} ${m[5]} ${m[6]}`,
        },
        {
            // Mẫu: "October 8-12, 2023"
            regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(\d{1,2})\s*,?\s+(\d{4})/gi,
            format: (m) => `${m[2]} ${m[1]} ${m[4]}`,
            multiple: true,
            endDay: (m) => `${m[3]} ${m[1]} ${m[4]}`,
        },
        {
            // Mẫu: "February, 2024"
            regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s*,?\s+(\d{4})/gi,
            format: (m) => `1 ${m[1]} ${m[2]}`,
            multiple: false
        },
        {
            // Mẫu: "September 9(Sat), 2023"
            regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*\(\w+\)\s*,?\s+(\d{4})/gi,
            format: (m) => `${m[2]} ${m[1]} ${m[3]}`,
            multiple: false
        },
        {
            // Mẫu: "Fri, October 20th, 11:59 AoE, 2023"
            regex: /(Sun|Mon|Tue|Wed|Thu|Fri|Sat),\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?,\s+(\d{2}:\d{2}\s+AoE),\s+(\d{4})/gi,
            format: (m) => `${m[3]} ${m[2]} ${m[6]}`,
            multiple: false
        },
        {
            // Mẫu: "July 7th"
            regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(st|nd|rd|th)?/gi,
            format: (m) => `${m[2]} ${m[1]} 2024`,
            multiple: false
        },
        {
            // Mẫu: "Jul 01 '24"
            regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+'(\d{2})/gi,
            format: (m) => `${m[2]} ${m[1]} 20${m[3]}`,
            multiple: false
        },
        {
            // Mẫu: "June, 30, 2024"
            regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s*,\s*(\d{1,2})\s*,\s*(\d{4})/gi,
            format: (m) => `${m[2]} ${m[1]} ${m[3]}`,
            multiple: false
        },
        {
            // Mẫu: "Jan 9th, 2024"
            regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})/gi,
            format: (m) => `${m[2]} ${m[1]} ${m[4]}`,
            multiple: false
        },
        {
            // Mẫu: "01/07/2024"
            regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/gi,
            format: (m) => `${m[1]} ${getMonthName(m[2])} ${m[3]}`,
            multiple: false
        },
        {
            // Mẫu: "26/04" (mặc định năm 2024)
            regex: /(\d{1,2})\/(\d{1,2})/gi,
            format: (m) => `${m[1]} ${getMonthName(m[2])} 2024`,
            multiple: false
        },
        {
            // Mẫu: "June, 12"
            regex: /(January|February|March|April|May|June|July|August|September|October|November|December),\s(\d{1,2})/gi,
            format: (m) => `${m[2]} ${m[1]} 2024`,
            multiple: false
        },
        {
            // Mẫu: "Oct. 18th, 2022"
            regex: /(Jan\.|Feb\.|Mar\.|Apr\.|May\.|Jun\.|Jul\.|Aug\.|Sep\.|Oct\.|Nov\.|Dec\.)\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})/gi,
            format: (m) => `${m[2]} ${m[1].replace('.', '')} ${m[4]}`,
            multiple: false
        },
        {
            // Mẫu: "14th June" (lấy năm mặc định là năm hiện tại)
            regex: /(\d{1,2})(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
            format: (m) => `${m[1]} ${m[3]} ${new Date().getFullYear()}`,
            multiple: false
        }

        // 26th-28th June, 2024
        // 2024 October 20th to 23rd
        // will be held from January 22 (Mon.) to January 25 (Thur.), 2024

    ];

    // Tìm và chuyển đổi ngày tháng từ các mẫu tùy chỉnh
    for (const pattern of patterns) {
        let match = pattern.regex.exec(text);
        if (match) {
            try {
                if (pattern.multiple) {
                    // Nếu mẫu trả về nhiều ngày, tạo một khoảng thời gian
                    const startDateStr = pattern.format(match);
                    const endDateStr = pattern.endDay(match);
                    const startDateObj = moment(
                        startDateStr,
                        "D MMMM YYYY",
                        true
                    );
                    const endDateObj = moment(endDateStr, "D MMMM YYYY", true);

                    if (startDateObj.isValid() && endDateObj.isValid()) {
                        const dates = [];
                        let currentDate = startDateObj.clone();

                        while (currentDate <= endDateObj) {
                            dates.push(currentDate.toDate());
                            currentDate.add(1, "days");
                        }

                        return dates;
                    }
                } else {
                    // Nếu mẫu chỉ trả về một ngày
                    const dateStr = pattern.format(match);

                    const formatDate = new Date(dateStr);

                    const formatDateISO = new Date(
                        formatDate.getTime() -
                            formatDate.getTimezoneOffset() * 60000
                    ).toISOString();

                    return [
                        {
                            date: formatDateISO,
                        }
                    ]
                   
                }
            } catch (e) {
                // Bỏ qua lỗi chuyển đổi
            }
        }
    }

    // Sử dụng thư viện datefinder để tìm thêm các ngày tháng (nếu không có mẫu nào khớp)
    return dateFinder(text);
};

const formatDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Tháng trong JavaScript bắt đầu từ 0
    const year = date.getFullYear();

    // Trả về chuỗi đã được định dạng ngày/tháng/năm
    return `${day}/${month}/${year}`;
};

// Tiền xử lý trước khi trích xuất ngày tháng
const formatStringDate = (str) => {
    return str
        .replace(/(\s0)([1-9])\b/g, "$2")
        .replace(/(\d+)(st|nd|rd|th),/g, "$1,");
};

const extractDates = (event) => {
    // Sử dụng biểu thức chính quy để trích xuất các ngày tháng
    const datePattern = /(\w+ \d{1,2}) - (\d{1,2}), (\d{4})/;
    const match = event.match(datePattern);

    if (match) {
        const monthDayStart = match[1]; // Tháng và ngày bắt đầu
        const dayEnd = match[2]; // Ngày kết thúc
        const year = match[3]; // Năm

        const startDateString = `${monthDayStart} ${year}`;
        const endDateString = `${
            monthDayStart.split(" ")[0]
        } ${dayEnd} ${year}`;

        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);

        // Đảm bảo đúng múi giờ UTC
        const startDateISO = new Date(
            startDate.getTime() - startDate.getTimezoneOffset() * 60000
        ).toISOString();
        const endDateISO = new Date(
            endDate.getTime() - endDate.getTimezoneOffset() * 60000
        ).toISOString();
        return {
            startDate: startDateISO,
            endDate: endDateISO,
        };
    } else {
        return null; // Trường hợp không khớp với biểu thức chính quy
    }
};

// Định dạng October 8-12, 2023
const extractDates2 = (event) => {
    // Sử dụng biểu thức chính quy để trích xuất các ngày tháng
    const datePattern = /([A-Z][a-z]+ \d{1,2})-(\d{1,2}), (\d{4})/;
    const match = event.match(datePattern);

    if (match) {
        const monthDayStart = match[1]; // Tháng và ngày bắt đầu
        const dayEnd = match[2]; // Ngày kết thúc
        const year = match[3]; // Năm

        // Tạo chuỗi ngày tháng hoàn chỉnh cho startDate và endDate
        const startDateString = `${monthDayStart}, ${year}`;
        const endDateString = `${
            monthDayStart.split(" ")[0]
        } ${dayEnd}, ${year}`;

        // Tạo các đối tượng Date
        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);

        // Đảm bảo đúng múi giờ UTC
        const startDateISO = new Date(
            startDate.getTime() - startDate.getTimezoneOffset() * 60000
        ).toISOString();
        const endDateISO = new Date(
            endDate.getTime() - endDate.getTimezoneOffset() * 60000
        ).toISOString();

        return {
            startDate: startDateISO,
            endDate: endDateISO,
        };
    } else {
        return null; // Trường hợp không khớp với biểu thức chính quy
    }
};

// Định dạng 24th April, 2023
const convertDateInString = (str) => {
    const dateRegex = /(\d+)(st|nd|rd|th)\s([A-Za-z]+),\s(\d{4})/;
    const match = str.match(dateRegex);
    const dateString = `${match[3]} ${match[1]}, ${match[4]}`;
    return str.replace(dateRegex, dateString);
};

// Định dạng 1st of May 2023
const convertDateInString2 = (str) => {
    const dateRegex = /(\d+)(st|nd|rd|th)( of)? ([A-Za-z]+) (\d{4})/;
    const match = str.match(dateRegex);
    const dateString = `${match[4]} ${match[1]}, ${match[5]}`;
    return str.replace(dateRegex, dateString);
};

// Định dạng Sun 26 - Wed 29 November 2023
const convertDateInString3 = (str) => {
    try {
        const dateRegex =
            /(\w{3})\s(\d{1,2})\s-\s\w{3}\s(\d{1,2})\s([A-Za-z]+)\s(\d{4})/;
        let match = str.match(dateRegex);
        const dateString = `${match[4]} ${match[2]}, ${match[5]}. ${match[4]} ${match[3]}, ${match[5]}`;
        return str.replace(dateRegex, dateString);
    } catch (err) {
        return "";
    }
};

module.exports = {
    formatDate,
    formatStringDate,
    extractDates,
    extractDates2,
    convertDateInString,
    convertDateInString2,
    convertDateInString3,
    customDateFinder,
};
