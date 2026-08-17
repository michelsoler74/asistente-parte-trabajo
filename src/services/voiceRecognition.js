/**
 * Servicio de Reconocimiento de Voz usando Web Speech API
 * Optimizado para castellano (es-ES) y entornos de construcción
 */
class VoiceRecognitionService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.activeField = null;
    this.onResultCallback = null;
    this.onStatusChangeCallback = null;
    this.isSupported = false;

    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false; // continuous=false evita duplicación descontrolada en Android/Chrome
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback({ isListening: true, activeField: this.activeField });
        }
      };

      this.recognition.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript.trim();
          if (transcript && this.onResultCallback) {
            this.onResultCallback(transcript, this.activeField);
          }
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition event/error:', event.error);
        this.stop();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.activeField = null;
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback({ isListening: false, activeField: null });
        }
      };
    } else {
      this.isSupported = false;
    }
  }

  start(fieldName, onResult, onStatusChange) {
    if (!this.isSupported) {
      alert('Tu navegador no soporta dictado por voz (Web Speech API). Por favor usa Google Chrome, Microsoft Edge o Safari.');
      return false;
    }

    // Si ya está escuchando en el mismo campo, detener
    if (this.isListening && this.activeField === fieldName) {
      this.stop();
      return false;
    }

    // Si estaba escuchando en otro campo, reiniciar en el nuevo
    if (this.isListening) {
      this.stop();
    }

    this.activeField = fieldName;
    this.onResultCallback = onResult;
    this.onStatusChangeCallback = onStatusChange;

    try {
      this.recognition.start();
      return true;
    } catch (err) {
      console.error('Error al iniciar reconocimiento:', err);
      this.stop();
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignorar si ya estaba detenido
      }
    }
    this.isListening = false;
    this.activeField = null;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback({ isListening: false, activeField: null });
    }
  }
}

export const voiceService = new VoiceRecognitionService();
