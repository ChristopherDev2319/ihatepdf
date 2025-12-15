/**
 * MediaExtractorView.js - Media Extractor UI Component
 * 
 * Provides the user interface for extracting audio or video tracks
 * from multimedia files.
 * 
 * Requirements: 4.1, 4.4
 */

import { MediaExtractorController } from '../controllers/MediaExtractorController.js';
import { DownloadService } from '../services/DownloadService.js';

export class MediaExtractorView {
  /**
   * @param {import('../router/Router.js').Router} router - Router instance for navigation
   */
  constructor(router) {
    this.router = router;
    
    /** @type {HTMLElement|null} */
    this.element = null;
    
    /** @type {MediaExtractorController|null} */
    this.controller = null;
    
    /** @type {DownloadService} */
    this.downloadService = new DownloadService();
    
    /** @type {Blob|null} */
    this.extractedBlob = null;
    
    /** @type {string|null} */
    this.extractedType = null;
  }

  /**
   * Render the media extractor page HTML
   * @returns {string} HTML string for the media extractor page
   */
  render() {
    return `
      <div class="media-extractor-page">
        <header class="tool-header">
          <button class="tool-header__back" aria-label="Volver al inicio">
            <span aria-hidden="true">←</span> Volver
          </button>
          <h1 class="tool-header__title">🎬 Extraer Media</h1>
        </header>

        <main class="tool-content">
          <!-- FFmpeg Loading Section -->
          <section class="ffmpeg-loading" hidden>
            <div class="ffmpeg-loading__spinner"></div>
            <p class="ffmpeg-loading__text">Cargando motor de procesamiento...</p>
            <small class="ffmpeg-loading__hint">Esto puede tomar unos segundos la primera vez</small>
          </section>

          <!-- File Upload Section -->
          <section class="extractor-upload" id="uploadSection">
            <div 
              class="file-upload__dropzone" 
              id="dropzone"
              role="button"
              tabindex="0"
              aria-label="Arrastra un archivo de video aquí o haz clic para seleccionar">
              <svg class="file-upload__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p class="file-upload__text">
                Arrastra un archivo de video aquí<br>
                <span class="file-upload__text--secondary">o haz clic para seleccionar</span>
              </p>
              <input 
                type="file" 
                id="fileInput" 
                class="file-upload__input" 
                accept="video/*,audio/*,.mp4,.webm,.mov,.avi,.mkv,.mp3,.m4a,.wav,.flac"
                aria-label="Seleccionar archivo">
            </div>
            <p class="extractor-upload__formats">
              Formatos soportados: MP4, WebM, MOV, AVI, MKV, MP3, M4A, WAV, FLAC
            </p>
          </section>

          <!-- File Info Section -->
          <section class="extractor-info" id="fileInfoSection" hidden>
            <h2 class="extractor-info__title">Archivo cargado</h2>
            <div class="extractor-info__details">
              <p class="extractor-info__name" id="fileName"></p>
              <p class="extractor-info__size" id="fileSize"></p>
            </div>
            
            <div class="extractor-tracks" id="tracksSection">
              <h3 class="extractor-tracks__title">Pistas detectadas</h3>
              <ul class="extractor-tracks__list" id="tracksList"></ul>
            </div>

            <div class="extractor-actions">
              <button 
                class="btn btn--primary" 
                id="extractAudioBtn"
                aria-label="Extraer audio del video">
                🎵 Extraer Audio
              </button>
              <button 
                class="btn btn--secondary" 
                id="extractVideoBtn"
                aria-label="Extraer video sin audio">
                🎬 Video sin Audio
              </button>
            </div>

            <button class="btn btn--text" id="changeFileBtn">
              Cambiar archivo
            </button>
          </section>

          <!-- Progress Section -->
          <section class="extractor-progress" id="progressSection" hidden>
            <div class="extractor-progress__indicator">
              <div class="extractor-progress__spinner"></div>
              <p class="extractor-progress__text" id="progressText">Procesando...</p>
            </div>
            <div class="extractor-progress__bar">
              <div class="extractor-progress__fill" id="progressFill"></div>
            </div>
            <p class="extractor-progress__percent" id="progressPercent">0%</p>
          </section>

          <!-- Result Section -->
          <section class="extractor-result" id="resultSection" hidden>
            <h2 class="extractor-result__title">¡Extracción completada!</h2>
            <div class="extractor-result__preview" id="previewContainer">
              <!-- Audio or video preview will be inserted here -->
            </div>
            <div class="extractor-result__actions">
              <button class="btn btn--primary" id="downloadBtn">
                Descargar
              </button>
              <button class="btn btn--secondary" id="newExtractionBtn">
                Nueva extracción
              </button>
            </div>
          </section>

          <!-- Error Section -->
          <section class="extractor-error" id="errorSection" hidden aria-live="assertive">
            <p class="extractor-error__message" id="errorMessage"></p>
            <button class="btn btn--secondary" id="retryBtn">
              Intentar de nuevo
            </button>
          </section>

          <!-- Info Section -->
          <section class="recorder-info">
            <h2 class="recorder-info__title">Información</h2>
            <ul class="recorder-info__list">
              <li>Extrae audio de videos para obtener solo la pista de sonido</li>
              <li>Elimina el audio de videos para obtener video silencioso</li>
              <li>Todo el procesamiento se realiza en tu navegador</li>
              <li>No se envían datos a ningún servidor</li>
            </ul>
          </section>
        </main>

        <footer class="tool-footer">
          <p class="tool-footer__text">
            Procesamiento 100% local. Tu privacidad está protegida.
          </p>
        </footer>
      </div>
    `;
  }


