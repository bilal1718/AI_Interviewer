const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const PORT = 8000;

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
      `Based on the user's background, please generate interview questions.
       First, only generate one question.`;
    const result = await chat.sendMessage(initialMessage);
    const response = result.response;

    if (response && response.candidates && response.candidates.length > 0) {
      const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
      res.json({ chatHistory: [...initialSetup, { role: "model", parts: [text] }] });
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
        const feedbackText = feedbackResponse.candidates[0].content.parts.map(part => part.text).join(' ');
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

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
