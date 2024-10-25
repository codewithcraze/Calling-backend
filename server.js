const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
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

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Endpoint to handle incoming calls
app.post('/incoming-call', (req, res) => {
    console.log('Incoming call received');

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Please leave a message after the beep.');

    // Record the user's voice
    twiml.record({
        transcribe: true,
        transcribeCallback: '/transcribe', // Set the callback URL for transcription
        maxLength: 120, // Max length of recording
        action: '/handle-recording', // Callback after recording
    });

    res.type('text/xml');
    res.send(twiml.toString());
});

// Endpoint to handle transcription
// Endpoint to handle transcription
app.post('/transcribe', (req, res) => {
    console.log('Transcription request received:', req.body);

    const transcriptionText = req.body.TranscriptionText; // Check the correct property name
    console.log('Transcription received:', transcriptionText);

    if (transcriptionText) {
        // Save the transcription to a file
        const logEntry = `Transcription: ${transcriptionText}\nTimestamp: ${new Date().toISOString()}\n\n`;
        console.log(logEntry);
        res.send('Working');
    } else {
        console.error('No transcription text received');
        res.sendStatus(400); // Bad request if there's no transcription
    }
});


// Endpoint to make an outgoing call
app.post('/make-call', async (req, res) => {
    const { countryCode, phoneNumber } = req.body; // The phone number to call
    const toNumber = "+" + countryCode + phoneNumber;

    try {
        const call = await client.calls.create({
            to: toNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `https://calling-backend-one.vercel.app/incoming-call`, // URL to handle the call
        });
        console.log('Call initiated:', call.sid);
        res.send(`Call initiated to ${toNumber}`);
    } catch (err) {
        console.error('Error making call:', err);
        res.status(500).send('Error making call: ' + err.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
