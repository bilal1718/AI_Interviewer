const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const PORT = process.env.PORT || 8000;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, {
  lazyLoading: true,
});


// Increase the default max listeners limit to avoid warnings
const events = require('events');
events.EventEmitter.defaultMaxListeners = 20;

app.post('/setup', async (req, res) => {
  try {
    const initialResponses = req.body.initialResponses;
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const initialSetup = Object.values(initialResponses).map(response => ({
      role: "user",
      parts: [{ text: response }]
    }));

    const chat = model.startChat({ history: initialSetup });
    const initialMessage =
      `As you know user history,
      user have title, years of experience, skills, industry in which user wants to placed,
      job type in which user wants to work, user preferred location, type of company in which user is interested.
     Take the users mock interview.
       First, only generate one question.`;
    const result = await chat.sendMessage(initialMessage);
    const response = result.response;

    if (response && response.candidates && response.candidates.length > 0) {
      const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
      res.json({ chatHistory: [...initialSetup, { role: "model", parts: [{ text }] }] });
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chatHistory = req.body.history.map(chatItem => ({
      role: chatItem.role,
      parts: chatItem.parts.map(part => (typeof part === 'string' ? { text: part } : part))
    }));

    const chat = model.startChat({ history: chatHistory });
    const msg = req.body.message.toLowerCase(); // Convert message to lowercase for easier comparison

    if (msg === "end") {
      const feedbackMessage = `
      Please provide feedback on the user's interview performance, including choice of words, areas for improvement.`;
      const feedbackResult = await chat.sendMessage(feedbackMessage);
      const feedbackResponse = feedbackResult.response;

      if (feedbackResponse && feedbackResponse.candidates && feedbackResponse.candidates.length > 0) {
        const feedbackText = feedbackResponse.candidates[0].content.parts.map(part => part.text).join
        (' ');
        res.json({
          message: "Thank you for your time. This concludes our interview. Have a great day!",
          feedback: feedbackText
        });
      } else {
        throw new Error("Invalid feedback response format");
      }
    } else {
      const result = await chat.sendMessage(msg);
      const response = result.response;

      if (response && response.candidates && response.candidates.length > 0) {
        const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
        res.send(text);
      } else {
        console.error("Invalid response format");
        throw new Error("Invalid response format");
      }
    }
  } catch (error) {
    console.error("Error in /gemini endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post('/whatsapp', (req, res) => {
  const { message } = req.body;
  client.messages
    .create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      body: message,
      to: `whatsapp:+923095972568`,
    })
    .then(message => res.send(`Message sent: ${message.sid}`))
    .catch(err => res.status(500).send(err));
});

app.post('/whatsapp-incoming', (req, res) => {
  const incomingMessage = req.body.Body;
  const from = req.body.From;

  console.log(`Received message: "${incomingMessage}" from ${from}`);
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message('Thanks for your message!');
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));


