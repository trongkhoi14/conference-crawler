const fs = require("fs");

module.exports.readKeywordsFromFile = (filePath) => {
    return fs
        .readFileSync(__dirname + filePath, "utf-8")
        .split("\n")
        .map((keyword) => keyword.trim());
};
