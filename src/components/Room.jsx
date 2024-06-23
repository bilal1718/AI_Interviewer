import React, { useState, useEffect } from 'react';
import Video from 'twilio-video';
import Participant from './Participant';

const Room = ({ roomName, token, handleLogout, chatHistory, setChatHistory }) => {
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
      useEffect(() => {
        const participantConnected = participant => {
          setParticipants(prevParticipants => [...prevParticipants, participant]);
        };
        const participantDisconnected = participant => {
          setParticipants(prevParticipants =>
            prevParticipants.filter(p => p !== participant)
          );
        };
        Video.connect(token, {
          name: roomName
        }).then(room => {
          setRoom(room);
          room.on('participantConnected', participantConnected);
          room.on('participantDisconnected', participantDisconnected);
          room.participants.forEach(participantConnected);
        });
        return () => {
            setRoom(currentRoom => {
              if (currentRoom && currentRoom.localParticipant.state === 'connected') {
                currentRoom.localParticipant.tracks.forEach(function(trackPublication) {
                  trackPublication.track.stop();
                });
                currentRoom.disconnect();
                return null;
              } else {
                return currentRoom;
              }
            });
          };
      },[roomName, token]);
      return (
        <div>
          <div className='flex justify-between'>
          <h2 className='mt-4 ml-5 text-xl'>Room: {roomName}</h2>
          <button className='mt-4 mr-5 text-xl bg-gray-300 py-2 px-3' onClick={handleLogout}>Log out</button>
          </div>
          <div>
            {room ? (
              <Participant
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
                key={room.localParticipant.sid}
                participant={room.localParticipant}
              />
            ) : (
              ''
            )}
          </div>
        </div>
      );
    };

export default Room;