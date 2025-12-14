/**
 * MediaExtractorController.js - Media Extraction Controller
 * 
 * Handles extracting audio or video tracks from multimedia files using FFmpeg.wasm.
 * All processing is done client-side without uploading to external servers.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { getFFmpegService } from '../services/FFmpegService.js';

export class MediaExtractorController {
  /**
   * @param {Object} downloadService - Service for downloading files
   */
  constructor(downloadService) {
    /** @type {Object} */
    this.downloadService = downloadService;
    
    /** @type {import('../services/FFmpegService.js').FFmpegService|null} */
    this.ffmpegService = null;
    
    /** @type {File|null} */
    this.loadedFile = null;
    
    /** @type {Object|null} */
    this.fileInfo = null;
    
    /** @type {boolean} */
    this.isProcessing = false;
    
    /** @type {Function|null} */
    this.onProgress = null;
    
    /** @type {Function|null} */
    this.onError = null;
    
    /** @type {Function|null} */
    this.onLoadingStart = null;
    
    /** @type {Function|null} */
    this.onLoadingComplete = null;
    
    /** @type {Function|null} */
    this.onExtractionComplete = null;
    
    /** @type {string[]} */
    this.supportedFormats = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/webm',
      'audio/wav',
      'audio/flac'
    ];
    
    /** @type {string[]} */
    this.supportedExtensions = [
      '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv',
      '.mp3', '.m4a', '.wav', '.flac', '.aac'
    ];
  }

  /**
   * Lazy load FFmpeg.wasm
   * @returns {Promise<void>}
   */
  async loadFFmpeg() {
    if (this.ffmpegService && this.ffmpegService.isReady()) {
      return;
    }

    if (this.onLoadingStart) {
      this.onLoadingStart();
    }

    try {
      this.ffmpegService = getFFmpegService();
      
      // Set up progress callback
      this.ffmpegService.onProgress = (progress, time) => {
        if (this.onProgress) {
          this.onProgress(progress, time);
        }
      };

      await this.ffmpegService.load();

      if (this.onLoadingComplete) {
        this.onLoadingComplete();
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error.message);
      }
      throw error;
    }
  }

  /**
   * Check if a file format is supported
   * @param {File} file - File to check
   * @returns {boolean}
   */
  isFormatSupported(file) {
    // Check MIME type
    if (file.type && this.supportedFormats.includes(file.type)) {
      return true;
    }
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    return this.supportedExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get list of supported formats for display
   * @returns {string[]}
   */
  getSupportedFormats() {
    return this.supportedExtensions.map(ext => ext.toUpperCase().slice(1));
  }

  /**
   * Analyze a file to detect available tracks
   * @param {File} file - Video/audio file to analyze
   * @returns {Promise<Object>} - File info with detected tracks
   */
  async analyzeFile(file) {
    // Validate file format
    if (!this.isFormatSupported(file)) {
      const error = `Formato no soportado. Formatos válidos: ${this.getSupportedFormats().join(', ')}`;
      if (this.onError) {
        this.onError(error);
      }
      throw new Error(error);
    }

    // Load FFmpeg if not already loaded
    await this.loadFFmpeg();

    this.loadedFile = file;
    
    try {
      // Write file to FFmpeg virtual filesystem
      const inputName = 'input' + this._getExtension(file.name);
      await this.ffmpegService.writeFile(inputName, file);

      // Get file info using ffprobe-like command
      // FFmpeg.wasm doesn't have ffprobe, so we'll detect tracks by attempting extraction
      const fileInfo = await this._detectTracks(inputName, file);
      
      // Clean up input file
      await this.ffmpegService.deleteFile(inputName);
      
      this.fileInfo = fileInfo;
      return fileInfo;
    } catch (error) {
      this.loadedFile = null;
      if (this.onError) {
        this.onError(`Error al analizar el archivo: ${error.message}`);
      }
      throw error;
    }
  }


  /**
   * Detect tracks in a media file
   * @param {string} inputName - Input filename in virtual filesystem
   * @param {File} file - Original file for metadata
   * @returns {Promise<Object>} - Detected tracks info
   * @private
   */
  async _detectTracks(inputName, file) {
    const tracks = [];
    const isVideo = file.type.startsWith('video/') || 
                    this._isVideoExtension(file.name);
    const isAudio = file.type.startsWith('audio/') || 
                    this._isAudioExtension(file.name);

    // For video files, assume both video and audio tracks
    if (isVideo) {
      tracks.push({
        type: 'video',
        codec: this._guessVideoCodec(file),
        index: 0
      });
      tracks.push({
        type: 'audio',
        codec: this._guessAudioCodec(file),
        index: 1
      });
    } else if (isAudio) {
      // Audio-only file
      tracks.push({
        type: 'audio',
        codec: this._guessAudioCodec(file),
        index: 0
      });
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      isVideo,
      isAudio: isAudio || isVideo,
      tracks,
      hasVideoTrack: isVideo,
      hasAudioTrack: true // Assume audio is present
    };
  }

  /**
   * Check if file extension indicates video
   * @param {string} filename
   * @returns {boolean}
   * @private
   */
  _isVideoExtension(filename) {
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lower = filename.toLowerCase();
    return videoExts.some(ext => lower.endsWith(ext));
  }

  /**
   * Check if file extension indicates audio
   * @param {string} filename
   * @returns {boolean}
   * @private
   */
  _isAudioExtension(filename) {
    const audioExts = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg'];
    const lower = filename.toLowerCase();
    return audioExts.some(ext => lower.endsWith(ext));
  }

  /**
   * Guess video codec from file
   * @param {File} file
   * @returns {string}
   * @private
   */
  _guessVideoCodec(file) {
    const ext = this._getExtension(file.name).toLowerCase();
    const codecMap = {
      '.mp4': 'h264',
      '.webm': 'vp8/vp9',
      '.mov': 'h264',
      '.avi': 'mpeg4',
      '.mkv': 'h264'
    };
    return codecMap[ext] || 'unknown';
  }

  /**
   * Guess audio codec from file
   * @param {File} file
   * @returns {string}
   * @private
   */
  _guessAudioCodec(file) {
    const ext = this._getExtension(file.name).toLowerCase();
    const codecMap = {
      '.mp4': 'aac',
      '.webm': 'opus',
      '.mp3': 'mp3',
      '.m4a': 'aac',
      '.wav': 'pcm',
      '.flac': 'flac',
      '.ogg': 'vorbis'
    };
    return codecMap[ext] || 'unknown';
  }

  /**
   * Extract audio from a video file
   * @param {File} file - Video file (optional, uses loaded file if not provided)
   * @returns {Promise<Blob>} - Extracted audio as Blob
   */
  async extractAudio(file = null) {
    const sourceFile = file || this.loadedFile;
    
    if (!sourceFile) {
      throw new Error('No hay archivo cargado');
    }

    // Load FFmpeg if not already loaded
    await this.loadFFmpeg();

    this.isProcessing = true;

    try {
      const inputName = 'input' + this._getExtension(sourceFile.name);
      const outputName = 'output.mp3';

      // Write input file
      await this.ffmpegService.writeFile(inputName, sourceFile);

      // Extract audio using FFmpeg
      // -vn: no video, -acodec mp3: encode as MP3
      await this.ffmpegService.exec([
        '-i', inputName,
        '-vn',
        '-acodec', 'libmp3lame',
        '-q:a', '2',
        outputName
      ]);

      // Read output file
      const data = await this.ffmpegService.readFile(outputName);

      // Clean up
      await this.ffmpegService.deleteFile(inputName);
      await this.ffmpegService.deleteFile(outputName);

      const blob = new Blob([data.buffer], { type: 'audio/mpeg' });

      this.isProcessing = false;

      if (this.onExtractionComplete) {
        this.onExtractionComplete(blob, 'audio');
      }

      return blob;
    } catch (error) {
      this.isProcessing = false;
      if (this.onError) {
        this.onError(`Error al extraer audio: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract video without audio from a video file
   * @param {File} file - Video file (optional, uses loaded file if not provided)
   * @returns {Promise<Blob>} - Video without audio as Blob
   */
  async extractVideoOnly(file = null) {
    const sourceFile = file || this.loadedFile;
    
    if (!sourceFile) {
      throw new Error('No hay archivo cargado');
    }

    // Load FFmpeg if not already loaded
    await this.loadFFmpeg();

    this.isProcessing = true;

    try {
      const inputName = 'input' + this._getExtension(sourceFile.name);
      const outputName = 'output.mp4';

      // Write input file
      await this.ffmpegService.writeFile(inputName, sourceFile);

      // Remove audio using FFmpeg
      // -an: no audio, -c:v copy: copy video codec (fast)
      await this.ffmpegService.exec([
        '-i', inputName,
        '-an',
        '-c:v', 'copy',
        outputName
      ]);

      // Read output file
      const data = await this.ffmpegService.readFile(outputName);

      // Clean up
      await this.ffmpegService.deleteFile(inputName);
      await this.ffmpegService.deleteFile(outputName);

      const blob = new Blob([data.buffer], { type: 'video/mp4' });

      this.isProcessing = false;

      if (this.onExtractionComplete) {
        this.onExtractionComplete(blob, 'video');
      }

      return blob;
    } catch (error) {
      this.isProcessing = false;
      if (this.onError) {
        this.onError(`Error al extraer video: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Download extracted audio
   * @param {Blob} blob - Audio blob
   * @param {string} originalFilename - Original filename for naming
   */
  downloadAudio(blob, originalFilename = 'audio') {
    const baseName = this._removeExtension(originalFilename);
    const filename = `${baseName}-audio.mp3`;
    this.downloadService.downloadBlob(blob, filename);
  }

  /**
   * Download extracted video
   * @param {Blob} blob - Video blob
   * @param {string} originalFilename - Original filename for naming
   */
  downloadVideo(blob, originalFilename = 'video') {
    const baseName = this._removeExtension(originalFilename);
    const filename = `${baseName}-sin-audio.mp4`;
    this.downloadService.downloadBlob(blob, filename);
  }

  /**
   * Get file extension including the dot
   * @param {string} filename
   * @returns {string}
   * @private
   */
  _getExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(lastDot) : '';
  }

  /**
   * Remove extension from filename
   * @param {string} filename
   * @returns {string}
   * @private
   */
  _removeExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(0, lastDot) : filename;
  }

  /**
   * Get current processing state
   * @returns {Object}
   */
  getState() {
    return {
      isProcessing: this.isProcessing,
      hasFile: this.loadedFile !== null,
      fileInfo: this.fileInfo,
      isFFmpegLoaded: this.ffmpegService?.isReady() || false
    };
  }

  /**
   * Reset the controller state
   */
  reset() {
    this.loadedFile = null;
    this.fileInfo = null;
    this.isProcessing = false;
  }

  /**
   * Cleanup and destroy the controller
   */
  destroy() {
    this.reset();
    this.onProgress = null;
    this.onError = null;
    this.onLoadingStart = null;
    this.onLoadingComplete = null;
    this.onExtractionComplete = null;
    // Don't destroy ffmpegService as it's shared
  }
}
