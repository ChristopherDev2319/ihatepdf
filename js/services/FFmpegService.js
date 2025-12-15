/**
 * FFmpegService.js - FFmpeg.wasm Lazy Loading Service
 * 
 * Provides lazy loading mechanism for FFmpeg.wasm to avoid loading
 * the large library until it's actually needed.
 * All processing is done client-side without uploading to external servers.
 * 
 * Requirements: 4.1
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
  constructor() {
    /** @type {FFmpeg|null} */
    this.ffmpeg = null;
    
    /** @type {boolean} */
    this.isLoaded = false;
    
    /** @type {boolean} */
    this.isLoading = false;
    
    /** @type {Function|null} */
    this.onProgress = null;
    
    /** @type {Function|null} */
    this.onLog = null;
  }

  /**
   * Lazy load FFmpeg.wasm
   * @returns {Promise<FFmpeg>} - Loaded FFmpeg instance
   */
  async load() {
    if (this.isLoaded && this.ffmpeg) {
      return this.ffmpeg;
    }

    if (this.isLoading) {
      // Wait for existing load to complete
      return this._waitForLoad();
    }

    this.isLoading = true;

    try {
      this.ffmpeg = new FFmpeg();

      // Set up progress callback
      this.ffmpeg.on('progress', ({ progress, time }) => {
        if (this.onProgress) {
          this.onProgress(progress, time);
        }
      });

      // Set up log callback
      this.ffmpeg.on('log', ({ message }) => {
        if (this.onLog) {
          this.onLog(message);
        }
      });

      // Load FFmpeg with WASM files from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
      this.isLoading = false;

      return this.ffmpeg;
    } catch (error) {
      this.isLoading = false;
      throw new Error(`Error al cargar FFmpeg: ${error.message}`);
    }
  }

  /**
   * Wait for an existing load operation to complete
   * @returns {Promise<FFmpeg>}
   * @private
   */
  async _waitForLoad() {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.isLoaded && this.ffmpeg) {
          clearInterval(checkInterval);
          resolve(this.ffmpeg);
        } else if (!this.isLoading) {
          clearInterval(checkInterval);
          reject(new Error('FFmpeg load failed'));
        }
      }, 100);
    });
  }

  /**
   * Check if FFmpeg is loaded
   * @returns {boolean}
   */
  isReady() {
    return this.isLoaded && this.ffmpeg !== null;
  }

  /**
   * Get the FFmpeg instance (must be loaded first)
   * @returns {FFmpeg|null}
   */
  getInstance() {
    return this.ffmpeg;
  }

  /**
   * Write a file to FFmpeg's virtual filesystem
   * @param {string} name - Filename in virtual filesystem
   * @param {File|Blob|ArrayBuffer|Uint8Array} data - File data
   */
  async writeFile(name, data) {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg no está cargado');
    }

    let fileData;
    if (data instanceof File || data instanceof Blob) {
      fileData = await fetchFile(data);
    } else if (data instanceof ArrayBuffer) {
      fileData = new Uint8Array(data);
    } else {
      fileData = data;
    }

    await this.ffmpeg.writeFile(name, fileData);
  }

  /**
   * Read a file from FFmpeg's virtual filesystem
   * @param {string} name - Filename in virtual filesystem
   * @returns {Promise<Uint8Array>} - File data
   */
  async readFile(name) {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg no está cargado');
    }

    return await this.ffmpeg.readFile(name);
  }

  /**
   * Delete a file from FFmpeg's virtual filesystem
   * @param {string} name - Filename to delete
   */
  async deleteFile(name) {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg no está cargado');
    }

    try {
      await this.ffmpeg.deleteFile(name);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  /**
   * Execute an FFmpeg command
   * @param {string[]} args - FFmpeg command arguments
   * @returns {Promise<number>} - Exit code
   */
  async exec(args) {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg no está cargado');
    }

    return await this.ffmpeg.exec(args);
  }

  /**
   * Terminate FFmpeg instance
   */
  terminate() {
    if (this.ffmpeg) {
      this.ffmpeg.terminate();
      this.ffmpeg = null;
      this.isLoaded = false;
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.terminate();
    this.onProgress = null;
    this.onLog = null;
  }
}

// Singleton instance for shared use
let ffmpegServiceInstance = null;

/**
 * Get the shared FFmpegService instance
 * @returns {FFmpegService}
 */
export function getFFmpegService() {
  if (!ffmpegServiceInstance) {
    ffmpegServiceInstance = new FFmpegService();
  }
  return ffmpegServiceInstance;
}
