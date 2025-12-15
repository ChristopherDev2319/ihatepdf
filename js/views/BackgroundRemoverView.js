/**
 * BackgroundRemoverView.js - Background Remover UI Component
 * 
 * Provides the user interface for removing backgrounds from images.
 * 
 * Requirements: 6.1, 6.3, 6.5, 6.6
 */

import { BackgroundRemoverController } from '../controllers/BackgroundRemoverController.js';
import { DownloadService } from '../services/DownloadService.js';

export class BackgroundRemoverView {
  /**
   * @param {import('../router/Router.js').Router} router - Router instance for navigation
   */
  constructor(router) {
    this.router = router;
    
    /** @type {HTMLElement|null} */
    this.element = null;
    
    /** @type {BackgroundRemoverController|null} */
    this.controller = null;
    
    /** @type {DownloadService} */
    this.downloadService = new DownloadService();
    
    /** @type {Object|null} */
    this.imageInfo = null;
    
    /** @type {number} */
    this.tolerance = 30;
  }

  /**
   * Render the background remover page HTML
   * @returns {string} HTML string for the background remover page
   */
  render() {
    return `
      <div class="bg-remover-page">
        <header class="tool-header">
          <button class="tool-header__back" aria-label="Volver al inicio">
            <span aria-hidden="true">←</span> Volver
          </button>
          <h1 class="tool-header__title">✂️ Quitar Fondo</h1>
        </header>

        <main class="tool-content">
          <!-- File Upload Section -->
          <section class="bg-remover-upload" id="uploadSection">
            <div 
              class="file-upload__dropzone" 
              id="dropzone"
              role="button"
              tabindex="0"
              aria-label="Arrastra una imagen aquí o haz clic para seleccionar">
              <svg class="file-upload__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p class="file-upload__text">
                Arrastra una imagen aquí<br>
                <span class="file-upload__text--secondary">o haz clic para seleccionar</span>
              </p>
              <input 
                type="file" 
                id="fileInput" 
                class="file-upload__input" 
                accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp"
                aria-label="Seleccionar imagen">
            </div>
            <p class="bg-remover-upload__formats">
              Formatos soportados: PNG, JPG, WebP, GIF, BMP
            </p>
          </section>

          <!-- Image Preview Section -->
          <section class="bg-remover-preview" id="previewSection" hidden>
            <h2 class="bg-remover-preview__title">Imagen cargada</h2>
            <div class="bg-remover-preview__container">
              <img class="bg-remover-preview__image" id="previewImage" alt="Vista previa de la imagen">
            </div>
            <div class="bg-remover-preview__info">
              <p class="bg-remover-preview__name" id="imageName"></p>
              <p class="bg-remover-preview__dimensions" id="imageDimensions"></p>
            </div>
          </section>

          <!-- Processing Options Section -->
          <section class="bg-remover-options" id="optionsSection" hidden>
            <h2 class="bg-remover-options__title">Opciones de procesamiento</h2>
            
            <div class="bg-remover-options__tolerance">
              <label for="toleranceSlider" class="bg-remover-options__label">
                Tolerancia de color: <span id="toleranceValue">30</span>
              </label>
              <p class="bg-remover-options__description">
                Controla qué tan similares deben ser los colores al fondo para ser eliminados. 
                Un valor bajo elimina solo colores muy parecidos al fondo. 
                Un valor alto elimina más colores (útil para fondos con variaciones).
              </p>
              <input 
                type="range" 
                id="toleranceSlider" 
                class="bg-remover-options__slider"
                min="5" 
                max="100" 
                value="30"
                aria-label="Tolerancia de color">
              <div class="bg-remover-options__tolerance-hints">
                <span>🎯 Preciso (solo fondo exacto)</span>
                <span>🔥 Agresivo (más colores)</span>
              </div>
            </div>

            <div class="bg-remover-options__actions">
              <button class="btn btn--primary" id="processBtn">
                Quitar fondo
              </button>
              <button class="btn btn--text" id="changeImageBtn">
                Cambiar imagen
              </button>
            </div>
          </section>

          <!-- Progress Section -->
          <section class="bg-remover-progress" id="progressSection" hidden aria-live="polite">
            <div class="bg-remover-progress__container">
              <div class="bg-remover-progress__spinner"></div>
              <p class="bg-remover-progress__text">Procesando imagen...</p>
              <div class="bg-remover-progress__bar">
                <div class="bg-remover-progress__fill" id="progressFill" style="width: 0%"></div>
              </div>
              <p class="bg-remover-progress__percent" id="progressPercent">0%</p>
            </div>
          </section>

          <!-- Result Section -->
          <section class="bg-remover-result" id="resultSection" hidden>
            <h2 class="bg-remover-result__title">¡Fondo eliminado!</h2>
            <div class="bg-remover-result__comparison">
              <div class="bg-remover-result__original">
                <h3>Original</h3>
                <div class="bg-remover-result__image-container">
                  <img class="bg-remover-result__image" id="originalImage" alt="Imagen original">
                </div>
              </div>
              <div class="bg-remover-result__arrow">→</div>
              <div class="bg-remover-result__processed">
                <h3>Sin fondo</h3>
                <div class="bg-remover-result__image-container bg-remover-result__image-container--transparent">
                  <img class="bg-remover-result__image" id="processedImage" alt="Imagen sin fondo">
                </div>
              </div>
            </div>
            <div class="bg-remover-result__actions">
              <button class="btn btn--primary" id="downloadBtn">
                Descargar PNG
              </button>
              <button class="btn btn--secondary" id="retryBtn">
                Ajustar tolerancia
              </button>
              <button class="btn btn--text" id="newImageBtn">
                Nueva imagen
              </button>
            </div>
          </section>

          <!-- Error Section -->
          <section class="bg-remover-error" id="errorSection" hidden aria-live="assertive">
            <p class="bg-remover-error__message" id="errorMessage"></p>
            <button class="btn btn--secondary" id="errorRetryBtn">
              Intentar de nuevo
            </button>
          </section>

          <!-- Info Section -->
          <section class="recorder-info">
            <h2 class="recorder-info__title">¿Cómo funciona?</h2>
            <ul class="recorder-info__list">
              <li><strong>1. Sube tu imagen:</strong> Arrastra o selecciona una imagen con fondo sólido</li>
              <li><strong>2. Ajusta la tolerancia:</strong> Mueve el slider para controlar cuánto fondo se elimina</li>
              <li><strong>3. Procesa:</strong> Haz clic en "Quitar fondo" y espera unos segundos</li>
              <li><strong>4. Descarga:</strong> Obtén tu imagen PNG con fondo transparente</li>
            </ul>
            <p class="recorder-info__tip">
              💡 <strong>Tip:</strong> Funciona mejor con fondos de color sólido (blanco, verde, azul). 
              Si el resultado no es perfecto, ajusta la tolerancia y vuelve a intentar.
            </p>
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
    this.controller = new BackgroundRemoverController(this.downloadService);
    
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
    this.controller.onImageLoaded = (imageInfo) => {
      this.imageInfo = imageInfo;
      this._showPreview(imageInfo);
    };
    
    this.controller.onProcessingComplete = (blob) => {
      this._showResult(blob);
    };
    
    this.controller.onProgressUpdate = (progress) => {
      this._updateProgress(progress);
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
    
    // File input and dropzone
    const fileInput = this.element.querySelector('#fileInput');
    const dropzone = this.element.querySelector('#dropzone');
    
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this._handleFileSelect(e));
    }
    
    if (dropzone) {
      dropzone.addEventListener('click', () => fileInput?.click());
      dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput?.click();
        }
      });
      dropzone.addEventListener('dragover', (e) => this._handleDragOver(e));
      dropzone.addEventListener('dragleave', (e) => this._handleDragLeave(e));
      dropzone.addEventListener('drop', (e) => this._handleDrop(e));
    }
    
    // Tolerance slider
    const toleranceSlider = this.element.querySelector('#toleranceSlider');
    if (toleranceSlider) {
      toleranceSlider.addEventListener('input', (e) => this._handleToleranceChange(e));
    }
    
    // Process button
    const processBtn = this.element.querySelector('#processBtn');
    if (processBtn) {
      processBtn.addEventListener('click', () => this._handleProcess());
    }
    
    // Change image button
    const changeImageBtn = this.element.querySelector('#changeImageBtn');
    if (changeImageBtn) {
      changeImageBtn.addEventListener('click', () => this._handleChangeImage());
    }
    
    // Download button
    const downloadBtn = this.element.querySelector('#downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this._handleDownload());
    }
    
    // Retry button (adjust tolerance)
    const retryBtn = this.element.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this._handleRetry());
    }
    
    // New image button
    const newImageBtn = this.element.querySelector('#newImageBtn');
    if (newImageBtn) {
      newImageBtn.addEventListener('click', () => this._handleNewImage());
    }
    
    // Error retry button
    const errorRetryBtn = this.element.querySelector('#errorRetryBtn');
    if (errorRetryBtn) {
      errorRetryBtn.addEventListener('click', () => this._handleErrorRetry());
    }
  }

  /**
   * Handle back button click
   * @private
   */
  _handleBack() {
    this.router.navigate('/');
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
      await this.controller.loadImage(file);
    } catch (error) {
      console.error('Image loading failed:', error);
    }
  }

  /**
   * Handle tolerance slider change
   * @param {Event} e
   * @private
   */
  _handleToleranceChange(e) {
    this.tolerance = parseInt(e.target.value, 10);
    
    const toleranceValue = this.element.querySelector('#toleranceValue');
    if (toleranceValue) {
      toleranceValue.textContent = this.tolerance;
    }
  }

  /**
   * Handle process button click
   * @private
   */
  async _handleProcess() {
    this._hideError();
    this._showProgress();
    
    const processBtn = this.element.querySelector('#processBtn');
    if (processBtn) {
      processBtn.disabled = true;
    }
    
    try {
      await this.controller.removeBackground({ tolerance: this.tolerance });
    } catch (error) {
      console.error('Background removal failed:', error);
      this._hideProgress();
    } finally {
      if (processBtn) {
        processBtn.disabled = false;
      }
    }
  }

  /**
   * Handle change image button click
   * @private
   */
  _handleChangeImage() {
    this.controller.reset();
    this._resetUI();
  }

  /**
   * Handle download button click
   * @private
   */
  _handleDownload() {
    try {
      this.controller.downloadResult();
    } catch (error) {
      this._showError(error.message);
    }
  }

  /**
   * Handle retry button click (adjust tolerance)
   * @private
   */
  _handleRetry() {
    const resultSection = this.element.querySelector('#resultSection');
    const previewSection = this.element.querySelector('#previewSection');
    const optionsSection = this.element.querySelector('#optionsSection');
    
    if (resultSection) resultSection.hidden = true;
    if (previewSection) previewSection.hidden = false;
    if (optionsSection) optionsSection.hidden = false;
  }

  /**
   * Handle new image button click
   * @private
   */
  _handleNewImage() {
    this.controller.reset();
    this.imageInfo = null;
    this._resetUI();
  }

  /**
   * Handle error retry button click
   * @private
   */
  _handleErrorRetry() {
    this._hideError();
    
    if (this.imageInfo) {
      // Show options to try again
      const previewSection = this.element.querySelector('#previewSection');
      const optionsSection = this.element.querySelector('#optionsSection');
      if (previewSection) previewSection.hidden = false;
      if (optionsSection) optionsSection.hidden = false;
    } else {
      this._resetUI();
    }
  }


  /**
   * Show image preview
   * @param {Object} imageInfo
   * @private
   */
  _showPreview(imageInfo) {
    const uploadSection = this.element.querySelector('#uploadSection');
    const previewSection = this.element.querySelector('#previewSection');
    const optionsSection = this.element.querySelector('#optionsSection');
    
    const previewImage = this.element.querySelector('#previewImage');
    const imageName = this.element.querySelector('#imageName');
    const imageDimensions = this.element.querySelector('#imageDimensions');
    
    if (uploadSection) uploadSection.hidden = true;
    if (previewSection) previewSection.hidden = false;
    if (optionsSection) optionsSection.hidden = false;
    
    if (previewImage) previewImage.src = imageInfo.previewUrl;
    if (imageName) imageName.textContent = imageInfo.name;
    if (imageDimensions) imageDimensions.textContent = `${imageInfo.width} × ${imageInfo.height} px`;
  }

  /**
   * Show progress indicator
   * @private
   */
  _showProgress() {
    const previewSection = this.element.querySelector('#previewSection');
    const optionsSection = this.element.querySelector('#optionsSection');
    const progressSection = this.element.querySelector('#progressSection');
    
    if (previewSection) previewSection.hidden = true;
    if (optionsSection) optionsSection.hidden = true;
    if (progressSection) progressSection.hidden = false;
    
    this._updateProgress(0);
  }

  /**
   * Hide progress indicator
   * @private
   */
  _hideProgress() {
    const progressSection = this.element.querySelector('#progressSection');
    if (progressSection) progressSection.hidden = true;
  }

  /**
   * Update progress display
   * @param {number} progress - Progress percentage (0-100)
   * @private
   */
  _updateProgress(progress) {
    const progressFill = this.element.querySelector('#progressFill');
    const progressPercent = this.element.querySelector('#progressPercent');
    
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    if (progressPercent) {
      progressPercent.textContent = `${progress}%`;
    }
  }

  /**
   * Show processing result
   * @param {Blob} blob
   * @private
   */
  _showResult(blob) {
    this._hideProgress();
    
    const resultSection = this.element.querySelector('#resultSection');
    const originalImage = this.element.querySelector('#originalImage');
    const processedImage = this.element.querySelector('#processedImage');
    
    if (resultSection) resultSection.hidden = false;
    
    // Show original image
    if (originalImage && this.imageInfo) {
      originalImage.src = this.imageInfo.previewUrl;
    }
    
    // Show processed image
    if (processedImage) {
      const url = URL.createObjectURL(blob);
      processedImage.src = url;
    }
  }

  /**
   * Show error message
   * @param {string} message
   * @private
   */
  _showError(message) {
    this._hideProgress();
    
    const errorSection = this.element.querySelector('#errorSection');
    const errorMessage = this.element.querySelector('#errorMessage');
    
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
    const previewSection = this.element.querySelector('#previewSection');
    const optionsSection = this.element.querySelector('#optionsSection');
    const progressSection = this.element.querySelector('#progressSection');
    const resultSection = this.element.querySelector('#resultSection');
    const fileInput = this.element.querySelector('#fileInput');
    const toleranceSlider = this.element.querySelector('#toleranceSlider');
    const toleranceValue = this.element.querySelector('#toleranceValue');
    
    if (uploadSection) uploadSection.hidden = false;
    if (previewSection) previewSection.hidden = true;
    if (optionsSection) optionsSection.hidden = true;
    if (progressSection) progressSection.hidden = true;
    if (resultSection) resultSection.hidden = true;
    if (fileInput) fileInput.value = '';
    
    // Reset tolerance
    this.tolerance = 30;
    if (toleranceSlider) toleranceSlider.value = '30';
    if (toleranceValue) toleranceValue.textContent = '30';
    
    this._hideError();
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
    
    this.imageInfo = null;
    this.element = null;
  }
}
