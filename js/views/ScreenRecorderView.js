/**
 * ScreenRecorderView.js - Screen Recorder UI Component
 * 
 * Provides the user interface for screen recording functionality.
 * Displays record/stop buttons, audio toggle, recording status, and elapsed time.
 * 
 * Requirements: 3.3, 3.6
 */

import { ScreenRecorderController } from '../controllers/ScreenRecorderController.js';
import { DownloadService } from '../services/DownloadService.js';
import { PermissionService } from '../services/PermissionService.js';

export class ScreenRecorderView {
  /**
   * @param {import('../router/Router.js').Router} router - Router instance for navigation
   */
  constructor(router) {
    this.router = router;
    
    /** @type {HTMLElement|null} */
    this.element = null;
    
    /** @type {ScreenRecorderController|null} */
    this.controller = null;
    
    /** @type {DownloadService} */
    this.downloadService = new DownloadService();
    
    /** @type {PermissionService} */
    this.permissionService = new PermissionService();
    
    /** @type {Blob|null} */
    this.lastRecording = null;
    
    /** @type {boolean} */
    this.includeAudio = false;
  }

  /**
   * Render the screen recorder page HTML
   * @returns {string} HTML string for the screen recorder page
   */
  render() {
    return `
      <div class="screen-recorder-page">
        <header class="tool-header">
          <button class="tool-header__back" aria-label="Volver al inicio">
            <span aria-hidden="true">←</span> Volver
          </button>
          <h1 class="tool-header__title">🖥️ Grabar Pantalla</h1>
        </header>

        <main class="tool-content">
          <section class="recorder-section">
            <div class="recorder-status" aria-live="polite">
              <div class="recorder-status__indicator" data-recording="false"></div>
              <span class="recorder-status__text">Listo para grabar</span>
            </div>

            <div class="recorder-timer" aria-label="Tiempo de grabación">
              <span class="recorder-timer__time">00:00</span>
            </div>

            <div class="recorder-options">
              <label class="recorder-option">
                <input 
                  type="checkbox" 
                  id="includeAudioCheckbox"
                  class="recorder-option__checkbox">
                <span class="recorder-option__label">Incluir audio del sistema</span>
              </label>
              <small class="recorder-option__help">
                Nota: El audio del sistema puede no estar disponible en todos los navegadores
              </small>
            </div>

            <div class="recorder-controls">
              <button 
                class="recorder-btn recorder-btn--record" 
                id="recordBtn"
                aria-label="Iniciar grabación de pantalla">
                <span class="recorder-btn__icon">●</span>
                <span class="recorder-btn__text">Grabar</span>
              </button>

              <button 
                class="recorder-btn recorder-btn--stop" 
                id="stopBtn"
                disabled
                aria-label="Detener grabación">
                <span class="recorder-btn__icon">■</span>
                <span class="recorder-btn__text">Detener</span>
              </button>
            </div>

            <div class="recorder-error" hidden aria-live="assertive">
              <p class="recorder-error__message"></p>
            </div>

            <div class="recorder-result" hidden>
              <h2 class="recorder-result__title">Grabación completada</h2>
              <video class="recorder-result__video" controls></video>
              <div class="recorder-result__actions">
                <button class="btn btn--primary" id="downloadBtn">
                  Descargar grabación
                </button>
                <button class="btn btn--secondary" id="newRecordingBtn">
                  Nueva grabación
                </button>
              </div>
            </div>
          </section>

          <section class="recorder-info">
            <h2 class="recorder-info__title">Información</h2>
            <ul class="recorder-info__list">
              <li>El video se graba directamente en tu navegador</li>
              <li>No se envían datos a ningún servidor</li>
              <li>El formato de salida es WebM (compatible con la mayoría de reproductores)</li>
              <li>Puedes seleccionar una ventana específica, una pestaña o toda la pantalla</li>
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
    this.controller = new ScreenRecorderController(
      this.downloadService,
      this.permissionService
    );
    
    // Set up controller callbacks
    this._setupControllerCallbacks();
    
    // Attach event listeners
    this._attachEventListeners();
    
    // Check browser support
    if (!this.controller.isSupported()) {
      this._showError('Tu navegador no soporta la grabación de pantalla. Por favor, usa un navegador moderno como Chrome, Firefox o Edge.');
    }
  }

  /**
   * Set up controller callbacks
   * @private
   */
  _setupControllerCallbacks() {
    this.controller.onTimeUpdate = (seconds, formatted) => {
      this._updateTimer(formatted);
    };
    
    this.controller.onRecordingStart = () => {
      this._updateUIForRecording(true);
    };
    
    this.controller.onRecordingComplete = (blob) => {
      this.lastRecording = blob;
      this._showRecordingResult(blob);
    };
    
    this.controller.onError = (message) => {
      this._showError(message);
    };
    
    this.controller.onStreamEnded = () => {
      // User stopped sharing via browser UI
      this._updateUIForRecording(false);
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
    
    // Audio checkbox
    const audioCheckbox = this.element.querySelector('#includeAudioCheckbox');
    if (audioCheckbox) {
      audioCheckbox.addEventListener('change', (e) => {
        this.includeAudio = e.target.checked;
      });
    }
    
    // Record button
    const recordBtn = this.element.querySelector('#recordBtn');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => this._handleRecord());
    }
    
    // Stop button
    const stopBtn = this.element.querySelector('#stopBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this._handleStop());
    }
    
    // Download button
    const downloadBtn = this.element.querySelector('#downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this._handleDownload());
    }
    
    // New recording button
    const newRecordingBtn = this.element.querySelector('#newRecordingBtn');
    if (newRecordingBtn) {
      newRecordingBtn.addEventListener('click', () => this._handleNewRecording());
    }
  }

  /**
   * Handle back button click
   * @private
   */
  _handleBack() {
    if (this.controller && this.controller.isRecording) {
      if (confirm('¿Estás seguro de que quieres salir? La grabación actual se perderá.')) {
        this.controller.reset();
        this.router.navigate('/');
      }
    } else {
      this.router.navigate('/');
    }
  }

  /**
   * Handle record button click
   * @private
   */
  async _handleRecord() {
    this._hideError();
    
    try {
      // Request permission with audio option
      await this.controller.requestPermission(this.includeAudio);
      await this.controller.startRecording();
    } catch (error) {
      // Error is handled by controller callback
      console.error('Screen recording failed:', error);
    }
  }

  /**
   * Handle stop button click
   * @private
   */
  _handleStop() {
    this.controller.stopRecording();
    this._updateUIForRecording(false);
  }

  /**
   * Handle download button click
   * @private
   */
  _handleDownload() {
    if (this.lastRecording) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      this.controller.downloadRecording(`grabacion-pantalla-${timestamp}`);
    }
  }

  /**
   * Handle new recording button click
   * @private
   */
  _handleNewRecording() {
    this.lastRecording = null;
    this._resetUI();
  }


  /**
   * Update the timer display
   * @param {string} formatted - Formatted time string (MM:SS)
   * @private
   */
  _updateTimer(formatted) {
    const timerEl = this.element.querySelector('.recorder-timer__time');
    if (timerEl) {
      timerEl.textContent = formatted;
    }
  }

  /**
   * Update UI for recording state
   * @param {boolean} isRecording - Whether recording is active
   * @private
   */
  _updateUIForRecording(isRecording) {
    const recordBtn = this.element.querySelector('#recordBtn');
    const stopBtn = this.element.querySelector('#stopBtn');
    const indicator = this.element.querySelector('.recorder-status__indicator');
    const statusText = this.element.querySelector('.recorder-status__text');
    const resultSection = this.element.querySelector('.recorder-result');
    const audioCheckbox = this.element.querySelector('#includeAudioCheckbox');
    const optionsSection = this.element.querySelector('.recorder-options');
    
    if (recordBtn) {
      recordBtn.disabled = isRecording;
    }
    
    if (stopBtn) {
      stopBtn.disabled = !isRecording;
    }
    
    if (indicator) {
      indicator.setAttribute('data-recording', isRecording.toString());
    }
    
    if (statusText) {
      statusText.textContent = isRecording ? 'Grabando pantalla...' : 'Listo para grabar';
    }
    
    if (resultSection) {
      resultSection.hidden = true;
    }
    
    // Disable audio option while recording
    if (audioCheckbox) {
      audioCheckbox.disabled = isRecording;
    }
    
    if (optionsSection) {
      optionsSection.classList.toggle('recorder-options--disabled', isRecording);
    }
  }

  /**
   * Show the recording result section
   * @param {Blob} blob - The recorded video blob
   * @private
   */
  _showRecordingResult(blob) {
    const resultSection = this.element.querySelector('.recorder-result');
    const videoEl = this.element.querySelector('.recorder-result__video');
    
    if (resultSection) {
      resultSection.hidden = false;
    }
    
    if (videoEl && blob) {
      const url = URL.createObjectURL(blob);
      videoEl.src = url;
    }
  }

  /**
   * Show an error message
   * @param {string} message - Error message to display
   * @private
   */
  _showError(message) {
    const errorSection = this.element.querySelector('.recorder-error');
    const errorMessage = this.element.querySelector('.recorder-error__message');
    
    if (errorSection && errorMessage) {
      errorMessage.textContent = message;
      errorSection.hidden = false;
    }
  }

  /**
   * Hide the error message
   * @private
   */
  _hideError() {
    const errorSection = this.element.querySelector('.recorder-error');
    if (errorSection) {
      errorSection.hidden = true;
    }
  }

  /**
   * Reset the UI to initial state
   * @private
   */
  _resetUI() {
    this._updateUIForRecording(false);
    this._updateTimer('00:00');
    this._hideError();
    
    const resultSection = this.element.querySelector('.recorder-result');
    if (resultSection) {
      resultSection.hidden = true;
    }
    
    const videoEl = this.element.querySelector('.recorder-result__video');
    if (videoEl) {
      videoEl.src = '';
    }
    
    // Reset audio checkbox
    const audioCheckbox = this.element.querySelector('#includeAudioCheckbox');
    if (audioCheckbox) {
      audioCheckbox.checked = false;
      this.includeAudio = false;
    }
    
    // Reset controller state
    if (this.controller) {
      this.controller.videoChunks = [];
      this.controller.startTime = null;
      this.controller.stream = null;
    }
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
    
    this.lastRecording = null;
    this.element = null;
  }
}
