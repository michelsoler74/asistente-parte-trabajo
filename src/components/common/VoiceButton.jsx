import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { voiceService } from '../../services/voiceRecognition';

export const VoiceButton = ({ fieldName, currentValue = '', onTranscript, className = '' }) => {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const handleStatusChange = (status) => {
      if (status.activeField === fieldName && status.isListening) {
        setIsRecording(true);
      } else {
        setIsRecording(false);
      }
    };

    return () => {
      if (isRecording) {
        voiceService.stop();
      }
    };
  }, [fieldName, isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      voiceService.stop();
      setIsRecording(false);
    } else {
      const started = voiceService.start(
        fieldName,
        (transcript) => {
          // Lógica de continuación inteligente
          const prev = currentValue ? currentValue.trim() : '';
          const separator = prev ? ' ' : '';
          const newText = prev ? `${prev}${separator}${transcript}` : transcript;
          onTranscript(newText);
        },
        ({ isListening, activeField }) => {
          setIsRecording(isListening && activeField === fieldName);
        }
      );
      if (started) {
        setIsRecording(true);
      }
    }
  };

  const hasText = currentValue && currentValue.trim().length > 0;

  return (
    <button
      type="button"
      onClick={toggleRecording}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95 touch-manipulation ${
        isRecording
          ? 'bg-red-600 text-white voice-recording shadow-red-200'
          : hasText
          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
          : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
      } ${className}`}
      title={isRecording ? 'Parar dictado' : hasText ? 'Continuar dictado (añade al texto)' : 'Dictar por voz'}
    >
      {isRecording ? (
        <>
          <MicOff className="w-4 h-4 animate-bounce text-white" />
          <span>🔴 Grabando...</span>
        </>
      ) : (
        <>
          <Mic className={`w-4 h-4 ${hasText ? 'text-slate-600' : 'text-brand-600'}`} />
          <span>{hasText ? 'Continuar' : 'Dictar'}</span>
        </>
      )}
    </button>
  );
};
