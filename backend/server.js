const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const PORT = 8000;
app.post('/gemini', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chatHistory = req.body.history.map(chatItem => ({
      role: chatItem.role,
      parts: chatItem.parts.map(part => (typeof part === 'string' ? { text: part } : part))
    }));

    const chat = model.startChat({ history: chatHistory });
    const msg = req.body.message;
    const result = await chat.sendMessage(msg);
    const response = result.response;
    // console.log("Full Response:", JSON.stringify(response, null, 2));
    if (response && response.candidates && response.candidates.length > 0) {
      const text = response.candidates[0].content.parts.map(part => part.text).join(' ');
      // console.log("Response Text:", text); // Log the response text
      res.send(text);
    } else {
      console.error("Invalid response format");
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("Error in /gemini endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
