// utils.js
const fs = require('fs');
const path = require('path');
const config = require('./config');

const validateFileFormat = (fileExtension) => {
    return config.allowedFormats.includes(fileExtension.toLowerCase());
};

function loadVideos() {
    const data = fs.readFileSync(path.join(__dirname, 'video_graph.json'), 'utf8');
    return JSON.parse(data);
}

module.exports = {
    validateFileFormat,
    loadVideos
};
