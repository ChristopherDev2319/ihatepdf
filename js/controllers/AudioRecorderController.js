/**
 * AudioRecorderController.js - Audio Recording Controller
 * 
 * Handles audio recording from the microphone using the MediaRecorder API.
 * All processing is done client-side without uploading to external servers.
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

export class AudioRecorderController {
  /**
   * @param {Object} downloadService - Service for downloading files
   * @param {Object} permissionService - Service for handling permissions
   */
  constructor(downloadService, permissionService) {
    /** @type {MediaRecorder|null} */
    this.mediaRecorder = null;
    
    /** @type {Blob[]} */
    this.audioChunks = [];
    
    /** @type {boolean} */
    this.isRecording = false;
    
    /** @type {number|null} */
    this.startTime = null;
    
    /** @type {MediaStream|null} */
    this.stream = null;
    
    /** @type {number|null} */
    this.timerInterval = null;
    
    /** @type {Function|null} */
    this.onTimeUpdate = null;
    
    /** @type {Function|null} */
    this.onRecordingComplete = null;
    
    /** @type {Function|null} */
    this.onRecordingStart = null;
    
    /** @type {Function|null} */
    this.onError = null;
    
    /** @type {Object} */
    this.downloadService = downloadService;
    
    /** @type {Object} */
    this.permissionService = permissionService;
  }


  /**
   * Request microphone permission from the browser
   * @returns {Promise<MediaStream>} - MediaStream from microphone
   * @throws {Error} - If permission is denied or unavailable
   */
  async requestPermission() {
    try {
      this.stream = await this.permissionService.requestMicrophonePermission();
      return this.stream;
    } catch (error) {
      const message = this.permissionService.handlePermissionDenied('microphone', error);
      if (this.onError) {
        this.onError(message);
      }
      throw error;
    }
  }

  /**
   * Start recording audio from the microphone
   * @returns {Promise<void>}
   * @throws {Error} - If no stream is available or recording fails
   */
  async startRecording() {
    // Request permission if we don't have a stream
    if (!this.stream) {
      await this.requestPermission();
    }

    // Reset state
    this.audioChunks = [];
    this.isRecording = true;
    this.startTime = Date.now();

    // Determine the best supported MIME type
    const mimeType = this._getSupportedMimeType();

    // Create MediaRecorder
    const options = mimeType ? { mimeType } : {};
    this.mediaRecorder = new MediaRecorder(this.stream, options);

    // Handle data available event
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // Handle recording stop
    this.mediaRecorder.onstop = () => {
      this._handleRecordingStop();
    };

    // Handle errors
    this.mediaRecorder.onerror = (event) => {
      this.isRecording = false;
      this._stopTimer();
      if (this.onError) {
        this.onError('Error durante la grabación: ' + event.error?.message || 'Error desconocido');
      }
    };

    // Start recording
    this.mediaRecorder.start(1000); // Collect data every second

    // Start elapsed time timer
    this._startTimer();

    // Notify listeners
    if (this.onRecordingStart) {
      this.onRecordingStart();
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) {
      return;
    }

    this.isRecording = false;
    this._stopTimer();
    this.mediaRecorder.stop();
  }

  /**
   * Get the elapsed recording time in seconds
   * @returns {number} - Elapsed time in seconds
   */
  getElapsedTime() {
    if (!this.startTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get formatted elapsed time as MM:SS
   * @returns {string} - Formatted time string
   */
  getFormattedElapsedTime() {
    const seconds = this.getElapsedTime();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Generate a downloadable audio file from the recorded chunks
   * @returns {Blob|null} - Audio blob or null if no recording
   */
  generateAudioFile() {
    if (this.audioChunks.length === 0) {
      return null;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    return new Blob(this.audioChunks, { type: mimeType });
  }

  /**
   * Download the recorded audio file
   * @param {string} filename - Optional custom filename
   */
  downloadRecording(filename = 'grabacion-audio') {
    const blob = this.generateAudioFile();
    if (!blob) {
      if (this.onError) {
        this.onError('No hay grabación disponible para descargar');
      }
      return;
    }

    const fullFilename = this.downloadService.getFilenameWithExtension(filename, blob.type);
    this.downloadService.downloadBlob(blob, fullFilename);
  }

  /**
   * Check if the browser supports audio recording
   * @returns {boolean} - True if supported
   */
  isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }

  /**
   * Get the current recording state
   * @returns {Object} - Recording state object
   */
  getState() {
    return {
      isRecording: this.isRecording,
      elapsedTime: this.getElapsedTime(),
      formattedTime: this.getFormattedElapsedTime(),
      hasRecording: this.audioChunks.length > 0
    };
  }


  /**
   * Handle recording stop event
   * @private
   */
  _handleRecordingStop() {
    const blob = this.generateAudioFile();
    
    if (this.onRecordingComplete && blob) {
      this.onRecordingComplete(blob);
    }
  }

  /**
   * Start the elapsed time timer
   * @private
   */
  _startTimer() {
    this._stopTimer(); // Clear any existing timer
    
    this.timerInterval = setInterval(() => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.getElapsedTime(), this.getFormattedElapsedTime());
      }
    }, 1000);
  }

  /**
   * Stop the elapsed time timer
   * @private
   */
  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Get the best supported MIME type for audio recording
   * @returns {string|null} - Supported MIME type or null
   * @private
   */
  _getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }

  /**
   * Reset the controller state
   */
  reset() {
    this.stopRecording();
    this.audioChunks = [];
    this.startTime = null;
    
    // Stop the stream tracks
    if (this.stream) {
      this.permissionService.stopStream(this.stream);
      this.stream = null;
    }
    
    this.mediaRecorder = null;
  }

  /**
   * Cleanup and destroy the controller
   */
  destroy() {
    this.reset();
    this.onTimeUpdate = null;
    this.onRecordingComplete = null;
    this.onRecordingStart = null;
    this.onError = null;
  }
}
