const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
require('dotenv').config();
const { GoogleGenerativeAI, GoogleGenerativeAIError } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const PORT = process.env.PORT || 8000;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, {
  lazyLoading: true,
});

// Global variable to store chat history
let chatHistory = [];

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
      `As you know from user history,
      the user's job title, years of experience, skills, industry of interest,
      job type preferred, preferred work location, and type of company of interest.
      Take the user's mock interview. Generate the first question only.`;
    
    const result = await chat.sendMessage(initialMessage);
    const response = result.response;

    if (response && response.candidates && response.candidates.length > 0) {
      const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
      client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        body: text,
        to: `whatsapp:+923095972568` // Ensure that the 'to' field is correctly formatted in the request body
      }).then(message => {
        console.log(`Message sent to WhatsApp: ${message.sid}`);
        res.json({ chatHistory: [...initialSetup, { role: "model", parts: [{ text }] }] });
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
    const updatedChatHistory = req.body.history.map(chatItem => ({
      role: chatItem.role,
      parts: chatItem.parts.map(part => (typeof part === 'string' ? { text: part } : part))
    }));

    // Update global chatHistory with the entire conversation history
    chatHistory.push(...updatedChatHistory);

    const chat = model.startChat({ history: chatHistory });
    const msg = req.body.message.toLowerCase(); // Convert message to lowercase for easier comparison

    if (msg === "end") {
      const feedbackMessage = `
        Please provide feedback on the user's interview performance, including choice of words, areas for improvement.`;
      const feedbackResult = await chat.sendMessage(feedbackMessage);
      const feedbackResponse = feedbackResult.response;

      if (feedbackResponse && feedbackResponse.candidates && feedbackResponse.candidates.length > 0) {
        const feedbackText = feedbackResponse.candidates[0].content.parts.map(part => part.text).join(' ');

        // Send feedback to WhatsApp
        client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          body: feedbackText,
          to: `whatsapp:+923095972568` // Replace with actual recipient number
        }).then(message => {
          console.log(`Feedback sent to WhatsApp: ${message.sid}`);
          res.json({
            message: "Thank you for your time. This concludes our interview. Have a great day!",
            feedback: feedbackText
          });
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

        // Check if the 'to' field is present in the request body
        if (!req.body.to) {
          console.error("No 'to' field in the request body");
          return res.status(400).send("Missing 'to' field in the request body");
        }

        // Send response to WhatsApp
        client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          body: req.body.message,
          to: `whatsapp:+923095972568` // Replace with actual recipient number
        }).then(message => {
          console.log(`Message sent to WhatsApp: ${message.sid}`);
          res.json({ response: text, chatHistory: [...chatHistory, { role: "model", parts: [{ text }] }] });
        }).catch(err => {
          console.error("Error sending message to WhatsApp:", err);
          res.status(500).send(err);
        });

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

app.post('/whatsapp-incoming', async (req, res) => {
  console.log(req.body);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const incomingMessage = req.body.Body;
    const from = req.body.From;

    // Update chat history with user's incoming message
    chatHistory.push({
      role: "user",
      parts: [{ text: incomingMessage }]
    });

    const chat = model.startChat({ history: chatHistory });
    const msg = incomingMessage.toLowerCase(); // Convert message to lowercase for easier comparison

    if (msg === "end") {
      const feedbackMessage = `
        Please provide feedback on the user's interview performance, including choice of words, areas for improvement.`;
      const feedbackResult = await chat.sendMessage(feedbackMessage);
      const feedbackResponse = feedbackResult.response;

      if (feedbackResponse && feedbackResponse.candidates && feedbackResponse.candidates.length > 0) {
        const feedbackText = feedbackResponse.candidates[0].content.parts.map(part => part.text).join(' ');

        // Send feedback to WhatsApp
        client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          body: feedbackText,
          to: `whatsapp:+923095972568` // Reply to the user who sent the 'end' message
        }).then(message => {
          console.log(`Feedback sent to WhatsApp: ${message.sid}`);
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

        // Send response to WhatsApp
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(text);
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());

        // Update chat history with model's response
        chatHistory.push({
          role: "model",
          parts: [{ text }]
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

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
