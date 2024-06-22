import React, { useState, useEffect, useRef } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

const Participant = ({ participant }) => {
  const [videoTracks, setVideoTracks] = useState([]);
  const [eyeContactFeedback, setEyeContactFeedback] = useState('');
  const [shoulderFeedback, setShoulderFeedback] = useState('');
  const videoRef = useRef();
  const canvasRef = useRef();
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
  return (
    <div className="participant">
      <h3>{participant.identity}</h3>
      <video ref={videoRef} autoPlay={true} />
      <canvas ref={canvasRef} />
      <div className="feedback">
        <p style={{ color: eyeContactFeedback.includes('Good') ? 'green' : 'red' }}>
          {eyeContactFeedback}
        </p>
        <p style={{ color: shoulderFeedback.includes('Good') ? 'green' : 'red' }}>
          {shoulderFeedback}
        </p>
      </div>
    </div>
  );
};

export default Participant;
