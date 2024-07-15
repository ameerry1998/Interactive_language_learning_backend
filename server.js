const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use('/static', express.static(__dirname));
app.use(express.json());

// Serve static video files
app.use('/backend/videos', express.static(path.join(__dirname, 'videos')));

// Existing routes
app.use('/api', require('./routes/video'));
app.use('/api/process-speech', require('./routes/processSpeech'));

// Voice chat route
app.use('/api/voice-chat', require('./routes/voiceChat'));

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});