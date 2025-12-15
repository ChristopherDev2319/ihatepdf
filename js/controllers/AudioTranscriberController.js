/**
 * AudioTranscriberController.js - Audio Transcription Controller
 * 
 * Handles audio-to-text transcription using the Web Speech API.
 * Supports live transcription from microphone and file-based transcription.
 * All processing is done client-side without uploading to external servers.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.6, 7.7
 */

export class AudioTranscriberController {
  /**
   * @param {Object} downloadService - Service for downloading files
   * @param {Object} permissionService - Service for handling permissions
   */
  constructor(downloadService, permissionService) {
    /** @type {SpeechRecognition|null} */
    this.recognition = null;
    
    /** @type {string} */
    this.transcript = '';
    
    /** @type {boolean} */
    this.isTranscribing = false;
    
    /** @type {MediaStream|null} */
    this.stream = null;
    
    /** @type {HTMLAudioElement|null} */
    this.audioElement = null;
    
    /** @type {Function|null} */
    this.onTranscriptUpdate = null;
    
    /** @type {Function|null} */
    this.onTranscriptionStart = null;
    
    /** @type {Function|null} */
    this.onTranscriptionEnd = null;
    
    /** @type {Function|null} */
    this.onError = null;
    
    /** @type {Object} */
    this.downloadService = downloadService;
    
    /** @type {Object} */
    this.permissionService = permissionService;
    
    /** @type {string} */
    this.language = 'es-ES';
  }


  /**
   * Check if the browser supports the Web Speech API
   * @returns {boolean} - True if supported
   */
  checkBrowserSupport() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  /**
   * Initialize the speech recognition instance
   * @private
   */
  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Web Speech API no está soportada en este navegador');
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;
    
    this.recognition.onresult = (event) => {
      this._handleRecognitionResult(event);
    };
    
    this.recognition.onerror = (event) => {
      this._handleRecognitionError(event);
    };
    
    this.recognition.onend = () => {
      this._handleRecognitionEnd();
    };
    
