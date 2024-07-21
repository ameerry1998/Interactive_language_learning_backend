const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const config = require('./config');
const app = express();

// Update CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
console.log('Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    console.log('Request origin:', origin);
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Update PORT assignment
const PORT = process.env.PORT || config.port || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
