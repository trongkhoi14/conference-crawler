const { ocrSpace } = require("ocr-space-api-wrapper");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const webp = require('webp-converter');

const convertImageToText = async (imageUrl) => {
    let outputFilePath = imageUrl
    if(imageUrl.includes(".webp")) {
        await convertWebP(imageUrl, "./img/banner.png")
        outputFilePath = "./img/banner.png";
    }
    try {
        let result = await ocrSpace(
            outputFilePath, 
            { apiKey: `${process.env.OCR_SPACE_KEY}` }
        );

        return result.ParsedResults[0].ParsedText
    } catch (error) {
        console.error(error);
    }
};

const downloadImage = async (url, filepath) => {
    const writer = fs.createWriteStream(filepath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

const convertWebP = async (imageUrl, outputFilePath) => {
    try {
        // Determine the file name and path to save the downloaded image
        const fileName = path.basename(imageUrl);
        const downloadPath = path.join(__dirname, fileName);

        // Download the image
        await downloadImage(imageUrl, downloadPath);

        // Convert the downloaded image
        const result = await webp.dwebp(downloadPath, outputFilePath, "-o", logging="-v");

        // Clean up the downloaded file if needed
        // fs.unlinkSync(downloadPath);

        return result;
    } catch (error) {
        console.error("Error converting WebP image:", error);
    }
}



module.exports = {
    convertImageToText,
};

// const axios = require('axios');
// const FormData = require('form-data');
// const fs = require('fs');
// const path = require('path');
// const webp = require('webp-converter');

// // Hàm chuyển đổi ảnh từ WebP sang định dạng khác
// const convertWebP = async (inputFilePath, outputFilePath) => {
//     try {
//         const result = await webp.dwebp(inputFilePath, outputFilePath, "-o");
//         console.log("Conversion result:", result);
//         return result;
//     } catch (error) {
//         console.error("Error converting WebP image:", error);
//         throw error;
//     }
// };

// // Hàm tải ảnh từ URL về máy
// const downloadImage = async (url, filepath) => {
//     const writer = fs.createWriteStream(filepath);

//     const response = await axios({
//         url,
//         method: 'GET',
//         responseType: 'stream'
//     });

//     response.data.pipe(writer);

//     return new Promise((resolve, reject) => {
//         writer.on('finish', resolve);
//         writer.on('error', reject);
//     });
// };

// // Hàm chuyển đổi ảnh sang văn bản
// const convertImageToText = async (imageUrl) => {
//     let outputFilePath = imageUrl;
    
//     const isWebp = imageUrl.includes(".webp");
//     const isRemote = imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
    
//     if (isRemote) {
//         const fileName = path.basename(imageUrl);
//         const downloadPath = path.join(__dirname, fileName);

//         await downloadImage(imageUrl, downloadPath);
//         outputFilePath = downloadPath;
//     }

//     if (isWebp) {
//         const convertedPath = "./img/nodejs_logo.png";
//         await convertWebP(outputFilePath, convertedPath);
//         outputFilePath = convertedPath;
//     }

//     try {
//         const formData = new FormData();
//         console.log(outputFilePath)
//         formData.append('image', fs.createReadStream(outputFilePath));

//         const response = await axios.post('https://api.api-ninjas.com/v1/imagetotext', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//                 'X-Api-Key': "KH4SDBB4jpeuJcgRxUch3Q==IxnE2rG8uSauYOac",
//                 ...formData.getHeaders()
//             }
//         });

//         return response.data;
//     } catch (error) {
//         console.error("Error during OCR:", error);
//         throw error;
//     } finally {
//         if (isRemote) {
//             fs.unlinkSync(outputFilePath);
//         }
//     }
// };

// module.exports = {
//     convertImageToText,
// };



