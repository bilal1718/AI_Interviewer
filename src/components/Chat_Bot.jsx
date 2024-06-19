import React, { useState } from 'react';

const Chat_Bot = ({ chatHistory, setChatHistory }) => {
  const [error, setError] = useState("");
  const [value, setValue] = useState("");
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
    setFeedback("");
  };

  // Function to parse and render text
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(part => part);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <h2 key={index} className="text-xl font-bold mb-2">{part.slice(2, -2)}</h2>;
      } else {
        return <p key={index} className="text-lg mb-2">{part}</p>;
      }
    });
  };

  return (
    <div className='app'>
      <section className='search-section'>
        <div>
          <p>What do you want to know?
            <button className='surprise' onClick={surprise} disabled={!chatHistory.length}>Surprise me!</button>
          </p>
          <div className='input-container'>
            <input
              value={value}
              placeholder='When is Christmas...?'
              onChange={(e) => setValue(e.target.value)}
              className='border p-2 rounded'
            />
            {!error && <button onClick={getResponse} className='ml-2 p-2 bg-blue-500 text-white rounded'>Ask me</button>}
            {error && <button onClick={clear} className='ml-2 p-2 bg-red-500 text-white rounded'>Clear</button>}
          </div>
          {error && <p className='text-red-500 mt-2'>{error}</p>}
          <div className='search-result mt-4'>
            {chatHistory.slice(9).map((chatItem, index) => (
              <div key={index + 9} className={`chat-item ${chatItem.role} mb-4`}>
                <div className='answer'>
                  {renderText(chatItem.parts.join(' '))}
                </div>
              </div>
            ))}
            {feedback && (
              <div className='feedback p-4 bg-gray-100 border rounded mt-4'>
                <p className='feedback-title text-xl font-bold mb-2'>Interview Feedback:</p>
                <p>{feedback}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Chat_Bot;