    this.recognition.onstart = () => {
      this.isTranscribing = true;
      if (this.onTranscriptionStart) {
        this.onTranscriptionStart();
      }
    };
  }

  /**
   * Handle speech recognition results
   * @param {SpeechRecognitionEvent} event - Recognition event
   * @private
   */
  _handleRecognitionResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' ';
      } else {
        interimTranscript += result[0].transcript;
      }
    }
    
    if (finalTranscript) {
      this.transcript += finalTranscript;
    }
    
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate(this.transcript, interimTranscript);
    }
  }

  /**
   * Handle speech recognition errors
   * @param {SpeechRecognitionErrorEvent} event - Error event
   * @private
   */
  _handleRecognitionError(event) {
    const errorMessages = {
      'no-speech': 'No se detectó voz. Por favor, habla más cerca del micrófono.',
      'audio-capture': 'No se pudo capturar el audio. Verifica tu micrófono.',
      'not-allowed': 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.',
      'network': 'Error de red. Verifica tu conexión a internet.',
      'aborted': 'La transcripción fue cancelada.',
      'language-not-supported': 'El idioma seleccionado no está soportado.'
    };
    
    const message = errorMessages[event.error] || `Error de reconocimiento: ${event.error}`;
    
    if (this.onError) {
      this.onError(message);
    }
  }

  /**
   * Handle recognition end event
   * @private
   */
  _handleRecognitionEnd() {
    // If still transcribing, restart recognition (continuous mode)
    if (this.isTranscribing && this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        // Recognition already started or other error
        this.isTranscribing = false;
        if (this.onTranscriptionEnd) {
          this.onTranscriptionEnd();
        }
      }
    } else {
      this.isTranscribing = false;
      if (this.onTranscriptionEnd) {
        this.onTranscriptionEnd();
      }
    }
  }


  /**
   * Start live transcription from microphone
   * @returns {Promise<void>}
   * @throws {Error} - If permission is denied or API not supported
   */
  async startLiveTranscription() {
    if (!this.checkBrowserSupport()) {
      const message = 'Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome o Edge.';
      if (this.onError) {
        this.onError(message);
      }
      throw new Error(message);
    }
    
    try {
      // Request microphone permission
      this.stream = await this.permissionService.requestMicrophonePermission();
      
      // Initialize recognition
      this._initRecognition();
      
      // Start recognition
      this.recognition.start();
    } catch (error) {
      const message = this.permissionService.handlePermissionDenied('microphone', error);
      if (this.onError) {
        this.onError(message);
      }
      throw error;
    }
  }

  /**
   * Stop transcription
   */
  stopTranscription() {
    this.isTranscribing = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        // Recognition may already be stopped
      }
    }
    
    // Stop audio element if playing
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    
    // Stop microphone stream
    if (this.stream) {
      this.permissionService.stopStream(this.stream);
      this.stream = null;
    }
  }

  /**
   * Transcribe an audio file by playing it and capturing speech
   * Note: This uses the microphone to capture audio played through speakers
   * @param {File} file - Audio file to transcribe
   * @returns {Promise<void>}
   */
  async transcribeFile(file) {
    if (!this.checkBrowserSupport()) {
      const message = 'Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome o Edge.';
      if (this.onError) {
        this.onError(message);
      }
      throw new Error(message);
    }
    
    // Validate file type
    if (!file.type.startsWith('audio/')) {
      const message = 'Por favor, selecciona un archivo de audio válido.';
      if (this.onError) {
        this.onError(message);
      }
      throw new Error(message);
    }
    
    try {
      // Request microphone permission for capturing
      this.stream = await this.permissionService.requestMicrophonePermission();
      
      // Initialize recognition
      this._initRecognition();
      
      // Create audio element to play the file
      this.audioElement = new Audio();
      const url = URL.createObjectURL(file);
      this.audioElement.src = url;
      
      // Start recognition when audio starts playing
      this.audioElement.onplay = () => {
        try {
          this.recognition.start();
        } catch (error) {
          // Recognition may already be started
        }
      };
      
      // Stop recognition when audio ends
      this.audioElement.onended = () => {
        URL.revokeObjectURL(url);
        this.stopTranscription();
      };
      
      // Handle audio errors
      this.audioElement.onerror = () => {
        URL.revokeObjectURL(url);
        if (this.onError) {
          this.onError('Error al reproducir el archivo de audio.');
        }
      };
      
      // Play the audio
      await this.audioElement.play();
    } catch (error) {
      if (this.onError) {
        this.onError('Error al procesar el archivo de audio: ' + error.message);
      }
      throw error;
    }
  }

  /**
   * Get the current transcript
   * @returns {string} - Current transcript text
   */
  getTranscript() {
    return this.transcript.trim();
  }

  /**
   * Clear the current transcript
   */
  clearTranscript() {
    this.transcript = '';
    if (this.onTranscriptUpdate) {
      this.onTranscriptUpdate('', '');
    }
  }

  /**
   * Copy transcript to clipboard
   * @returns {Promise<boolean>} - True if successful
   */
  async copyToClipboard() {
    const text = this.getTranscript();
    
    if (!text) {
      if (this.onError) {
        this.onError('No hay texto para copiar.');
      }
      return false;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      if (this.onError) {
        this.onError('Error al copiar al portapapeles.');
      }
      return false;
    }
  }

  /**
   * Download transcript as a text file
   * @param {string} filename - Optional custom filename
   */
  downloadAsText(filename = 'transcripcion') {
    const text = this.getTranscript();
    
    if (!text) {
      if (this.onError) {
        this.onError('No hay texto para descargar.');
      }
      return;
    }
    
    const fullFilename = this.downloadService.getFilenameWithExtension(filename, 'text/plain');
    this.downloadService.downloadText(text, fullFilename);
  }

  /**
   * Set the recognition language
   * @param {string} lang - Language code (e.g., 'es-ES', 'en-US')
   */
  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  /**
   * Get available languages for speech recognition
   * @returns {Array<{code: string, name: string}>} - Available languages
   */
  getAvailableLanguages() {
    return [
      { code: 'es-ES', name: 'Español (España)' },
      { code: 'es-MX', name: 'Español (México)' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'it-IT', name: 'Italiano' },
      { code: 'pt-BR', name: 'Português (Brasil)' }
    ];
  }

  /**
   * Get the current state
   * @returns {Object} - Current state object
   */
  getState() {
    return {
      isTranscribing: this.isTranscribing,
      hasTranscript: this.transcript.length > 0,
      transcript: this.getTranscript(),
      isSupported: this.checkBrowserSupport()
    };
  }

  /**
   * Reset the controller state
   */
  reset() {
    this.stopTranscription();
    this.transcript = '';
    this.recognition = null;
  }

  /**
   * Cleanup and destroy the controller
   */
  destroy() {
    this.reset();
    this.onTranscriptUpdate = null;
    this.onTranscriptionStart = null;
    this.onTranscriptionEnd = null;
    this.onError = null;
  }
}
