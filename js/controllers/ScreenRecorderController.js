/**
 * ScreenRecorderController.js - Screen Recording Controller
 * 
 * Handles screen recording using the MediaRecorder API with getDisplayMedia.
 * Supports optional system audio capture.
 * All processing is done client-side without uploading to external servers.
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.5, 3.7
 */

export class ScreenRecorderController {
  /**
   * @param {Object} downloadService - Service for downloading files
   * @param {Object} permissionService - Service for handling permissions
   */
  constructor(downloadService, permissionService) {
    /** @type {MediaRecorder|null} */
    this.mediaRecorder = null;
    
    /** @type {Blob[]} */
    this.videoChunks = [];
    
    /** @type {boolean} */
    this.isRecording = false;
    
    /** @type {number|null} */
    this.startTime = null;
    
    /** @type {MediaStream|null} */
    this.stream = null;
    
    /** @type {boolean} */
    this.includeAudio = false;
    
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
    
    /** @type {Function|null} */
    this.onStreamEnded = null;
    
    /** @type {Object} */
    this.downloadService = downloadService;
    
    /** @type {Object} */
    this.permissionService = permissionService;
  }


  /**
   * Request screen sharing permission from the browser
   * @param {boolean} includeAudio - Whether to include system audio
   * @returns {Promise<MediaStream>} - MediaStream from screen capture
   * @throws {Error} - If permission is denied or unavailable
   */
  async requestPermission(includeAudio = false) {
    this.includeAudio = includeAudio;
    
    try {
      this.stream = await this.permissionService.requestScreenPermission(includeAudio);
      
      // Listen for when user stops sharing via browser UI
      this.stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          if (this.isRecording) {
            this.stopRecording();
          }
          if (this.onStreamEnded) {
            this.onStreamEnded();
          }
        };
      });
      
      return this.stream;
    } catch (error) {
      const message = this.permissionService.handlePermissionDenied('screen', error);
      if (this.onError) {
        this.onError(message);
      }
      throw error;
    }
  }

  /**
   * Start recording the screen
   * @returns {Promise<void>}
   * @throws {Error} - If no stream is available or recording fails
   */
  async startRecording() {
    // Request permission if we don't have a stream
    if (!this.stream) {
      await this.requestPermission(this.includeAudio);
    }

    // Reset state
    this.videoChunks = [];
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
        this.videoChunks.push(event.data);
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
        this.onError('Error durante la grabación: ' + (event.error?.message || 'Error desconocido'));
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
   * Stop recording the screen
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
   * Generate a downloadable video file from the recorded chunks
   * @returns {Blob|null} - Video blob or null if no recording
   */
  generateVideoFile() {
    if (this.videoChunks.length === 0) {
      return null;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
    return new Blob(this.videoChunks, { type: mimeType });
  }

  /**
   * Download the recorded video file
   * @param {string} filename - Optional custom filename
   */
  downloadRecording(filename = 'grabacion-pantalla') {
    const blob = this.generateVideoFile();
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
   * Check if the browser supports screen recording
   * @returns {boolean} - True if supported
   */
  isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getDisplayMedia && 
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
      hasRecording: this.videoChunks.length > 0,
      includeAudio: this.includeAudio
    };
  }


  /**
   * Handle recording stop event
   * @private
   */
  _handleRecordingStop() {
    const blob = this.generateVideoFile();
    
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
   * Get the best supported MIME type for video recording
   * @returns {string|null} - Supported MIME type or null
   * @private
   */
  _getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
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
    this.videoChunks = [];
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
    this.onStreamEnded = null;
  }
}
