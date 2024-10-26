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
const VoiceResponse = require('twilio').twiml.VoiceResponse;

// Connect to MongoDB
mongoose.connect('mongodb+srv://codewithdeepakin:codewithdeepakin@cluster0.t02huib.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define a schema for call transcriptions
const transcriptionSchema = new mongoose.Schema({
    callSid: String,
    recordingUrl: String,
    transcriptionText: String,
    createdAt: { type: Date, default: Date.now }
});

const Transcription = mongoose.model('Transcription', transcriptionSchema);

// Update with your own phone number in E.164 format
const MODERATOR = '+917037913778';

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Incoming call route
app.post('/incoming-call', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    // Get the number to dial from the request
    const toNumber = "+919084248821"; // Assuming you pass the number in the request body

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
    const callSid = req.body.CallSid; // Call SID from Twilio

    // Optionally, transcribe the recording here or use Twilio's transcription service
    const transcription = await transcribeRecording(recordingUrl); // Implement this function

    // Save transcription to MongoDB
    const newTranscription = new Transcription({
        callSid,
        recordingUrl,
        transcriptionText: transcription,
    });
    await newTranscription.save();

    res.send('Transcription saved successfully.');
});

// Transcribe the recording (using a placeholder function)
async function transcribeRecording(recordingUrl) {
    // Call Twilio's transcription API
    const transcription = await client.transcriptions.create({
        recordingSid: recordingUrl.split('/').pop(), // Extract recording SID from the URL
    });
    return transcription.transcriptionText; // Adapt this as needed
}

// Endpoint to make an outgoing call
app.post('/make-call', async (req, res) => {
    const { countryCode, phoneNumber, toNumber } = req.body; // The number to dial
    const toDial = toNumber || "+" + countryCode + phoneNumber; // Use toNumber if provided

    try {
        const call = await client.calls.create({
            to: toDial,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `https://calling-backend-one.vercel.app/incoming-call`, // Replace with your actual URL
            statusCallback: `https://calling-backend-one.vercel.app/recording-completed`, // Add a callback URL if needed
            statusCallbackEvent: ['completed'], // Trigger callback only when call is completed
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
