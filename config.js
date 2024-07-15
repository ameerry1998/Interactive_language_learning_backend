// config.js
module.exports = {
    allowedFormats: ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'],
    uploadDirectory: 'uploads/',
    videosFilePath: './video_graph.json',
    port: process.env.PORT || 5000,
    whisperModel: 'whisper-1'
};
