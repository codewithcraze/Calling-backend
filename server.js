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
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Create a new conference
    const conferenceName = 'MyConference';
    
    twiml.say('Welcome to the call. Please wait while we connect you to the conference.');
    
    // Dial into the conference
    const dial = twiml.dial();
    // const conference = dial.conference(conferenceName, {
    //     waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical' // Optional: URL for hold music
    // });

    // If you want to provide a number to call into the conference:
    const forwardToNumber = '+919084248821'; // Replace with the actual number
    dial.number(forwardToNumber); // This will add the number to the conference

    res.type('text/xml');
    res.send(twiml.toString());
});


// Endpoint to handle transcription
// Endpoint to handle transcription



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
