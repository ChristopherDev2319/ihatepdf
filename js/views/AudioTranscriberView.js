/**
 * AudioTranscriberView.js - Audio Transcriber UI Component
 * 
 * Provides the user interface for audio-to-text transcription.
 * Displays live/file transcription options, real-time transcript,
 * and copy/download functionality.
 * 
 * Requirements: 7.1, 7.4, 7.5, 7.7
 */

import { AudioTranscriberController } from '../controllers/AudioTranscriberController.js';
import { DownloadService } from '../services/DownloadService.js';
import { PermissionService } from '../services/PermissionService.js';

export class AudioTranscriberView {
  /**
   * @param {import('../router/Router.js').Router} router - Router instance for navigation
   */
  constructor(router) {
    this.router = router;
    
    /** @type {HTMLElement|null} */
    this.element = null;
    
    /** @type {AudioTranscriberController|null} */
    this.controller = null;
    
    /** @type {DownloadService} */
    this.downloadService = new DownloadService();
    
    /** @type {PermissionService} */
    this.permissionService = new PermissionService();
    
    /** @type {'idle'|'live'|'file'} */
    this.mode = 'idle';
  }

  /**
   * Render the audio transcriber page HTML
   * @returns {string} HTML string for the audio transcriber page
   */
  render() {
    return `
      <div class="audio-transcriber-page">
        <header class="tool-header">
          <button class="tool-header__back" aria-label="Volver al inicio">
            <span aria-hidden="true">←</span> Volver
          </button>
          <h1 class="tool-header__title">📝 Audio a Texto</h1>
        </header>

        <main class="tool-content">
          <div class="transcriber-warning" hidden aria-live="assertive">
            <p class="transcriber-warning__message">
              ⚠️ Tu navegador no soporta reconocimiento de voz. 
              Por favor, usa Chrome o Edge para esta funcionalidad.
            </p>
          </div>

          <section class="transcriber-options">
            <h2 class="transcriber-options__title">Selecciona el modo de transcripción</h2>
            
            <div class="transcriber-options__grid">
              <button class="transcriber-option" id="liveTranscribeBtn">
                <span class="transcriber-option__icon">🎤</span>
                <span class="transcriber-option__title">Transcripción en vivo</span>
                <span class="transcriber-option__desc">Habla directamente al micrófono</span>
              </button>
              
              <button class="transcriber-option" id="fileTranscribeBtn">
                <span class="transcriber-option__icon">📁</span>
                <span class="transcriber-option__title">Transcribir archivo</span>
                <span class="transcriber-option__desc">Sube un archivo de audio</span>
              </button>
            </div>
          </section>

          <section class="transcriber-settings">
            <label class="transcriber-settings__label" for="languageSelect">
              Idioma de reconocimiento:
            </label>
            <select class="transcriber-settings__select" id="languageSelect">
              <option value="es-ES">Español (España)</option>
              <option value="es-MX">Español (México)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
              <option value="it-IT">Italiano</option>
              <option value="pt-BR">Português (Brasil)</option>
            </select>
          </section>

          <section class="transcriber-file-upload" hidden>
            <input type="file" id="audioFileInput" accept="audio/*" hidden />
            <button class="btn btn--secondary" id="selectFileBtn">
              Seleccionar archivo de audio
            </button>
            <span class="transcriber-file-upload__name" id="selectedFileName"></span>
          </section>

          <section class="transcriber-status" hidden aria-live="polite">
            <div class="transcriber-status__indicator" data-transcribing="false"></div>
            <span class="transcriber-status__text">Listo</span>
          </section>

          <section class="transcriber-controls" hidden>
            <button class="btn btn--primary" id="startBtn">
              Iniciar transcripción
            </button>
            <button class="btn btn--danger" id="stopBtn" disabled>
              Detener
            </button>
          </section>

          <section class="transcriber-result">
            <h2 class="transcriber-result__title">Transcripción</h2>
            <div class="transcriber-result__text" id="transcriptText" aria-live="polite">
              <p class="transcriber-result__placeholder">
                El texto transcrito aparecerá aquí...
              </p>
            </div>
            <div class="transcriber-result__interim" id="interimText"></div>
            <div class="transcriber-result__actions">
              <button class="btn btn--secondary" id="copyBtn" disabled>
                📋 Copiar texto
              </button>
              <button class="btn btn--secondary" id="downloadBtn" disabled>
                💾 Descargar .txt
              </button>
              <button class="btn btn--secondary" id="clearBtn" disabled>
                🗑️ Limpiar
              </button>
            </div>
          </section>

          <div class="transcriber-error" hidden aria-live="assertive">
            <p class="transcriber-error__message"></p>
          </div>

          <section class="transcriber-info">
            <h2 class="transcriber-info__title">Información</h2>
            <ul class="transcriber-info__list">
              <li>La transcripción se realiza usando la API de reconocimiento de voz del navegador</li>
              <li>Para transcribir archivos, el audio se reproduce y se captura con el micrófono</li>
              <li>No se envían datos a servidores externos (procesamiento local)</li>
              <li>Funciona mejor en Chrome o Edge</li>
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
    this.controller = new AudioTranscriberController(
      this.downloadService,
      this.permissionService
    );
    
    // Set up controller callbacks
    this._setupControllerCallbacks();
    
    // Attach event listeners
    this._attachEventListeners();
    
    // Check browser support
    if (!this.controller.checkBrowserSupport()) {
      this._showBrowserWarning();
    }
  }

  /**
   * Set up controller callbacks
   * @private
   */
  _setupControllerCallbacks() {
    this.controller.onTranscriptUpdate = (transcript, interim) => {
      this._updateTranscript(transcript, interim);
    };
    
    this.controller.onTranscriptionStart = () => {
      this._updateUIForTranscribing(true);
    };
    
    this.controller.onTranscriptionEnd = () => {
      this._updateUIForTranscribing(false);
    };
    
    this.controller.onError = (message) => {
      this._showError(message);
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
    
    // Live transcription button
    const liveBtn = this.element.querySelector('#liveTranscribeBtn');
    if (liveBtn) {
      liveBtn.addEventListener('click', () => this._selectMode('live'));
    }
    
    // File transcription button
    const fileBtn = this.element.querySelector('#fileTranscribeBtn');
    if (fileBtn) {
      fileBtn.addEventListener('click', () => this._selectMode('file'));
    }
    
    // Language select
    const langSelect = this.element.querySelector('#languageSelect');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.controller.setLanguage(e.target.value);
      });
    }
    
    // File input
    const fileInput = this.element.querySelector('#audioFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this._handleFileSelect(e));
    }
    
    // Select file button
    const selectFileBtn = this.element.querySelector('#selectFileBtn');
    if (selectFileBtn) {
      selectFileBtn.addEventListener('click', () => {
        this.element.querySelector('#audioFileInput')?.click();
      });
    }
    
    // Start button
    const startBtn = this.element.querySelector('#startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this._handleStart());
    }
    
    // Stop button
    const stopBtn = this.element.querySelector('#stopBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this._handleStop());
    }
    
    // Copy button
    const copyBtn = this.element.querySelector('#copyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this._handleCopy());
    }
    
    // Download button
    const downloadBtn = this.element.querySelector('#downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this._handleDownload());
    }
    
    // Clear button
    const clearBtn = this.element.querySelector('#clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this._handleClear());
    }
  }

  /**
   * Handle back button click
   * @private
   */
  _handleBack() {
    if (this.controller && this.controller.isTranscribing) {
      if (confirm('¿Estás seguro de que quieres salir? La transcripción actual se detendrá.')) {
        this.controller.reset();
        this.router.navigate('/');
      }
    } else {
      this.router.navigate('/');
    }
  }

  /**
   * Select transcription mode
   * @param {'live'|'file'} mode - Selected mode
   * @private
   */
  _selectMode(mode) {
    this.mode = mode;
    
    const fileUpload = this.element.querySelector('.transcriber-file-upload');
    const status = this.element.querySelector('.transcriber-status');
    const controls = this.element.querySelector('.transcriber-controls');
    const options = this.element.querySelector('.transcriber-options');
    
    // Update option buttons
    const liveBtn = this.element.querySelector('#liveTranscribeBtn');
    const fileBtn = this.element.querySelector('#fileTranscribeBtn');
    
    if (liveBtn) liveBtn.classList.toggle('transcriber-option--selected', mode === 'live');
    if (fileBtn) fileBtn.classList.toggle('transcriber-option--selected', mode === 'file');
    
    // Show/hide file upload section
    if (fileUpload) {
      fileUpload.hidden = mode !== 'file';
    }
    
    // Show status and controls
    if (status) status.hidden = false;
    if (controls) controls.hidden = false;
    
    // Update start button text
    const startBtn = this.element.querySelector('#startBtn');
    if (startBtn) {
      startBtn.textContent = mode === 'live' ? 'Iniciar transcripción' : 'Transcribir archivo';
    }
  }


  /**
   * Handle file selection
   * @param {Event} event - Change event
   * @private
   */
  _handleFileSelect(event) {
    const file = event.target.files?.[0];
    const fileNameEl = this.element.querySelector('#selectedFileName');
    
    if (file && fileNameEl) {
      fileNameEl.textContent = file.name;
      this.selectedFile = file;
    }
  }

  /**
   * Handle start button click
   * @private
   */
  async _handleStart() {
    this._hideError();
    
    try {
      if (this.mode === 'live') {
        await this.controller.startLiveTranscription();
      } else if (this.mode === 'file') {
        if (!this.selectedFile) {
          this._showError('Por favor, selecciona un archivo de audio primero.');
          return;
        }
        await this.controller.transcribeFile(this.selectedFile);
      }
    } catch (error) {
      // Error is handled by controller callback
      console.error('Transcription failed:', error);
    }
  }

  /**
   * Handle stop button click
   * @private
   */
  _handleStop() {
    this.controller.stopTranscription();
    this._updateUIForTranscribing(false);
  }

  /**
   * Handle copy button click
   * @private
   */
  async _handleCopy() {
    const success = await this.controller.copyToClipboard();
    if (success) {
      const copyBtn = this.element.querySelector('#copyBtn');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copiado';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      }
    }
  }

  /**
   * Handle download button click
   * @private
   */
  _handleDownload() {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    this.controller.downloadAsText(`transcripcion-${timestamp}`);
  }

  /**
   * Handle clear button click
   * @private
   */
  _handleClear() {
    this.controller.clearTranscript();
    this._updateTranscript('', '');
    this._updateActionButtons(false);
  }

  /**
   * Update the transcript display
   * @param {string} transcript - Final transcript text
   * @param {string} interim - Interim (in-progress) text
   * @private
   */
  _updateTranscript(transcript, interim) {
    const transcriptEl = this.element.querySelector('#transcriptText');
    const interimEl = this.element.querySelector('#interimText');
    
    if (transcriptEl) {
      if (transcript) {
        transcriptEl.innerHTML = `<p>${this._escapeHtml(transcript)}</p>`;
      } else {
        transcriptEl.innerHTML = `<p class="transcriber-result__placeholder">El texto transcrito aparecerá aquí...</p>`;
      }
    }
    
    if (interimEl) {
      interimEl.textContent = interim;
    }
    
    // Update action buttons
    this._updateActionButtons(!!transcript);
  }

  /**
   * Update action buttons enabled state
   * @param {boolean} hasTranscript - Whether there is transcript text
   * @private
   */
  _updateActionButtons(hasTranscript) {
    const copyBtn = this.element.querySelector('#copyBtn');
    const downloadBtn = this.element.querySelector('#downloadBtn');
    const clearBtn = this.element.querySelector('#clearBtn');
    
    if (copyBtn) copyBtn.disabled = !hasTranscript;
    if (downloadBtn) downloadBtn.disabled = !hasTranscript;
    if (clearBtn) clearBtn.disabled = !hasTranscript;
  }

  /**
   * Update UI for transcribing state
   * @param {boolean} isTranscribing - Whether transcription is active
   * @private
   */
  _updateUIForTranscribing(isTranscribing) {
    const startBtn = this.element.querySelector('#startBtn');
    const stopBtn = this.element.querySelector('#stopBtn');
    const indicator = this.element.querySelector('.transcriber-status__indicator');
    const statusText = this.element.querySelector('.transcriber-status__text');
    
    if (startBtn) startBtn.disabled = isTranscribing;
    if (stopBtn) stopBtn.disabled = !isTranscribing;
    
    if (indicator) {
      indicator.setAttribute('data-transcribing', isTranscribing.toString());
    }
    
    if (statusText) {
      statusText.textContent = isTranscribing ? 'Transcribiendo...' : 'Listo';
    }
  }

  /**
   * Show browser compatibility warning
   * @private
   */
  _showBrowserWarning() {
    const warning = this.element.querySelector('.transcriber-warning');
    const options = this.element.querySelector('.transcriber-options');
    
    if (warning) warning.hidden = false;
    if (options) {
      const buttons = options.querySelectorAll('button');
      buttons.forEach(btn => btn.disabled = true);
    }
  }

  /**
   * Show an error message
   * @param {string} message - Error message to display
   * @private
   */
  _showError(message) {
    const errorSection = this.element.querySelector('.transcriber-error');
    const errorMessage = this.element.querySelector('.transcriber-error__message');
    
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
    const errorSection = this.element.querySelector('.transcriber-error');
    if (errorSection) {
      errorSection.hidden = true;
    }
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    
    this.selectedFile = null;
    this.element = null;
  }
}
