/**
 * ImageConverterView.js - Image Converter UI Component
 * 
 * Provides the user interface for converting images between different formats.
 * 
 * Requirements: 5.1, 5.3, 5.4
 */

import { ImageConverterController } from '../controllers/ImageConverterController.js';
import { DownloadService } from '../services/DownloadService.js';

export class ImageConverterView {
  /**
   * @param {import('../router/Router.js').Router} router - Router instance for navigation
   */
  constructor(router) {
    this.router = router;
    
    /** @type {HTMLElement|null} */
    this.element = null;
    
    /** @type {ImageConverterController|null} */
    this.controller = null;
    
    /** @type {DownloadService} */
    this.downloadService = new DownloadService();
    
    /** @type {Object|null} */
    this.imageInfo = null;
    
    /** @type {string} */
    this.selectedFormat = 'png';
    
    /** @type {number} */
    this.jpgQuality = 92;
  }

  /**
   * Render the image converter page HTML
   * @returns {string} HTML string for the image converter page
   */
  render() {
    return `
      <div class="image-converter-page">
        <header class="tool-header">
          <button class="tool-header__back" aria-label="Volver al inicio">
            <span aria-hidden="true">←</span> Volver
          </button>
          <h1 class="tool-header__title">🖼️ Convertir Imágenes</h1>
        </header>

        <main class="tool-content">
          <!-- File Upload Section -->
          <section class="converter-upload" id="uploadSection">
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
                accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg"
                aria-label="Seleccionar imagen">
            </div>
            <p class="converter-upload__formats">
              Formatos soportados: PNG, JPG, WebP, GIF, BMP, SVG
            </p>
          </section>

          <!-- Image Preview Section -->
          <section class="converter-preview" id="previewSection" hidden>
            <h2 class="converter-preview__title">Imagen cargada</h2>
            <div class="converter-preview__container">
              <img class="converter-preview__image" id="previewImage" alt="Vista previa de la imagen">
            </div>
            <div class="converter-preview__info">
              <p class="converter-preview__name" id="imageName"></p>
              <p class="converter-preview__dimensions" id="imageDimensions"></p>
              <p class="converter-preview__size" id="imageSize"></p>
            </div>
          </section>

          <!-- Conversion Options Section -->
          <section class="converter-options" id="optionsSection" hidden>
            <h2 class="converter-options__title">Opciones de conversión</h2>
            
            <div class="converter-options__format">
              <label for="formatSelect" class="converter-options__label">Formato de salida:</label>
              <select id="formatSelect" class="converter-options__select">
                <option value="png">PNG - Sin pérdida, transparencia</option>
                <option value="jpg">JPG - Comprimido, sin transparencia</option>
                <option value="webp">WebP - Moderno, eficiente</option>
                <option value="gif">GIF - Animaciones, 256 colores</option>
              </select>
            </div>

            <div class="converter-options__quality" id="qualitySection" hidden>
              <label for="qualitySlider" class="converter-options__label">
                Calidad: <span id="qualityValue">92</span>%
              </label>
              <input 
                type="range" 
                id="qualitySlider" 
                class="converter-options__slider"
                min="1" 
                max="100" 
                value="92"
                aria-label="Calidad de imagen">
              <div class="converter-options__quality-hints">
                <span>Menor tamaño</span>
                <span>Mayor calidad</span>
              </div>
            </div>

            <div class="converter-options__actions">
              <button class="btn btn--primary" id="convertBtn">
                Convertir imagen
              </button>
              <button class="btn btn--text" id="changeImageBtn">
                Cambiar imagen
              </button>
            </div>
          </section>

          <!-- Result Section -->
          <section class="converter-result" id="resultSection" hidden>
            <h2 class="converter-result__title">¡Conversión completada!</h2>
            <div class="converter-result__comparison">
              <div class="converter-result__original">
                <h3>Original</h3>
                <img class="converter-result__image" id="originalImage" alt="Imagen original">
                <p class="converter-result__info" id="originalInfo"></p>
              </div>
              <div class="converter-result__arrow">→</div>
              <div class="converter-result__converted">
                <h3>Convertida</h3>
                <img class="converter-result__image" id="convertedImage" alt="Imagen convertida">
                <p class="converter-result__info" id="convertedInfo"></p>
              </div>
            </div>
            <div class="converter-result__actions">
              <button class="btn btn--primary" id="downloadBtn">
                Descargar
              </button>
              <button class="btn btn--secondary" id="convertAgainBtn">
                Convertir a otro formato
              </button>
              <button class="btn btn--text" id="newImageBtn">
                Nueva imagen
              </button>
            </div>
          </section>

          <!-- Error Section -->
          <section class="converter-error" id="errorSection" hidden aria-live="assertive">
            <p class="converter-error__message" id="errorMessage"></p>
            <button class="btn btn--secondary" id="retryBtn">
              Intentar de nuevo
            </button>
          </section>

          <!-- Info Section -->
          <section class="recorder-info">
            <h2 class="recorder-info__title">Información</h2>
            <ul class="recorder-info__list">
              <li><strong>PNG:</strong> Sin pérdida de calidad, soporta transparencia</li>
              <li><strong>JPG:</strong> Compresión con pérdida, ideal para fotos</li>
              <li><strong>WebP:</strong> Formato moderno, mejor compresión</li>
              <li><strong>GIF:</strong> Limitado a 256 colores, soporta animaciones</li>
              <li>Todo el procesamiento se realiza en tu navegador</li>
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
    this.controller = new ImageConverterController(this.downloadService);
    
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
    
    this.controller.onConversionComplete = (blob, format) => {
      this._showResult(blob, format);
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
    
    // Format select
    const formatSelect = this.element.querySelector('#formatSelect');
    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => this._handleFormatChange(e));
    }
    
    // Quality slider
    const qualitySlider = this.element.querySelector('#qualitySlider');
    if (qualitySlider) {
      qualitySlider.addEventListener('input', (e) => this._handleQualityChange(e));
    }
    
    // Convert button
    const convertBtn = this.element.querySelector('#convertBtn');
    if (convertBtn) {
      convertBtn.addEventListener('click', () => this._handleConvert());
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
    
    // Convert again button
    const convertAgainBtn = this.element.querySelector('#convertAgainBtn');
    if (convertAgainBtn) {
      convertAgainBtn.addEventListener('click', () => this._handleConvertAgain());
    }
    
    // New image button
    const newImageBtn = this.element.querySelector('#newImageBtn');
    if (newImageBtn) {
      newImageBtn.addEventListener('click', () => this._handleNewImage());
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
   * Handle format selection change
   * @param {Event} e
   * @private
   */
  _handleFormatChange(e) {
    this.selectedFormat = e.target.value;
    
    // Show/hide quality slider for JPG
    const qualitySection = this.element.querySelector('#qualitySection');
    if (qualitySection) {
      qualitySection.hidden = this.selectedFormat !== 'jpg';
    }
  }

  /**
   * Handle quality slider change
   * @param {Event} e
   * @private
   */
  _handleQualityChange(e) {
    this.jpgQuality = parseInt(e.target.value, 10);
    
    const qualityValue = this.element.querySelector('#qualityValue');
    if (qualityValue) {
      qualityValue.textContent = this.jpgQuality;
    }
  }

  /**
   * Handle convert button click
   * @private
   */
  async _handleConvert() {
    this._hideError();
    
    const convertBtn = this.element.querySelector('#convertBtn');
    if (convertBtn) {
      convertBtn.disabled = true;
      convertBtn.textContent = 'Convirtiendo...';
    }
    
    try {
      const quality = this.selectedFormat === 'jpg' ? this.jpgQuality : undefined;
      await this.controller.convertTo(this.selectedFormat, quality);
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      if (convertBtn) {
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convertir imagen';
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
      this.controller.downloadConvertedImage();
    } catch (error) {
      this._showError(error.message);
    }
  }

  /**
   * Handle convert again button click
   * @private
   */
  _handleConvertAgain() {
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
   * Handle retry button click
   * @private
   */
  _handleRetry() {
    this._hideError();
    this._resetUI();
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
    const imageSize = this.element.querySelector('#imageSize');
    
    if (uploadSection) uploadSection.hidden = true;
    if (previewSection) previewSection.hidden = false;
    if (optionsSection) optionsSection.hidden = false;
    
    if (previewImage) previewImage.src = imageInfo.previewUrl;
    if (imageName) imageName.textContent = imageInfo.name;
    if (imageDimensions) imageDimensions.textContent = `${imageInfo.width} × ${imageInfo.height} px`;
    if (imageSize) imageSize.textContent = this._formatFileSize(imageInfo.size);
  }

  /**
   * Show conversion result
   * @param {Blob} blob
   * @param {string} format
   * @private
   */
  _showResult(blob, format) {
    const previewSection = this.element.querySelector('#previewSection');
    const optionsSection = this.element.querySelector('#optionsSection');
    const resultSection = this.element.querySelector('#resultSection');
    
    const originalImage = this.element.querySelector('#originalImage');
    const convertedImage = this.element.querySelector('#convertedImage');
    const originalInfo = this.element.querySelector('#originalInfo');
    const convertedInfo = this.element.querySelector('#convertedInfo');
    
    if (previewSection) previewSection.hidden = true;
    if (optionsSection) optionsSection.hidden = true;
    if (resultSection) resultSection.hidden = false;
    
    // Show original image
    if (originalImage && this.imageInfo) {
      originalImage.src = this.imageInfo.previewUrl;
    }
    if (originalInfo && this.imageInfo) {
      const ext = this.imageInfo.name.split('.').pop()?.toUpperCase() || 'Unknown';
      originalInfo.textContent = `${ext} - ${this._formatFileSize(this.imageInfo.size)}`;
    }
    
    // Show converted image
    if (convertedImage) {
      const url = URL.createObjectURL(blob);
      convertedImage.src = url;
    }
    if (convertedInfo) {
      convertedInfo.textContent = `${format.toUpperCase()} - ${this._formatFileSize(blob.size)}`;
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
    const resultSection = this.element.querySelector('#resultSection');
    const fileInput = this.element.querySelector('#fileInput');
    const formatSelect = this.element.querySelector('#formatSelect');
    const qualitySlider = this.element.querySelector('#qualitySlider');
    const qualitySection = this.element.querySelector('#qualitySection');
    const qualityValue = this.element.querySelector('#qualityValue');
    
    if (uploadSection) uploadSection.hidden = false;
    if (previewSection) previewSection.hidden = true;
    if (optionsSection) optionsSection.hidden = true;
    if (resultSection) resultSection.hidden = true;
    if (fileInput) fileInput.value = '';
    
    // Reset format and quality
    this.selectedFormat = 'png';
    this.jpgQuality = 92;
    
    if (formatSelect) formatSelect.value = 'png';
    if (qualitySlider) qualitySlider.value = '92';
    if (qualitySection) qualitySection.hidden = true;
    if (qualityValue) qualityValue.textContent = '92';
    
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
    
    this.imageInfo = null;
    this.element = null;
  }
}
