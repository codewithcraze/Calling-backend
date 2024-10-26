const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Connect to MongoDB
// (async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URI);
//         console.log('Connected to MongoDB');
//     } catch (error) {
//         console.error('MongoDB connection error:', error);
//     }
// })();

// // Define a schema for call transcriptions
// const transcriptionSchema = new mongoose.Schema({
//     callSid: String,
//     recordingUrl: String,
//     transcriptionText: String,
//     createdAt: { type: Date, default: Date.now }
// });

// const Transcription = mongoose.model('Transcription', transcriptionSchema);

// Update with your own phone number in E.164 format
const MODERATOR = '+917037913778';

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Incoming call route
app.post('/incoming-call', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    // Get the number to dial from the request
    const toNumber = "+919084248821"; // Replace with dynamic number if needed

    // Welcome message
    twiml.say('Welcome to the call. Connecting you now.');

    // Dial the specified number
    const dial = twiml.dial();
    dial.number(toNumber); // Dial the number directly

    // Send the TwiML response
    res.type('text/xml');
    res.send(twiml.toString());
});

// Webhook for recording completion
app.post('/recording-completed', async (req, res) => {
    const recordingUrl = req.body.RecordingUrl;
    const callSid = req.body.CallSid;

    console.log('Incoming request:', req.body);

    // Check if recordingUrl is defined
    if (!recordingUrl) {
        console.error('Recording URL is undefined.');
        return res.status(400).send('Recording URL is required.');
    }

    try {
        // Save recording info to MongoDB without transcription for now
        // const newTranscription = new Transcription({
        //     callSid,
        //     recordingUrl,
        //     transcriptionText: 'Transcription not available yet',
        // });
        // await newTranscription.save();

        res.send('Recording info saved, transcription will follow.');
    } catch (error) {
        console.error('Error saving recording:', error);
        res.status(500).send('Error saving recording: ' + error.message);
    }
});

// Webhook for transcription completion
app.post('/transcription-completed', async (req, res) => {
    const { TranscriptionText, RecordingSid } = req.body;

    if (!TranscriptionText) {
        return res.status(400).send('No transcription text found.');
    }

    try {
        // Update transcription text in MongoDB
        // await Transcription.findOneAndUpdate(
        //     { callSid: RecordingSid },
        //     { transcriptionText: TranscriptionText }
        // );

        console.log(TranscriptionText);

        res.send('Transcription updated successfully.');
    } catch (error) {
        console.error('Error updating transcription:', error);
        res.status(500).send('Error updating transcription: ' + error.message);
    }
});

// Endpoint to make an outgoing call
app.post('/make-call', async (req, res) => {
    const { countryCode, phoneNumber, toNumber } = req.body;
    const toDial = toNumber || "+" + countryCode + phoneNumber;

    try {
        const call = await client.calls.create({
            to: toDial,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `https://calling-backend-one.vercel.app/incoming-call`, // Your actual URL
            statusCallback: `https://calling-backend-one.vercel.app/recording-completed`, // Recording callback
            statusCallbackEvent: ['completed'],
            record: true, // Enable call recording
            transcribe: true, // Enable transcription
            transcribeCallback: `https://calling-backend-one.vercel.app/transcription-completed` // Transcription callback
        });

        console.log('Call initiated:', call.sid);
        res.send(`Call initiated to ${toDial}`);
    } catch (err) {
        console.error('Error making call:', err);
        res.status(500).send('Error making call: ' + err.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
