import React, { useState } from 'react';

const Chat_Bot = () => {
  const [error, setError] = useState("");
  const [value, setValue] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [responses, setResponses] = useState({});
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [feedback, setFeedback] = useState("");

  const surpriseOptions = [
    "Who won the Pakistan vs India match?",
    "Where is Uruguay located?",
    "When is the match between India vs Australia?"
  ];

  const surprise = () => {
    const randomValue = surpriseOptions[Math.floor(Math.random() * surpriseOptions.length)];
    setValue(randomValue);
  };

  const initialQuestions = [
    "What is your current job title or role?",
    "How many years of experience do you have in your field?",
    "What are your key skills and competencies?",
    "What industry are you targeting for your next job?",
    "Are you looking for a full-time, part-time, or freelance position?",
    "What is your preferred work location?",
    "What type of company are you interested in (e.g., startup, mid-size, large corporation)?",
    "What specific job title are you aiming for?",
    "Have you attended any notable courses or certifications?",
    "Do you have any notable achievements or projects?"
  ];

  const handleResponseChange = (question, answer) => {
    setResponses({
      ...responses,
      [question]: answer
    });
  };

  const handleSubmit = async () => {
    try {
      const options = {
        method: "POST",
        body: JSON.stringify({ initialResponses: responses }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch('http://127.0.0.1:8000/setup', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setChatHistory(data.chatHistory);
      setIsSetupComplete(true);
    } catch (error) {
      console.error("Error in handleSubmit function:", error);
      setError("Something went wrong! Please try again later.");
    }
  };

  const getResponse = async () => {
    if (!value) {
      setError("Error: Please ask a question!");
      return;
    }

    if (value.toLowerCase() === "end") {
      const options = {
        method: "POST",
        body: JSON.stringify({
          history: chatHistory,
          message: value
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch('http://127.0.0.1:8000/gemini', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setChatHistory(oldChatHistory => [
        ...oldChatHistory,
        { role: "user", parts: [value] },
        { role: "model", parts: [data.message] }
      ]);
      setFeedback(data.feedback);
      // clear();
      // setTimeout(() => {
      //   setIsSetupComplete(false);
      // }, 5000);
      setValue("");
      return;
    }

    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          history: chatHistory,
          message: value
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch('http://127.0.0.1:8000/gemini', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      setChatHistory(oldChatHistory => [
        ...oldChatHistory,
        { role: "user", parts: [value] },
        { role: "model", parts: [data] }
      ]);
      setValue("");
    } catch (error) {
      console.error("Error in getResponse function:", error);
      setError("Something went wrong! Please try again later.");
    }
  };

  const clear = () => {
    setValue("");
    setError("");
    setChatHistory([]);
    setResponses({});
    setIsSetupComplete(false);
    setFeedback("");
  };

  return (
    <div className='app'>
      <section className='search-section'>
        {!isSetupComplete ? (
          <div>
            <p>Please answer the following questions:</p>
            {initialQuestions.map((question, index) => (
              <div key={index} className='input-container'>
                <label>{question}</label>
                <input
                  type='text'
                  value={responses[question] || ""}
                  onChange={(e) => handleResponseChange(question, e.target.value)}
                />
              </div>
            ))}
            <button onClick={handleSubmit}>Submit</button>
          </div>
        ) : (
          <div>
            <p>What do you want to know?
              <button className='surprise' onClick={surprise} disabled={!chatHistory.length}>Surprise me!</button>
            </p>
            <div className='input-container'>
              <input
                value={value}
                placeholder='When is Christmas...?'
                onChange={(e) => setValue(e.target.value)}
              />
              {!error && <button onClick={getResponse}>Ask me</button>}
              {error && <button onClick={clear}>Clear</button>}
</div>
{error && <p>{error}</p>}
<div className='search-result'>
{chatHistory.map((chatItem, _index) => (
<div key={_index}>
<p className='answer'>{chatItem.role}: {chatItem.parts.join(' ')}</p>
</div>
))}
{feedback && (
<div className='feedback'>
<p className='feedback-title'>Interview Feedback:</p>
<p>{feedback}</p>
</div>
)}
</div>
</div>
)}
</section>
</div>
);
};

export default Chat_Bot;
