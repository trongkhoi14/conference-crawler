
module.exports.formatDate = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Tháng trong JavaScript bắt đầu từ 0
    const year = date.getFullYear();

    // Trả về chuỗi đã được định dạng ngày/tháng/năm
    return `${day}/${month}/${year}`;
}