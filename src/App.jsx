import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Chat_Bot from './components/Chat_Bot'
import SignUp from './components/SignUp'
import Questions from './components/Questions'
import { useState } from 'react'
import Video from './components/video'


function App() {
  const [chatHistory,setChatHistory]=useState([]);
  return(
    <>
    <Video />
    </>
    // <BrowserRouter>
    // <Routes>
    //   <Route path='/' element={<SignUp />} />
    //   <Route path='/questions'
    //    element={<Questions
    //    chatHistory={chatHistory} setChatHistory={setChatHistory} />} />
    //   <Route path='/chatbot'
    //   element={<Chat_Bot
    //   chatHistory={chatHistory} setChatHistory={setChatHistory} />} />
    // </Routes>
    // </BrowserRouter>
  )
}

export default App
