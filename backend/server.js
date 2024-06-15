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
      role: 'user',
      parts: [chatItem.parts]
    }));
    const chat = model.startChat({ history: chatHistory });
    const msg = req.body.message;
    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = await response.text(); // Correct way to access the text
    console.log("Response Text:", text); // Log the response text
    res.send(text); // Send the response as a string
  } catch (error) {
    console.error("Error in /gemini endpoint:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
