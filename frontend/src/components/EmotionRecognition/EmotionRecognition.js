// src/components/EmotionRecognition/EmotionRecognition.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CameraOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// Emoji mapping for detected emotions
const EMOTION_EMOJI = {
  happy:     '😊',
  sad:       '😢',
  angry:     '😠',
  fearful:   '😨',
  disgusted: '🤢',
  surprised: '😮',
  neutral:   '😐'
};

// Stress score mapping per emotion (0-100)
const EMOTION_STRESS_SCORE = {
  happy:     10,
  neutral:   30,
  surprised: 40,
  disgusted: 60,
  fearful:   75,
  sad:       80,
  angry:     85
};

// Color mapping for emotion bars
const EMOTION_COLOR = {
  happy:     '#10b981',
  neutral:   '#64748b',
  surprised: '#f59e0b',
  disgusted: '#a855f7',
  fearful:   '#f97316',
  sad:       '#3b82f6',
  angry:     '#ef4444'
};

export default function EmotionRecognition({ onEmotionDetected }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const intervalRef = useRef(null);

  const [modelsLoaded,  setModelsLoaded]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isRunning,     setIsRunning]     = useState(false);
  const [emotion,       setEmotion]       = useState(null);
  const [allEmotions,   setAllEmotions]   = useState(null);
  const [confidence,    setConfidence]    = useState(0);
  const [error,         setError]         = useState('');
  const [faceDetected,  setFaceDetected]  = useState(false);

  // Load models on mount
  useEffect(() => {
    loadModels();
    return () => stopCamera();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    setError('');
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      setError(
        'Could not load emotion models. Make sure you placed the face-api.js model files in frontend/public/models/ folder. Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsRunning(true);
      startDetection();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission in your browser.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Could not start camera: ' + err.message);
      }
    }
  };

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsRunning(false);
    setEmotion(null);
    setAllEmotions(null);
    setFaceDetected(false);
  }, []);

  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

      try {
        const detections = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
          )
          .withFaceExpressions();

        // Clear canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (detections) {
          setFaceDetected(true);

          // Resize and draw face box
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
          const resized = faceapi.resizeResults(detections, dims);

          // Draw face box
          faceapi.draw.drawDetections(canvasRef.current, resized);

          // Get dominant emotion
          const expressions = detections.expressions;
          const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
          const [dominantName, dominantScore] = sorted[0];

          setEmotion(dominantName);
          setAllEmotions(expressions);
          setConfidence(Math.round(dominantScore * 100));

          // Send to parent component
          if (onEmotionDetected) {
            onEmotionDetected({
              dominant:    dominantName,
              scores:      expressions,
              stressScore: EMOTION_STRESS_SCORE[dominantName] || 50,
              confidence:  Math.round(dominantScore * 100)
            });
          }
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        // Silent fail during detection
      }
    }, 800); // Detect every 800ms
  };

  return (
    <div className="card space-y-4 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <span>😊</span> Facial Emotion Recognition
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Optional: Enable camera to detect emotions in real-time
          </p>
        </div>

        {/* Model status */}
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 size={14} className="text-indigo-400 animate-spin" />}
          {modelsLoaded && !isLoading && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 size={12} />
              Models ready
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Camera view */}
      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700"
           style={{ height: '200px' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />

        {/* Overlay when camera is off */}
        {!isRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Camera size={32} className="text-slate-600" />
            <p className="text-slate-600 text-sm">Camera is off</p>
          </div>
        )}

        {/* Face not detected warning */}
        {isRunning && !faceDetected && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 rounded-lg px-3 py-1.5
                          border border-amber-500/30 text-xs text-amber-400 text-center">
            👤 No face detected — move closer to camera
          </div>
        )}

        {/* Face detected indicator */}
        {isRunning && faceDetected && (
          <div className="absolute top-2 right-2 bg-emerald-500/20 rounded-lg px-2 py-1
                          border border-emerald-500/30 text-xs text-emerald-400">
            ✓ Face detected
          </div>
        )}
      </div>

      {/* Detected emotion display */}
      {emotion && isRunning && faceDetected && (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 space-y-3">
          {/* Primary emotion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{EMOTION_EMOJI[emotion] || '😐'}</span>
              <div>
                <p className="font-bold text-white capitalize text-lg">{emotion}</p>
                <p className="text-xs text-slate-500">
                  Confidence: {confidence}% &nbsp;|&nbsp;
                  Stress indicator: <span className="text-amber-400">{EMOTION_STRESS_SCORE[emotion] || 50}/100</span>
                </p>
              </div>
            </div>
          </div>

          {/* All emotion bars */}
          {allEmotions && (
            <div className="space-y-1.5">
              {Object.entries(allEmotions)
                .sort((a, b) => b[1] - a[1])
                .map(([name, score]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-16 capitalize">{name}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(score * 100).toFixed(1)}%`,
                          backgroundColor: EMOTION_COLOR[name] || '#6366f1'
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">
                      {(score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Camera controls */}
      <div className="flex items-center gap-3">
        {!isRunning ? (
          <button
            onClick={startCamera}
            disabled={!modelsLoaded || isLoading}
            className="flex items-center gap-2 btn-primary text-sm py-2 px-4
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera size={15} />
            {isLoading ? 'Loading AI Models...' : 'Start Camera'}
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 btn-outline text-sm py-2 px-4"
          >
            <CameraOff size={15} />
            Stop Camera
          </button>
        )}

        <p className="text-xs text-slate-600">
          🔒 Camera feed never leaves your device
        </p>
      </div>

      {/* Setup instructions if models not loaded */}
      {!modelsLoaded && !isLoading && !error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-xs text-amber-400 font-medium mb-1">Setup Required:</p>
          <p className="text-xs text-amber-300">
            Download face-api.js model files and place them in{' '}
            <code className="bg-slate-800 px-1 rounded">frontend/public/models/</code>{' '}
            folder. See README for download link.
          </p>
        </div>
      )}
    </div>
  );
}
