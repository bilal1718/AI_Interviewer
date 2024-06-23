import React, { useState, useEffect, useRef } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';
import { ReactMic } from 'react-mic';

const Participant = ({ participant, chatHistory, setChatHistory }) => {
  const [videoTracks, setVideoTracks] = useState([]);
  const [eyeContactFeedback, setEyeContactFeedback] = useState('');
  const [shoulderFeedback, setShoulderFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const videoRef = useRef();
  const canvasRef = useRef();
  const recognitionRef = useRef(null);
  const getResponse = async () => {
    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          history: chatHistory,
          message: transcription.trim()
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      const response = await fetch('http://127.0.0.1:3001/gemini', options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setChatHistory(data.chatHistory.map(item => {
        return {
          role: item.role,
          parts: item.parts.map(part => typeof part === 'object' ? part.text : part)
        };
      }));
      setTranscription("");
    } catch (error) {
      console.error("Error in getResponse function:", error);
    }
  };

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = event => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
          // Update transcription state for UI display
          setTranscription(prev => prev + transcript + ' '); // Append with a space
          } else {
            interimTranscript += transcript;
          }
        }
      };
      recognitionRef.current.onerror = event => {
        console.error('Speech recognition error', event);
      };
    }
  }, [transcription]);

  // Utility function to convert track map to track array
  const trackpubsToTracks = trackMap =>
    Array.from(trackMap.values())
      .map(publication => publication.track)
      .filter(track => track !== null);

  useEffect(() => {
    const trackSubscribed = track => {
      if (track.kind === 'video') {
        setVideoTracks(videoTracks => [...videoTracks, track]);
      }
    };
    const trackUnsubscribed = track => {
      if (track.kind === 'video') {
        setVideoTracks(videoTracks => videoTracks.filter(v => v !== track));
      }
    };
    setVideoTracks(trackpubsToTracks(participant.videoTracks));
    participant.on('trackSubscribed', trackSubscribed);
    participant.on('trackUnsubscribed', trackUnsubscribed);

    return () => {
      setVideoTracks([]);
      participant.removeAllListeners();
    };
  }, [participant]);

  useEffect(() => {
    const videoTrack = videoTracks[0];
    if (videoTrack) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach();
      };
    }
  }, [videoTracks]);

  useEffect(() => {
    const runPoseNet = async () => {
      const net = await posenet.load();
      const video = videoRef.current;
      video.width = video.videoWidth;
      video.height = video.videoHeight;

      const detectPose = async () => {
        const pose = await net.estimateSinglePose(video, {
          flipHorizontal: false,
        });
        drawPose(pose);
        analyzePose(pose);
        requestAnimationFrame(detectPose);
      };
      detectPose();
    };

    const drawPose = pose => {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, videoRef.current.width, videoRef.current.height);
      if (pose && pose.keypoints) {
        pose.keypoints.forEach(keypoint => {
          if (keypoint.score > 0.5) {
            ctx.beginPath();
            ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          }
        });
      }
    };

    const analyzePose = pose => {
      const nose = pose.keypoints.find(point => point.part === 'nose');
      const leftEye = pose.keypoints.find(point => point.part === 'leftEye');
      const rightEye = pose.keypoints.find(point => point.part === 'rightEye');
      const leftShoulder = pose.keypoints.find(point => point.part === 'leftShoulder');
      const rightShoulder = pose.keypoints.find(point => point.part === 'rightShoulder');
      if (nose && leftEye && rightEye && leftShoulder && rightShoulder) {
        const eyeDist = Math.abs(leftEye.position.x - rightEye.position.x);
        const shoulderDist = Math.abs(leftShoulder.position.x - rightShoulder.position.x);
        const faceToShoulderRatio = eyeDist / shoulderDist;

        let eyeContactMessage = '';
        let shoulderMessage = '';

        if (faceToShoulderRatio > 0.5 && faceToShoulderRatio < 0.75) {
          eyeContactMessage = 'Good eye contact!';
        } else {
          eyeContactMessage = 'Maintain eye contact with the camera.';
        }

        if (leftShoulder.position.y < nose.position.y && rightShoulder.position.y < nose.position.y) {
          shoulderMessage = 'Good posture! Shoulders are up.';
        } else {
          shoulderMessage = 'Sit up straight and lift your shoulders.';
        }

        setEyeContactFeedback(eyeContactMessage);
        setShoulderFeedback(shoulderMessage);
      }
    };
    runPoseNet();
  }, [videoTracks]);

  const startRecording = () => {
    setIsRecording(true);
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    console.log("Stop recording");
    console.log("Before: ",transcription)
    const trimmedTranscription = transcription.trim();
    if (trimmedTranscription) {
      getResponse();
    }
    console.log("After: ",transcription)
  };

  const onStop = (recordedBlob) => {
    setAudioBlob(recordedBlob.blob);
    console.log('Recorded audio blob:', recordedBlob.blob);
  };

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
    <div className="flex flex-col items-center">
      <div className="flex flex-row space-x-4 w-full">
        <div className="w-1/2 p-4 border rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4">{participant.identity}</h3>
          <div className="relative">
            <video ref={videoRef} autoPlay className="w-full h-auto rounded-lg shadow-md" />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
          </div>
          <div className="mt-4">
            <p className={`text-xl ${eyeContactFeedback.includes('Good') ? 'text-green-500' : 'text-red-500'}`}>
              {eyeContactFeedback}
            </p>
            <p className={`text-xl ${shoulderFeedback.includes('Good') ? 'text-green-500' : 'text-red-500'}`}>
              {shoulderFeedback}
            </p>
          </div>
          {audioBlob && (
            <div className="mt-4">
              <p>Recorded Audio:</p>
              <audio controls className="w-full">
                <source src={URL.createObjectURL(audioBlob)} type="audio/webm;codecs=opus" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
        <div className="w-1/2 p-4 border rounded-lg shadow-lg">
          <div className="search-result mt-4">
            {chatHistory.slice(9).map((chatItem, index) => (
              <div key={index + 9} className={`chat-item ${chatItem.role} mb-4`}>
                {chatItem.role === "model" &&
                  <div className='answer'>
                  {renderText(chatItem.parts.join(' ')) }
                </div>
                 }
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="audio-controls mt-4">
        <button onClick={startRecording} disabled={isRecording} className="bg-blue-500 text-white py-2 px-4 rounded-lg mr-2">
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording} className="bg-red-500 text-white py-2 px-4 rounded-lg">
          Stop Recording
        </button>
      </div>
      <ReactMic
        record={isRecording}
        onStop={onStop}
        mimeType="audio/webm;codecs=opus"
        strokeColor="#000000"
        backgroundColor="#FF4081"
        className='mt-6'
      />
      
      {transcription && (
        <div className="transcription mt-4 p-4 border rounded-lg w-full text-center">
          <p>Transcription:</p>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
};

export default Participant;
