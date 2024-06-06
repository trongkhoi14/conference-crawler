// Danh sách các hội nghị có link chưa chính xác

// Cào bằng tên
/*
const conferenceHasIncorrectLinks = [
    "6639c19c6e0c3f3fe99c5633",
    "6639c1a86e0c3f3fe99c5641",
    "6639c1b06e0c3f3fe99c5649",
    "6639c2744931f50e65517e3b",
    "6639c2874931f50e65517e4f",
    "6639c2934931f50e65517e5b",
    "6639c29c4931f50e65517e63",
    "6639c2a04931f50e65517e67",
    "6639c38bbf0a76d1ef717bad",
    "6639c3a7bf0a76d1ef717bc9",
    "6639c48f078f0b3454c91b8a",
    "6639c49c078f0b3454c91b96",
    "6639c4fa078f0b3454c91be8",
    "6639c500078f0b3454c91bee",
    "6639c529078f0b3454c91c14",
    "6639c52f078f0b3454c91c1a",
    "6639c54b078f0b3454c91c34",
    "6639c554078f0b3454c91c3c",
    "6639c6914c771c093141cb86",
    "6639c6934c771c093141cb88",
    "6639c6be4c771c093141cbb2",
    "6639c6c84c771c093141cbbc",
    "6639c6cd4c771c093141cbc0",
    "6639c6f24c771c093141cbe2",
    "6639c73c4c771c093141cc28",
    "6639ced2c521b3f2ad611485",
    "6639cef6c521b3f2ad6114a5",
    "6639cf26c521b3f2ad6114cf",
    "6639cf37c521b3f2ad6114dd",
    "6639cf41c521b3f2ad6114e7",
    "6639cf75c521b3f2ad611519",
    "6639cf77c521b3f2ad61151b",
    "6639cf7bc521b3f2ad61151f",
    "6639cf84c521b3f2ad611527",
    "6639d0292aa97d8b88806045",
    "6639d0442aa97d8b88806061",
    "6639d0822aa97d8b8880609b",
    "6639d09f2aa97d8b888060b7",
    "6639d0ab2aa97d8b888060c3",
    "6639d0ad2aa97d8b888060c5",
    "6639d0b12aa97d8b888060c7",
    "6639d141387369a89705860d",
    "6639d14c387369a897058619",
    "6639d17e387369a897058647",
    "6639d184387369a89705864d",
    "6639d194387369a89705865d",
    "6639d1cd387369a897058695",
    "6639d32d8fb9939b82bceaf3",
    "6639d33a8fb9939b82bceafd",
    "6639d33c8fb9939b82bceaff",
    "6639d3468fb9939b82bceb09",
    "6639d3638fb9939b82bceb21",
    "6639d3698fb9939b82bceb27",
    "6639d3778fb9939b82bceb33",
    "6639d3898fb9939b82bceb3f",
    "6639d3988fb9939b82bceb4d",
    "6639d3d18fb9939b82bceb7f",
    "6639d3d48fb9939b82bceb81",
    "6639d3e98fb9939b82bceb93",
    "6639d3f48fb9939b82bceb9d",
    "6639d4048fb9939b82bcebab",
    "6639d4078fb9939b82bcebad",
    "6639d4dd4fd45eb8c2e6704e",
    "6639d4f44fd45eb8c2e67060",
    "6639d4fe4fd45eb8c2e67068",
    "6639d5004fd45eb8c2e6706a",
];
*/
// Cào bằng tên viết tắt
/*
const conferenceHasIncorrectLinks = [
    "6639c083647e53b594533ce3", // link 1
    "6639c1ae6e0c3f3fe99c5647", // link 1, không có date --> chỉnh point về 
    "6639c397bf0a76d1ef717bb9", // link 1, không load được trang
    "6639c3b2bf0a76d1ef717bd5",
    "6639c3b7bf0a76d1ef717bdb",
    "6639c3b9bf0a76d1ef717bdd",
    "6639c3c2bf0a76d1ef717be7",
    "6639c4b0078f0b3454c91ba8",
    "6639c4d9078f0b3454c91bce",
    "6639c4dc078f0b3454c91bd0",
    "6639c6854c771c093141cb7a",
    "6639ceb8c521b3f2ad61146d",
    "6639cee8c521b3f2ad611499",
    "6639ceedc521b3f2ad61149d",
    "6639d0802aa97d8b88806099",
    "6639d0862aa97d8b8880609f",
    "6639d0972aa97d8b888060af",
    "6639d09d2aa97d8b888060b5",
    "6639d11e387369a8970585eb",
    "6639d12f387369a8970585fb",
    "6639d3358fb9939b82bceaf9",
    "6639d3578fb9939b82bceb17",
    "6639d39c8fb9939b82bceb51",
    "6639d3aa8fb9939b82bceb5d",
    "6639d3c48fb9939b82bceb73",
];

*/

