const express = require('express');
const path = require('path');
const router = express.Router();
const { loadVideos } = require('../utils');

const videos = loadVideos();

router.get('/current-video', (req, res) => {
    console.log('request came in to current-video');
    const videoId = req.query.videoId || 1; // Default to the first video if no videoId is provided
    const currentVideo = videos.videos[videoId];

    if (!currentVideo) {
        return res.status(404).json({ error: 'Video not found' });
    }

    const videoResponse = {
        id: videoId,
        clip_name: currentVideo.clip_name,
        clip_text: currentVideo.clip_text,
        url: `/backend/videos/${currentVideo.url}`
    };
    console.log('videoResponse: ', videoResponse);
    res.json(videoResponse);
});

// Ensure the path here matches the request
router.get('/videos/:clip', (req, res) => {
    const clip = req.params.clip;
    res.sendFile(path.join(__dirname, `../videos/${clip}`));
});

module.exports = router;