  /**
   * Mount the component and attach event listeners
   * @param {HTMLElement} container - Container element
   */
  mount(container) {
    this.element = container;
    
    // Initialize controller
    this.controller = new MediaExtractorController(this.downloadService);
    
    // Set up controller callbacks
    this._setupControllerCallbacks();
    
    // Attach event listeners
    this._attachEventListeners();
  }

  /**
   * Set up controller callbacks
   * @private
   */
  _setupControllerCallbacks() {
    this.controller.onLoadingStart = () => {
      this._showFFmpegLoading(true);
    };
    
    this.controller.onLoadingComplete = () => {
      this._showFFmpegLoading(false);
    };
    
    this.controller.onProgress = (progress) => {
      this._updateProgress(progress);
    };
    
    this.controller.onError = (message) => {
      this._showError(message);
    };
    
    this.controller.onExtractionComplete = (blob, type) => {
      this.extractedBlob = blob;
      this.extractedType = type;
      this._showResult(blob, type);
    };
  }

  /**
   * Attach event listeners to UI elements
   * @private
   */
  _attachEventListeners() {
    // Back button
    const backBtn = this.element.querySelector('.tool-header__back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this._handleBack());
    }
    
    // File input and dropzone
    const fileInput = this.element.querySelector('#fileInput');
    const dropzone = this.element.querySelector('#dropzone');
    
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this._handleFileSelect(e));
    }
    
    if (dropzone) {
      dropzone.addEventListener('click', () => fileInput?.click());
      dropzone.addEventListener('dragover', (e) => this._handleDragOver(e));
      dropzone.addEventListener('dragleave', (e) => this._handleDragLeave(e));
      dropzone.addEventListener('drop', (e) => this._handleDrop(e));
    }
    
    // Extract buttons
    const extractAudioBtn = this.element.querySelector('#extractAudioBtn');
    const extractVideoBtn = this.element.querySelector('#extractVideoBtn');
    
    if (extractAudioBtn) {
      extractAudioBtn.addEventListener('click', () => this._handleExtractAudio());
    }
    
    if (extractVideoBtn) {
      extractVideoBtn.addEventListener('click', () => this._handleExtractVideo());
    }
    
    // Change file button
    const changeFileBtn = this.element.querySelector('#changeFileBtn');
    if (changeFileBtn) {
      changeFileBtn.addEventListener('click', () => this._handleChangeFile());
    }
    
    // Download button
    const downloadBtn = this.element.querySelector('#downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this._handleDownload());
    }
    
    // New extraction button
    const newExtractionBtn = this.element.querySelector('#newExtractionBtn');
    if (newExtractionBtn) {
      newExtractionBtn.addEventListener('click', () => this._handleNewExtraction());
    }
    
    // Retry button
    const retryBtn = this.element.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this._handleRetry());
    }
  }

  /**
   * Handle back button click
   * @private
   */
  _handleBack() {
    if (this.controller && this.controller.isProcessing) {
      if (confirm('¿Estás seguro de que quieres salir? El procesamiento actual se cancelará.')) {
        this.controller.reset();
        this.router.navigate('/');
      }
    } else {
      this.router.navigate('/');
    }
  }

  /**
   * Handle file selection from input
   * @param {Event} e
   * @private
   */
  async _handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      await this._processFile(file);
    }
  }

  /**
   * Handle drag over event
   * @param {DragEvent} e
   * @private
   */
  _handleDragOver(e) {
    e.preventDefault();
    const dropzone = this.element.querySelector('#dropzone');
    dropzone?.classList.add('file-upload__dropzone--dragover');
  }

  /**
   * Handle drag leave event
   * @param {DragEvent} e
   * @private
   */
  _handleDragLeave(e) {
    e.preventDefault();
    const dropzone = this.element.querySelector('#dropzone');
    dropzone?.classList.remove('file-upload__dropzone--dragover');
  }

  /**
   * Handle file drop
   * @param {DragEvent} e
   * @private
   */
  async _handleDrop(e) {
    e.preventDefault();
    const dropzone = this.element.querySelector('#dropzone');
    dropzone?.classList.remove('file-upload__dropzone--dragover');
    
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await this._processFile(file);
    }
  }

  /**
   * Process uploaded file
   * @param {File} file
   * @private
   */
  async _processFile(file) {
    this._hideError();
    
    try {
      const fileInfo = await this.controller.analyzeFile(file);
      this._showFileInfo(fileInfo);
    } catch (error) {
      console.error('File analysis failed:', error);
    }
  }

  /**
   * Handle extract audio button click
   * @private
   */
  async _handleExtractAudio() {
    this._hideError();
    this._showProgress('Extrayendo audio...');
    
    try {
      await this.controller.extractAudio();
    } catch (error) {
      console.error('Audio extraction failed:', error);
    }
  }

  /**
   * Handle extract video button click
   * @private
   */
  async _handleExtractVideo() {
    this._hideError();
    this._showProgress('Eliminando audio del video...');
    
    try {
      await this.controller.extractVideoOnly();
    } catch (error) {
      console.error('Video extraction failed:', error);
    }
  }

  /**
   * Handle change file button click
   * @private
   */
  _handleChangeFile() {
    this.controller.reset();
    this._resetUI();
  }

  /**
   * Handle download button click
   * @private
   */
  _handleDownload() {
    if (!this.extractedBlob || !this.controller.loadedFile) {
      return;
    }
    
    const originalName = this.controller.loadedFile.name;
    
    if (this.extractedType === 'audio') {
      this.controller.downloadAudio(this.extractedBlob, originalName);
    } else {
      this.controller.downloadVideo(this.extractedBlob, originalName);
    }
  }

  /**
   * Handle new extraction button click
   * @private
   */
  _handleNewExtraction() {
    this.extractedBlob = null;
    this.extractedType = null;
    this.controller.reset();
    this._resetUI();
  }

  /**
   * Handle retry button click
   * @private
   */
  _handleRetry() {
    this._hideError();
    this._resetUI();
  }

  /**
   * Show FFmpeg loading indicator
   * @param {boolean} show
   * @private
   */
  _showFFmpegLoading(show) {
    const loadingSection = this.element.querySelector('.ffmpeg-loading');
    const uploadSection = this.element.querySelector('#uploadSection');
    
    if (loadingSection) {
      loadingSection.hidden = !show;
    }
    if (uploadSection) {
      uploadSection.hidden = show;
    }
  }

  /**
   * Show file info section
   * @param {Object} fileInfo
   * @private
   */
  _showFileInfo(fileInfo) {
    const uploadSection = this.element.querySelector('#uploadSection');
    const fileInfoSection = this.element.querySelector('#fileInfoSection');
    const fileName = this.element.querySelector('#fileName');
    const fileSize = this.element.querySelector('#fileSize');
    const tracksList = this.element.querySelector('#tracksList');
    const extractVideoBtn = this.element.querySelector('#extractVideoBtn');
    
    if (uploadSection) uploadSection.hidden = true;
    if (fileInfoSection) fileInfoSection.hidden = false;
    
    if (fileName) fileName.textContent = fileInfo.name;
    if (fileSize) fileSize.textContent = this._formatFileSize(fileInfo.size);
    
    // Show tracks
    if (tracksList) {
      tracksList.innerHTML = fileInfo.tracks.map(track => `
        <li class="extractor-tracks__item">
          <span class="extractor-tracks__icon">${track.type === 'video' ? '🎬' : '🎵'}</span>
          <span class="extractor-tracks__type">${track.type === 'video' ? 'Video' : 'Audio'}</span>
          <span class="extractor-tracks__codec">(${track.codec})</span>
        </li>
      `).join('');
    }
    
    // Hide video extraction button for audio-only files
    if (extractVideoBtn) {
      extractVideoBtn.hidden = !fileInfo.hasVideoTrack;
    }
  }

  /**
   * Show progress section
   * @param {string} text
   * @private
   */
  _showProgress(text) {
    const fileInfoSection = this.element.querySelector('#fileInfoSection');
    const progressSection = this.element.querySelector('#progressSection');
    const progressText = this.element.querySelector('#progressText');
    
    if (fileInfoSection) fileInfoSection.hidden = true;
    if (progressSection) progressSection.hidden = false;
    if (progressText) progressText.textContent = text;
    
    this._updateProgress(0);
  }

  /**
   * Update progress indicator
   * @param {number} progress - Progress value 0-1
   * @private
   */
  _updateProgress(progress) {
    const progressFill = this.element.querySelector('#progressFill');
    const progressPercent = this.element.querySelector('#progressPercent');
    
    const percent = Math.round(progress * 100);
    
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    if (progressPercent) {
      progressPercent.textContent = `${percent}%`;
    }
  }

  /**
   * Show result section
   * @param {Blob} blob
   * @param {string} type - 'audio' or 'video'
   * @private
   */
  _showResult(blob, type) {
    const progressSection = this.element.querySelector('#progressSection');
    const resultSection = this.element.querySelector('#resultSection');
    const previewContainer = this.element.querySelector('#previewContainer');
    
    if (progressSection) progressSection.hidden = true;
    if (resultSection) resultSection.hidden = false;
    
    // Create preview element
    if (previewContainer) {
      const url = URL.createObjectURL(blob);
      
      if (type === 'audio') {
        previewContainer.innerHTML = `
          <audio class="extractor-result__audio" controls src="${url}"></audio>
        `;
      } else {
        previewContainer.innerHTML = `
          <video class="extractor-result__video" controls src="${url}"></video>
        `;
      }
    }
  }

  /**
   * Show error message
   * @param {string} message
   * @private
   */
  _showError(message) {
    const errorSection = this.element.querySelector('#errorSection');
    const errorMessage = this.element.querySelector('#errorMessage');
    const progressSection = this.element.querySelector('#progressSection');
    
    if (progressSection) progressSection.hidden = true;
    if (errorSection) errorSection.hidden = false;
    if (errorMessage) errorMessage.textContent = message;
  }

  /**
   * Hide error message
   * @private
   */
  _hideError() {
    const errorSection = this.element.querySelector('#errorSection');
    if (errorSection) {
      errorSection.hidden = true;
    }
  }

  /**
   * Reset UI to initial state
   * @private
   */
  _resetUI() {
    const uploadSection = this.element.querySelector('#uploadSection');
    const fileInfoSection = this.element.querySelector('#fileInfoSection');
    const progressSection = this.element.querySelector('#progressSection');
    const resultSection = this.element.querySelector('#resultSection');
    const fileInput = this.element.querySelector('#fileInput');
    
    if (uploadSection) uploadSection.hidden = false;
    if (fileInfoSection) fileInfoSection.hidden = true;
    if (progressSection) progressSection.hidden = true;
    if (resultSection) resultSection.hidden = true;
    if (fileInput) fileInput.value = '';
    
    this._hideError();
  }

  /**
   * Format file size for display
   * @param {number} bytes
   * @returns {string}
   * @private
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup when component is destroyed
   */
  destroy() {
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    }
    
    if (this.downloadService) {
      this.downloadService.cleanup();
    }
    
    this.extractedBlob = null;
    this.extractedType = null;
    this.element = null;
  }
}