// xử lý ngoại lệ
// const conferenceHasIncorrectLinks = [
//     // "6639c033647e53b594533c8d",
//     // iaria
//     // "6639c02c647e53b594533c85",
//     // "6639cf34c521b3f2ad6114db",
//     // "6639d02f2aa97d8b8880604b",
//     // "6639d0bb2aa97d8b888060d1",
//     // "6639d0b72aa97d8b888060cd",
//     // "6639d139387369a897058605",
//     // "6639d1b3387369a89705867b",
//     // DOCENG
//     // "6639c07d647e53b594533cdd",
//     // conf.researchr.org
//     // "6639c1b66e0c3f3fe99c564f", //timeout
//     // "6639c2534931f50e65517e19",
//     // "6639c2764931f50e65517e3d",
//     // "6639c39fbf0a76d1ef717bc3",
//     // "6639c69c4c771c093141cb90",
//     // "6639c4a8078f0b3454c91ba0", 
//     // "6639c6a64c771c093141cb9a",
//     // "6639c4b2078f0b3454c91baa",
//     // "6639c6df4c771c093141cbd0",
//     // "6639cf6dc521b3f2ad611511",
//     // "6639c6bc4c771c093141cbb0",
//     // "6639c7144c771c093141cc02",
//     // "6639d0482aa97d8b88806065",
//     // "6639d05e2aa97d8b88806079",
//     // "6639d05a2aa97d8b88806075",
//     // "6639d3bd8fb9939b82bceb6d",
//     // "6639d3e38fb9939b82bceb8d", 
//     // "6639d1c0387369a897058689",
//     // "6639d1c8387369a897058691",
//     // "6639d3c68fb9939b82bceb75",
//     // "6639d3f78fb9939b82bceb9f",
//     // "6639d1ca387369a897058693",
//     // "6639d3448fb9939b82bceb07",
//     // "6639d3ae8fb9939b82bceb61",
//     // "6639d13d387369a897058609",
//     // "6639d1b1387369a897058679",
//     // "6639d691b9c725a1d3ed3d83",
//     // "6639d6b7b9c725a1d3ed3da7",
//     // "6639d729b9c725a1d3ed3e11",
//     // "6639d3fa8fb9939b82bceba1",
//     // "6639d68ab9c725a1d3ed3d7d",
//     // "6639d1ac387369a897058675",

//     // Test chức năng cào location
//     // "6639d1ac387369a897058675",
//     // "6639d68ab9c725a1d3ed3d7d",
//     // "6639d3fa8fb9939b82bceba1",
//     // "6639c02c647e53b594533c85",
//     // "6639c033647e53b594533c8d",

//     // Test chức năng cào conf date
//     //"6639d3e38fb9939b82bceb8d"
// ];

const conferenceHasIncorrectLinks = [
    "6639cebac521b3f2ad61146f",
    "6639ced9c521b3f2ad61148b",
    "6639cf0ac521b3f2ad6114b7",
    "6639cf11c521b3f2ad6114bd",
    "6639cf14c521b3f2ad6114bf",
];

module.exports = conferenceHasIncorrectLinks;
