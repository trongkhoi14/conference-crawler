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

module.exports = {
    formatDate,
    formatStringDate
}