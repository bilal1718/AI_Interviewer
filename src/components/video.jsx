import React from 'react'
import VideoChat from './VideoChat';

const Video = ({chatHistory,setChatHistory}) => {
    return (
      <div className="h-screen w-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-lg">Twilio AI Video Experience</h1>
      </header>
      <main className="">
          <VideoChat setChatHistory={setChatHistory} chatHistory={chatHistory} />
      </main>
  </div>
      );
}

export default Video
