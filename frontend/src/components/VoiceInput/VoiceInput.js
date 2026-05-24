// src/components/VoiceInput/VoiceInput.js
import 'regenerator-runtime/runtime';
import React, { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, Square, RotateCcw } from 'lucide-react';

export default function VoiceInput({ onTranscript, disabled }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Send transcript to parent whenever it updates
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
        ⚠️ Voice input not supported. Please use Chrome or Edge browser.
      </p>
    );
  }

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-IN'
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const clearTranscript = () => {
    resetTranscript();
    onTranscript('');
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Mic button */}
        {!listening ? (
          <button
            type="button"
            onClick={startListening}
            disabled={disabled || !isMicrophoneAvailable}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600
                       hover:bg-indigo-500 text-white text-sm rounded-xl
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg hover:shadow-indigo-500/30 active:scale-95"
          >
            <Mic size={15} />
            Speak Your Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={stopListening}
            className="flex items-center gap-2 px-4 py-2 bg-red-600
                       hover:bg-red-500 text-white text-sm rounded-xl
                       transition-all shadow-lg animate-pulse"
          >
            <Square size={15} />
            Stop Recording
          </button>
        )}

        {/* Live indicator */}
        {listening && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
              <div className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
              <div className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
            </div>
            <span className="text-sm text-red-400 font-medium">Recording...</span>
          </div>
        )}

        {/* Clear button */}
        {transcript && !listening && (
          <button
            type="button"
            onClick={clearTranscript}
            className="flex items-center gap-1 text-xs text-slate-500
                       hover:text-slate-300 transition-colors"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Microphone not available */}
      {!isMicrophoneAvailable && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30
                      rounded-lg px-3 py-2">
          ⚠️ Microphone not available. Please allow microphone access in browser settings.
        </p>
      )}

      {/* Live transcript preview */}
      {listening && transcript && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30
                        rounded-xl text-sm text-slate-300">
          <span className="text-indigo-400 text-xs font-semibold block mb-1">
            🎤 Live transcript:
          </span>
          <span className="italic">{transcript}</span>
        </div>
      )}

      <p className="text-xs text-slate-600">
        Voice input uses your browser's built-in speech recognition. Audio is not stored.
      </p>
    </div>
  );
}
