const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { OpenAI } = require('openai');
const { validateFileFormat, loadVideos } = require('../utils');

const router = express.Router();
const videos = loadVideos();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

const openai = new OpenAI();

router.post('/', upload.single('file'), async (req, res) => {
    console.log('Received request to /api/process-speech');
    console.log('File metadata:', req.file);
    const audioFilePath = req.file.path;
    const audioFileOriginalName = req.file.originalname;
    const audioFileMimeType = req.file.mimetype || 'audio/wav';

    console.log(`File uploaded to: ${audioFilePath}`);
    console.log(`Original file name: ${audioFileOriginalName}`);
    console.log(`MIME type: ${audioFileMimeType}`);

    const fileExtension = audioFileOriginalName.split('.').pop().toLowerCase();

    if (!validateFileFormat(fileExtension)) {
        console.error('Unsupported file format:', fileExtension);
        return res.status(400).json({ error: `Unsupported file format: ${fileExtension}. Supported formats: ${config.allowedFormats.join(', ')}` });
    }

    try {
        console.log('Creating read stream for file:', audioFilePath);
        const audioFile = fs.createReadStream(audioFilePath);

        // Step 1: Transcription using OpenAI's Whisper
        const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: audioFile,
            response_format: 'json',
            language: 'en',
            task: 'transcribe'
        });

        const transcript = transcription.text.toLowerCase();
        console.log(`Raw transcription received: ${transcription.text}`);
        console.log(`Lowercase transcription to be processed: ${transcript}`);

        const currentVideoId = req.body.currentVideoId;
        console.log('currentVideoId:', currentVideoId);

        const currentVideo = videos.videos[currentVideoId];
        console.log('currentVideo:', currentVideo);

        if (!currentVideo) {
            return res.status(404).json({ error: 'Current video not found' });
        }

        const responsesText = currentVideo.responses.map(r => `"${r.Response}"`).join(', ');
        console.log('Possible responses:', responsesText);

        // Step 2: Response Selection using GPT-4
        console.log('Sending the following to GPT-4:');
        console.log('Transcript:', transcript);
        console.log('Responses:', responsesText);

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {"role": "system", "content": "You are a helpful assistant that selects the best matching response from a list of possible responses based on a given transcript."},
                {"role": "user", "content": `Transcript: "${transcript}"\nPossible responses: ${responsesText}\nChoose the best matching response. Your answer should be the exact text of the selected response.`}
            ],
            temperature: 0,
        });

        const selectedResponse = completion.choices[0].message.content.trim();
        console.log(`Selected response from GPT-4: ${selectedResponse}`);

        let nextVideoId;
        for (const response of currentVideo.responses) {
            if (selectedResponse.includes(response.Response)) {
                console.log('Found a response match');
                nextVideoId = response.next_video;
                console.log('nextVideoId:', nextVideoId);
                break;
            }
        }

        if (!nextVideoId) {
            return res.status(400).json({ error: 'No matching response found' });
        }

        const nextVideo = videos.videos[nextVideoId];
        if (!nextVideo) {
            return res.status(404).json({ error: 'Next video not found' });
        }

        const videoResponse = {
            id: nextVideoId,
            clip_name: nextVideo.clip_name,
            clip_text: nextVideo.clip_text,
            url: `/backend/videos/${nextVideo.url}`
        };

        res.json({ nextVideo: videoResponse });
    } catch (error) {
        console.error('Error processing speech with OpenAI:', error.message, error);
        res.status(500).json({ error: 'Error processing speech with OpenAI' });
    } finally {
        fs.unlinkSync(audioFilePath);
    }
});

module.exports = router;