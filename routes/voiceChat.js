const express = require('express');
const multer = require('multer');
const { ChatOpenAI } = require('@langchain/openai');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI();

// Initialize LangChain components
const model = new ChatOpenAI({ temperature: 0.9 });
const memory = new BufferMemory();
const chain = new ConversationChain({ llm: model, memory: memory });

router.post('/', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No audio file uploaded.');
    }

    const audioFilePath = req.file.path;
    console.log('Received file:', req.file);
    console.log('File path:', audioFilePath);

    try {
        // Rename the file to have a .webm extension
        const newFilePath = path.join(path.dirname(audioFilePath), `${path.basename(audioFilePath)}.webm`);
        fs.renameSync(audioFilePath, newFilePath);

        // Step 1: Transcribe the audio using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(newFilePath),
            model: "whisper-1",
        });

        console.log('Transcription:', transcription.text);

        // Step 2: Process the transcript with LangChain
        const response = await chain.call({ input: transcription.text });
        console.log('LangChain response:', response.response);

        // Step 3: Convert the response to speech using OpenAI's TTS
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: response.response,
        });

        // Convert the audio buffer to base64
        const base64Audio = Buffer.from(await mp3.arrayBuffer()).toString('base64');

        res.json({
            transcription: transcription.text,
            aiResponse: response.response,
            audio: base64Audio
        });
    } catch (error) {
        console.error('Error in voice chat:', error);
        if (error.response) {
            console.error('OpenAI API response:', error.response.data);
        }
        res.status(500).json({ error: 'Error processing voice chat', details: error.message });
    } finally {
        // Clean up the uploaded file
        try {
            fs.unlinkSync(newFilePath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    }
});

module.exports = router;