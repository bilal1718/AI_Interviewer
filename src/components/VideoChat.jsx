import React, { useState , useCallback} from 'react';
import Lobby from './Lobby';
import Room from './Room';

const VideoChat = ({chatHistory, setChatHistory}) => {
    const [username, setUsername] = useState('');
    const [roomName, setRoomName] = useState('');
    const [token, setToken] = useState(null);
    const handleUsernameChange = useCallback(event => {
        setUsername(event.target.value);
      }, []);
      const handleRoomNameChange = useCallback(event => {
        setRoomName(event.target.value);
      }, []);
      const handleSubmit = useCallback(async event => {
        event.preventDefault();
        const url = 'http://localhost:3001/video/token';
        try {
          const data = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
              identity: username,
              room: roomName
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (!data.ok) {
            throw new Error('Failed to fetch token');
          }
          const tokenData = await data.json();
          setToken(tokenData.token);
        } catch (error) {
          console.error('Error fetching token:', error);
        }
      }, [username, roomName]);
      const handleLogout = useCallback(event => {
        setToken(null);
      }, []);
      let render;
  if (token) {
    render = (
      <Room chatHistory={chatHistory} setChatHistory={setChatHistory} roomName={roomName} token={token} handleLogout={handleLogout} />
    );
  } else {
    render = (
      <Lobby
         username={username}
         roomName={roomName}
         handleUsernameChange={handleUsernameChange}
         handleRoomNameChange={handleRoomNameChange}
         handleSubmit={handleSubmit}
      />
    );
  }
  return render;
}

export default VideoChat
