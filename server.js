const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const config = require('./config');

const app = express();

// Update CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' // Replace with your frontend URL
}));

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

// Add a simple root route for testing
app.get('/', (req, res) => {
  res.send('Interactive Language Learning Backend is running!');
});

// Update PORT assignment
const PORT = process.env.PORT || config.port || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
