const dateFinder = require("datefinder");

const formatDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Tháng trong JavaScript bắt đầu từ 0
    const year = date.getFullYear();

    // Trả về chuỗi đã được định dạng ngày/tháng/năm
    return `${day}/${month}/${year}`;
}

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
      const endDateString = `${monthDayStart.split(' ')[0]} ${dayEnd} ${year}`;  
  
      const startDate = new Date(startDateString);
      const endDate = new Date(endDateString);
  
      // Đảm bảo đúng múi giờ UTC
      const startDateISO = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString();
      const endDateISO = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString();
      return {
        startDate: startDateISO,
        endDate: endDateISO
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
    return str.replace(dateRegex, dateString)
}

// Định dạng 1st of May 2023
const convertDateInString2 = (str) => {
    const dateRegex = /(\d+)(st|nd|rd|th)( of)? ([A-Za-z]+) (\d{4})/;
    const match = str.match(dateRegex);
    const dateString = `${match[4]} ${match[1]}, ${match[5]}`;
    return str.replace(dateRegex, dateString)

}

// Định dạng Sun 26 - Wed 29 November 2023
const convertDateInString3 = (str) => {
  try {
    const dateRegex = /(\w{3})\s(\d{1,2})\s-\s\w{3}\s(\d{1,2})\s([A-Za-z]+)\s(\d{4})/;
    let match = str.match(dateRegex);
    const dateString = `${match[4]} ${match[2]}, ${match[5]}. ${match[4]} ${match[3]}, ${match[5]}`;
    return str.replace(dateRegex, dateString)
  } catch (err) {
    return ""
  }
 
}

module.exports = {
    formatDate,
    formatStringDate,
    extractDates,
    convertDateInString,
    convertDateInString2,
    convertDateInString3
}