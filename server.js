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
        res.send('Hello World')
    })



    // Endpoint to handle incoming calls
// Endpoint to handle incoming calls
app.post('/incoming-call', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say('Hello'); // Respond with "Hello"

    res.type('text/xml');
    res.send(twiml.toString());
});


    // Endpoint to generate Twilio Access Token
    app.get('/token', (req, res) => {
        const { jwt: { AccessToken }, VoiceGrant } = twilio;

        const identity = 'user'; // Replace with user identity
        const token = new AccessToken(accountSid, process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET);
        token.identity = identity;

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: process.env.TWILIO_APP_SID,
            incomingAllow: true,
        });
        token.addGrant(voiceGrant);

        res.send({ token: token.toJwt() });
    });

    // Endpoint to log call details
    app.post('/log-call', (req, res) => {
        const callDetails = `Caller: ${req.body.From}, Duration: ${req.body.CallDuration}, Timestamp: ${new Date().toISOString()}\n`;
        fs.appendFile('call-log.txt', callDetails, (err) => {
            if (err) {
                return res.status(500).send('Error logging call details');
            }
            res.send('Call details logged successfully');
        });
    });

    // Endpoint to make an outgoing call
    app.post('/make-call', async (req, res) => {
        const { countryCode, phoneNumber } = req.body; // The phone number to call
        const toNumber = "+" + countryCode + phoneNumber;

        console.log(`${req.protocol}://${req.get('host')}/incoming-call`)

        try {
            const call = await client.calls.create({
                to: toNumber,
                from: process.env.TWILIO_PHONE_NUMBER,
                url: `${req.protocol}://${req.get('host')}/incoming-call`, // URL to handle the call
            });
            console.log('Call initiated:', call.sid);
            res.send(`Call initiated to ${toNumber}`);
        } catch (err) {
            console.error('Error making call:', err);
            res.status(500).send('Error making call: ' + err.message); // Include error message for better debugging
        }
    });

    // Start the server
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
