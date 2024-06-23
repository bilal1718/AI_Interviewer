const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const pino = require('express-pino-logger')();
const { generateToken } = require('./tokens');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(pino);
const twilio = require('twilio');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();
const PORT = process.env.PORT || 8000;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, {
  lazyLoading: true,
});
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
let chatHistory = [];
let feedbackMessage = "";
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20;
async function translateText(text, targetLanguage='en') {
    const params = {
        "api-version": "3.0",
        "to": targetLanguage
    };
    try {
        const response = await axios.post(`https://api.cognitive.microsofttranslator.com/translate`,
            [{ text }],
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': `d686bd67b071445a9c2af216f64b8b58`,
                    'Ocp-Apim-Subscription-Region': 'southeastasia',
                    'Content-Type': 'application/json'
                },
                params
            }
        );
        const translation = response.data[0].translations[0].text;
        console.log(`Original: ${text}`);
        console.log(`Translated (${targetLanguage}): ${translation}`);
        return translation;
    } catch (error) {
        console.error(`Error translating text to ${targetLanguage}:`, error);
    }}
app.all('/twiml', (req, res) => {
  console.log('Received request for TwiML');
  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Say voice="alice">${feedbackMessage}</Say></Response>`);
});
let chatLanguage="";
app.post('/setup', async (req, res) => {
  try {
    const initialResponses = req.body.initialResponses;
    const selectedLanguage = req.body.language || 'en';
    chatLanguage=selectedLanguage;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const initialSetup = Object.values(initialResponses).map(response => ({
      role: "user",
      parts: [{ text: response }]
    }));

    const chat = model.startChat({ history: initialSetup });
    const initialMessage =
      `As you know from user history,
      the user's job title, years of experience, skills, industry of interest,
      job type preferred, preferred work location, and type of company of interest.
      Take the user's mock interview. Ask short and concise question.  Generate the first question only.`;
    const result = await chat.sendMessage(initialMessage);
    const response = result.response;
    if (response && response.candidates && response.candidates.length > 0) {
      const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
      const translatedText = await translateText(text,chatLanguage);
      chatHistory.push(initialSetup);
      client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        body: translatedText,
        to: `whatsapp:+923095972568`
      }).then(message => {
        console.log(`Message sent to WhatsApp: ${message.sid}`);
        res.json({ chatHistory: [...initialSetup, { role: "model", parts: [{ text: translatedText }] }] });
      }).catch(err => {
        console.error("Error sending message to WhatsApp:", err);
        res.status(500).send(err);
      });
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error in /setup endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/gemini', async (req, res) => {
  try {
    console.log("Received request at /gemini endpoint with body:", req.body);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const { history, message } = req.body;
    const updatedChatHistory = history.map(chatItem => ({
      role: chatItem.role,
      parts: chatItem.parts.map(part => (typeof part === 'string' ? { text: part } : part))
    }));
    updatedChatHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });
    const chat = model.startChat({ history: updatedChatHistory });
    if (message.toLowerCase() === "end") {
      const feedbackMessage = `
        Please provide short and concise feedback on the user's interview performance, 
        including choice of words, areas for improvement.`;
      const feedbackResult = await chat.sendMessage(feedbackMessage);
      const feedbackResponse = feedbackResult.response;

      if (feedbackResponse && feedbackResponse.candidates && feedbackResponse.candidates.length > 0) {
        const feedbackText = feedbackResponse.candidates[0].content.parts.map(part => part.text).join(' ');
        const translatedFeedback = await translateText(feedbackText);
          res.json({
            message: "Thank you for your time. This concludes our interview. Have a great day!",
            feedback: translatedFeedback
          });
      } else {
        throw new Error("Invalid feedback response format");
      }
    } else {
      const result = await chat.sendMessage(message);
      const response = result.response;
      if (response && response.candidates && response.candidates.length > 0) {
        const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
        const translatedText = await translateText(text);
        res.json({
          response: translatedText,
          chatHistory: [...updatedChatHistory, { role: "model", parts: [{ text: translatedText }] }]
        });
      } else {
        throw new Error("Invalid response format");
      }
    }
  } catch (error) {
    console.error("Error in /gemini endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post('/whatsapp-incoming', async (req, res) => {
  try {
    console.log(chatHistory);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const formattedChatHistory = chatHistory[0].map(chatItem => ({
      role: chatItem.role,
      parts: chatItem.parts.map(part => (typeof part === 'string' ? { text: part } : part))
    }));
    const incomingMessage = req.body.Body;
    const from = req.body.From;
    formattedChatHistory.push({
      role: "user",
      parts: [{ text: incomingMessage }]
    });

    const chat = model.startChat({ history: formattedChatHistory });
    const msg = incomingMessage.toLowerCase();

    if (msg === "end") {
      const feedbackMessageContent = `
        Please provide short and concise feedback on the user's interview performance, 
        including choice of words, areas for improvement.`;
      const feedbackResult = await chat.sendMessage(feedbackMessageContent);
      const feedbackResponse = feedbackResult.response;
      if (feedbackResponse && feedbackResponse.candidates && feedbackResponse.candidates.length > 0) {
        let feedbackText = feedbackResponse.candidates[0].content.parts.map(part => part.text).join(' ');
        feedbackMessage = feedbackText;
        const translatedFeedback = await translateText(feedbackText,chatLanguage);
        client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          body: translatedFeedback,
          to: `whatsapp:+923095972568`
        }).then(async (message) => {
          console.log(`Feedback sent to WhatsApp: ${message.sid}`);
          await client.calls.create({
            to: '+923185562198',
            from: '+1 647 797 9861',
            url: 'https://6e22-103-189-126-4.ngrok-free.app/twiml'
          }).then(call => {
            console.log('Voice call initiated:', call.sid);
          }).catch(error => {
            console.error('Error initiating voice call:', error);
          });

          const twiml = new twilio.twiml.MessagingResponse();
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        }).catch(err => {
          console.error("Error sending feedback to WhatsApp:", err);
          res.status(500).send(err);
        });
      } else {
        throw new Error("Invalid feedback response format");
      }
    } else {
      const result = await chat.sendMessage(msg);
      const response = result.response;

      if (response && response.candidates && response.candidates.length > 0) {
        const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
        const translatedText = await translateText(text,chatLanguage);

        // Send response to WhatsApp
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(translatedText);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        formattedChatHistory.push({
          role: "model",
          parts: [{ text: translatedText }]
        });
      } else {
        console.error("Invalid response format");
        throw new Error("Invalid response format");
      }
    }
  } catch (error) {
    console.error("Error in /whatsapp-incoming endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});
const sendTokenResponse = (token, res) => {
  res.set('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      token: token.toJwt()
    })
  );
};
app.get('/api/greeting', (req, res) => {
  const name = req.query.name || 'World';
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

app.get('/video/token', (req, res) => {
  const identity = req.query.identity;
  const room = req.query.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);

});
app.post('/video/token', async (req, res) => {
  const { identity, room } = req.body;

  try {
    if (!identity || !room) {
      throw new Error('Identity and room are required');
    }
    const token = await generateToken(identity, room, config);
    res.status(200).json({ token: token.toJwt() });
  } catch (err) {
    console.error('Error generating token:', err.message);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});
app.listen(3001, () =>
  console.log('Express server is running on localhost:3001')
);
