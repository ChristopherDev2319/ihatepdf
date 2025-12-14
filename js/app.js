/**
 * app.js - Archivo principal de la aplicación Centro Multimedia
 * 
 * Inicializa todos los componentes MVC, configura event listeners
 * y maneja la navegación entre operaciones usando el router.
 */

// Importar router
import { Router } from './router/Router.js';

// Importar vistas
import { HubPage } from './views/HubPage.js';
import { AudioRecorderView } from './views/AudioRecorderView.js';
import { ScreenRecorderView } from './views/ScreenRecorderView.js';
import { MediaExtractorView } from './views/MediaExtractorView.js';

// Importar modelos
import { PDFOperations } from './models/PDFOperations.js';
import { FileManager } from './models/FileManager.js';

// Importar vista
import { UIManager } from './views/UIManager.js';

// Importar controladores
import { PDFCombineController } from './controllers/PDFCombineController.js';
import { PDFSplitController } from './controllers/PDFSplitController.js';
import { PDFCompressController } from './controllers/PDFCompressController.js';
import { PDFRotateController } from './controllers/PDFRotateController.js';
import { JPGToPDFController } from './controllers/JPGToPDFController.js';
import { PNGToPDFController } from './controllers/PNGToPDFController.js';
import { ImagesToPDFController } from './controllers/ImagesToPDFController.js';
import { PageNumbersController } from './controllers/PageNumbersController.js';
import { WatermarkController } from './controllers/WatermarkController.js';

/**
 * Clase principal de la aplicación
 */
class App {
  constructor() {
    // Inicializar router
    this.router = new Router();
    
    // Inicializar modelos (compartidos entre controladores)
    this.pdfOperations = new PDFOperations();
    this.fileManager = new FileManager();
    this.uiManager = null; // Will be initialized when PDF view is shown
    
    // Controladores se inicializan cuando se muestra la vista PDF
    this.controllers = null;
    
    // Estado de la aplicación
    this.currentOperation = null;
    this.currentController = null;
    
    // Referencias a elementos del DOM (se inicializan según la vista)
    this.operationSelect = null;
    this.fileInput = null;
    this.dropzone = null;
    this.processBtn = null;
    this.fileList = null;
    this.notification = null;
    this.notificationClose = null;
    
    // Controles específicos de operaciones
    this.splitControls = null;
    this.rotateControls = null;
    this.pageNumbersControls = null;
    this.watermarkControls = null;
    this.pageRanges = null;
    this.pageSelection = null;
    this.rotationAngle = null;
    
    // Inicializar la aplicación
    this.init();
  }
  
  /**
   * Inicializa la aplicación configurando el router y las rutas
   */
  init() {
    // Configurar rutas
    this.setupRoutes();
    
    // Inicializar el router con el contenedor
    const routerContainer = document.getElementById('router-container');
    if (routerContainer) {
      this.router.init(routerContainer);
    }
  }
  
  /**
   * Configura las rutas de la aplicación
   */
  setupRoutes() {
    // Ruta principal - Hub
    this.router.register('/', HubPage);
    
    // Ruta PDF - Muestra la interfaz de herramientas PDF existente
    this.router.register('/pdf', () => this.createPDFToolsView());
    
    // Ruta Audio Recorder - Grabador de audio
    this.router.register('/audio-record', AudioRecorderView);
    
    // Ruta Screen Recorder - Grabador de pantalla
    this.router.register('/screen-record', ScreenRecorderView);
    
    // Ruta Media Extractor - Extractor de media
    this.router.register('/media-extract', MediaExtractorView);
    
    // Configurar handler para rutas no encontradas
    this.router.setNotFoundHandler((path, container) => {
      container.innerHTML = `
        <div class="router-error">
          <h2>Página no encontrada</h2>
          <p>La herramienta "${path}" aún no está disponible.</p>
          <a href="#/" class="btn btn--primary">Volver al inicio</a>
        </div>
      `;
    });
  }
  
  /**
   * Crea y retorna la vista de herramientas PDF
   * @returns {Object} Objeto con métodos render y mount
   */
  createPDFToolsView() {
    const self = this;
    return {
      render() {
        // Retornar el HTML de la vista PDF
        return self.getPDFToolsHTML();
      },
      mount(container) {
        // Inicializar la vista PDF después de que se renderice
        self.initPDFToolsView();
      },
      destroy() {
        // Limpiar cuando se navegue fuera
        self.cleanupPDFToolsView();
      }
    };
  }
  
  /**
   * Obtiene el HTML para la vista de herramientas PDF
   * @returns {string} HTML de la vista PDF
   */
  getPDFToolsHTML() {
    return `
      <!-- Header -->
      <header class="header">
        <a href="#/" class="header__back" aria-label="Volver al inicio">← Inicio</a>
        <h1 class="header__title">IHATEPDF</h1>
        <p class="header__subtitle">Herramientas PDF del lado del cliente</p>
      </header>

      <!-- Main Content -->
      <main class="main">
        <!-- Operation Selector -->
        <section class="operation-selector" aria-label="Seleccionar operación">
          <label for="operationSelect" class="operation-selector__label">¿Qué quieres hacer?</label>
          <div class="operation-dropdown">
            <select id="operationSelect" class="operation-select">
              <option value="combine">📄 Combinar PDFs</option>
              <option value="split">✂️ Dividir PDF</option>
              <option value="compress">📦 Comprimir PDF</option>
              <option value="rotate">🔄 Rotar páginas</option>
              <option value="jpg-to-pdf">🖼️ JPG a PDF</option>
              <option value="png-to-pdf">🖼️ PNG a PDF</option>
              <option value="images-to-pdf">🖼️ Imágenes a PDF</option>
              <option value="add-page-numbers">🔢 Numerar páginas</option>
              <option value="add-watermark">💧 Marca de agua</option>
            </select>
            <div class="operation-dropdown__arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </section>

        <!-- File Upload Area -->
        <section class="file-upload" aria-label="Cargar archivos">
          <div 
            class="file-upload__dropzone" 
            id="dropzone"
            role="button"
            tabindex="0"
            aria-label="Arrastra archivos aquí o haz clic para seleccionar">
            <svg class="file-upload__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p class="file-upload__text">
              Arrastra archivos aquí<br>
              <span class="file-upload__text--secondary">o haz clic para seleccionar</span>
            </p>
            <input 
              type="file" 
              id="fileInput" 
              class="file-upload__input" 
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              aria-label="Seleccionar archivos">
          </div>
        </section>

        <!-- Operation-specific Controls -->
        <section class="operation-controls" id="operationControls" aria-label="Controles de operación">
          <!-- Split Controls -->
          <div class="control-group" id="splitControls" hidden>
            <div class="split-info" id="splitInfo">
              <p class="split-info__text">Carga un PDF para ver las opciones de división</p>
            </div>
            
            <div class="split-options" id="splitOptions" hidden>
              <h3 class="split-options__title">¿Cómo quieres dividir el PDF?</h3>
              
              <div class="split-mode">
                <button type="button" class="split-mode__btn" data-mode="pages" id="splitByPages">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <line x1="15" y1="3" x2="15" y2="21"/>
                  </svg>
                  <span>Dividir cada N páginas</span>
                </button>
                
                <button type="button" class="split-mode__btn" data-mode="ranges" id="splitByRanges">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="18" rx="1"/>
                    <rect x="14" y="3" width="7" height="18" rx="1"/>
                  </svg>
                  <span>Seleccionar rangos específicos</span>
                </button>
              </div>
              
              <!-- Dividir cada N páginas -->
              <div class="split-config" id="splitConfigPages" hidden>
                <label for="pagesPerSplit" class="control-group__label">
                  Dividir cada cuántas páginas:
                </label>
                <div class="number-input">
                  <button type="button" class="number-input__btn" id="decreasePages">-</button>
                  <input 
                    type="number" 
                    id="pagesPerSplit" 
                    class="number-input__field"
                    value="1"
                    min="1"
                    max="999">
                  <button type="button" class="number-input__btn" id="increasePages">+</button>
                </div>
                <small class="control-group__help" id="splitPagesPreview">
                  Esto creará X archivos
                </small>
              </div>
              
              <!-- Seleccionar rangos -->
              <div class="split-config" id="splitConfigRanges" hidden>
                <div class="ranges-builder">
                  <div class="ranges-builder__header">
                    <label class="control-group__label">Rangos de páginas:</label>
                    <button type="button" class="btn-add-range" id="addRange">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Agregar rango
                    </button>
                  </div>
                  <div class="ranges-list" id="rangesList">
                    <!-- Ranges will be added here dynamically -->
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rotate Controls -->
          <div class="control-group" id="rotateControls" hidden>
            <label for="pageSelection" class="control-group__label">
              Páginas a rotar (ej: 1, 3, 5-7)
            </label>
            <input 
              type="text" 
              id="pageSelection" 
              class="control-group__input"
              placeholder="1, 3, 5-7"
              aria-describedby="pageSelectionHelp">
            <small id="pageSelectionHelp" class="control-group__help">
              Especifica las páginas separadas por comas
            </small>
            
            <label for="rotationAngle" class="control-group__label">
              Ángulo de rotación
            </label>
            <select id="rotationAngle" class="control-group__select">
              <option value="90">90° (derecha)</option>
              <option value="180">180° (invertir)</option>
              <option value="270">270° (izquierda)</option>
            </select>
          </div>

          <!-- Page Numbers Controls -->
          <div class="control-group" id="pageNumbersControls" hidden>
            <label for="pageNumberPosition" class="control-group__label">
              Posición de los números
            </label>
            <select id="pageNumberPosition" class="control-group__select">
              <option value="bottom-right">Abajo derecha</option>
              <option value="bottom-left">Abajo izquierda</option>
              <option value="bottom-center">Abajo centro</option>
              <option value="top-right">Arriba derecha</option>
              <option value="top-left">Arriba izquierda</option>
              <option value="top-center">Arriba centro</option>
            </select>
            
            <label for="pageNumberFormat" class="control-group__label">
              Formato
            </label>
            <select id="pageNumberFormat" class="control-group__select">
              <option value="number">Solo número (1, 2, 3...)</option>
              <option value="page-of-total">Página de total (1 de 10)</option>
            </select>
            
            <label for="pageNumberFontSize" class="control-group__label">
              Tamaño de fuente
            </label>
            <div class="number-input">
              <button type="button" class="number-input__btn" id="decreaseFontSize">-</button>
              <input 
                type="number" 
                id="pageNumberFontSize" 
                class="number-input__field"
                value="12"
                min="8"
                max="24">
              <button type="button" class="number-input__btn" id="increaseFontSize">+</button>
            </div>
            
            <label for="startPageNumber" class="control-group__label">
              Empezar desde la página
            </label>
            <div class="number-input">
              <button type="button" class="number-input__btn" id="decreaseStartPage">-</button>
              <input 
                type="number" 
                id="startPageNumber" 
                class="number-input__field"
                value="1"
                min="1"
                max="999">
              <button type="button" class="number-input__btn" id="increaseStartPage">+</button>
            </div>
          </div>

          <!-- Watermark Controls -->
          <div class="control-group" id="watermarkControls" hidden>
            <label for="watermarkText" class="control-group__label">
              Texto de la marca de agua
            </label>
            <input 
              type="text" 
              id="watermarkText" 
              class="control-group__input"
              placeholder="CONFIDENCIAL"
              maxlength="50">
            
            <label for="watermarkPosition" class="control-group__label">
              Posición
            </label>
            <select id="watermarkPosition" class="control-group__select">
              <option value="diagonal">Diagonal (45°)</option>
              <option value="center">Centro horizontal</option>
            </select>
            
            <label for="watermarkOpacity" class="control-group__label">
              Opacidad
            </label>
            <div class="range-input">
              <input 
                type="range" 
                id="watermarkOpacity" 
                class="range-input__slider"
                min="0.1"
                max="1"
                step="0.1"
                value="0.3">
              <span class="range-input__value" id="opacityValue">30%</span>
            </div>
            
            <label for="watermarkFontSize" class="control-group__label">
              Tamaño de fuente
            </label>
            <div class="number-input">
              <button type="button" class="number-input__btn" id="decreaseWatermarkSize">-</button>
              <input 
                type="number" 
                id="watermarkFontSize" 
                class="number-input__field"
                value="50"
                min="20"
                max="100">
              <button type="button" class="number-input__btn" id="increaseWatermarkSize">+</button>
            </div>
            
            <label for="watermarkColor" class="control-group__label">
              Color
            </label>
            <div class="color-input">
              <input 
                type="color" 
                id="watermarkColor" 
                class="color-input__picker"
                value="#000000">
              <span class="color-input__label">Negro</span>
            </div>
          </div>
        </section>

        <!-- File Preview List -->
        <section class="file-preview" id="filePreview" aria-label="Archivos cargados">
          <h2 class="file-preview__title">
            Archivos seleccionados
            <span class="file-preview__count" id="fileCount" hidden>0</span>
          </h2>
          <ul class="file-preview__list" id="fileList" role="list">
            <li class="file-preview__empty">Sube archivos para comenzar</li>
          </ul>
        </section>

        <!-- Process Button -->
        <section class="action-section">
          <button 
            type="button" 
            id="processBtn" 
            class="btn btn--primary btn--large"
            disabled
            aria-label="Procesar archivos">
            Procesar
          </button>
        </section>

        <!-- Download Options (will be inserted here by DownloadOptions component) -->
        <section class="download-section" id="downloadSection">
          <!-- DownloadOptions component will be inserted here -->
        </section>

        <!-- Progress Indicator -->
        <div class="progress-indicator" id="progressIndicator" hidden aria-live="polite">
          <div class="progress-indicator__spinner"></div>
          <p class="progress-indicator__message" id="progressMessage">Procesando...</p>
        </div>

        <!-- Notification Banner -->
        <div 
          class="notification" 
          id="notification" 
          role="alert" 
          aria-live="assertive"
          hidden>
          <p class="notification__message" id="notificationMessage"></p>
          <button 
            type="button" 
            class="notification__close" 
            aria-label="Cerrar notificación">
            ×
          </button>
        </div>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <p class="footer__text">
          Todos los archivos se procesan localmente en tu navegador. 
          No se envían datos a ningún servidor.
        </p>
      </footer>
    `;
  }
  
  /**
   * Inicializa la vista de herramientas PDF
   */
  initPDFToolsView() {
    // Inicializar UIManager con FileManager
    this.uiManager = new UIManager(this.fileManager);
    
    // Inicializar controladores
    this.controllers = {
      combine: new PDFCombineController(this.pdfOperations, this.fileManager, this.uiManager),
      split: new PDFSplitController(this.pdfOperations, this.fileManager, this.uiManager),
      compress: new PDFCompressController(this.pdfOperations, this.fileManager, this.uiManager),
      rotate: new PDFRotateController(this.pdfOperations, this.fileManager, this.uiManager),
      'jpg-to-pdf': new JPGToPDFController(this.pdfOperations, this.fileManager, this.uiManager),
      'png-to-pdf': new PNGToPDFController(this.pdfOperations, this.fileManager, this.uiManager),
      'images-to-pdf': new ImagesToPDFController(this.pdfOperations, this.fileManager, this.uiManager),
      'add-page-numbers': new PageNumbersController(this.pdfOperations, this.fileManager, this.uiManager),
      'add-watermark': new WatermarkController(this.pdfOperations, this.fileManager, this.uiManager)
    };
    
    // Obtener referencias a elementos del DOM
    this.operationSelect = document.getElementById('operationSelect');
    this.fileInput = document.getElementById('fileInput');
    this.dropzone = document.getElementById('dropzone');
    this.processBtn = document.getElementById('processBtn');
    this.fileList = document.getElementById('fileList');
    this.notification = document.getElementById('notification');
    this.notificationClose = document.querySelector('.notification__close');
    
    // Controles específicos de operaciones
    this.splitControls = document.getElementById('splitControls');
    this.rotateControls = document.getElementById('rotateControls');
    this.pageNumbersControls = document.getElementById('pageNumbersControls');
    this.watermarkControls = document.getElementById('watermarkControls');
    this.pageRanges = document.getElementById('pageRanges');
    this.pageSelection = document.getElementById('pageSelection');
    this.rotationAngle = document.getElementById('rotationAngle');
    
    // Configurar event listeners
    this.setupOperationButtons();
    this.setupFileUpload();
    this.setupProcessButton();
    this.setupFileList();
    this.setupNotifications();
    
    // Seleccionar operación por defecto (combinar)
    this.selectOperation('combine');
  }
  
  /**
   * Limpia la vista de herramientas PDF
   */
  cleanupPDFToolsView() {
    if (this.uiManager) {
      this.uiManager.destroy();
      this.uiManager = null;
    }
    this.controllers = null;
    this.currentOperation = null;
    this.currentController = null;
  }
  
  /**
   * Configura event listener para el selector de operación
   */
  setupOperationButtons() {
    if (this.operationSelect) {
      this.operationSelect.addEventListener('change', (e) => {
        this.selectOperation(e.target.value);
      });
    }
  }
  
  /**
   * Selecciona una operación y actualiza la UI
   * @param {string} operation - Nombre de la operación
   */
  selectOperation(operation) {
    // Validar que la operación existe
    if (!this.controllers[operation]) {
      console.error(`Operación desconocida: ${operation}`);
      return;
    }
    
    // Actualizar estado
    this.currentOperation = operation;
    this.currentController = this.controllers[operation];
    
    // Actualizar el select si es necesario
    if (this.operationSelect && this.operationSelect.value !== operation) {
      this.operationSelect.value = operation;
    }
    
    // Actualizar controles específicos de operación
    this.updateOperationControls(operation);
    
    // Actualizar accept del input de archivos
    this.updateFileInputAccept(operation);
    
    // Limpiar lista de archivos
    this.uiManager.clearFileList();
    
    // Habilitar botón de procesar si es necesario
    this.processBtn.disabled = false;
  }
  
  /**
   * Actualiza los controles específicos de cada operación
   * @param {string} operation - Nombre de la operación
   */
  updateOperationControls(operation) {
    // Ocultar todos los controles específicos
    if (this.splitControls) this.splitControls.hidden = true;
    if (this.rotateControls) this.rotateControls.hidden = true;
    if (this.pageNumbersControls) this.pageNumbersControls.hidden = true;
    if (this.watermarkControls) this.watermarkControls.hidden = true;
    
    // Mostrar controles específicos según la operación
    switch (operation) {
      case 'split':
        if (this.splitControls) this.splitControls.hidden = false;
        break;
      case 'rotate':
        if (this.rotateControls) this.rotateControls.hidden = false;
        break;
      case 'add-page-numbers':
        if (this.pageNumbersControls) this.pageNumbersControls.hidden = false;
        // Inicializar controles de números de página
        if (this.controllers['add-page-numbers']) {
          this.controllers['add-page-numbers'].initializeControls();
        }
        break;
      case 'add-watermark':
        if (this.watermarkControls) this.watermarkControls.hidden = false;
        // Inicializar controles de marca de agua
        if (this.controllers['add-watermark']) {
          this.controllers['add-watermark'].initializeControls();
        }
        break;
    }
  }
  
  /**
   * Actualiza el atributo accept del input de archivos
   * @param {string} operation - Nombre de la operación
   */
  updateFileInputAccept(operation) {
    if (!this.fileInput) return;
    
    // Configurar accept según la operación
    switch (operation) {
      case 'jpg-to-pdf':
        this.fileInput.setAttribute('accept', '.jpg,.jpeg,image/jpeg');
        this.fileInput.setAttribute('multiple', '');
        break;
      case 'png-to-pdf':
        this.fileInput.setAttribute('accept', '.png,image/png');
        this.fileInput.setAttribute('multiple', '');
        break;
      case 'images-to-pdf':
        this.fileInput.setAttribute('accept', '.jpg,.jpeg,.png,image/jpeg,image/png');
        this.fileInput.setAttribute('multiple', '');
        break;
      case 'combine':
        this.fileInput.setAttribute('accept', '.pdf,application/pdf');
        this.fileInput.setAttribute('multiple', '');
        break;
      case 'add-page-numbers':
      case 'add-watermark':
        this.fileInput.setAttribute('accept', '.pdf,application/pdf');
        this.fileInput.setAttribute('multiple', '');
        break;
      default:
        // Para split, compress, rotate: un solo PDF
        this.fileInput.setAttribute('accept', '.pdf,application/pdf');
        this.fileInput.removeAttribute('multiple');
        break;
    }
  }
  
  /**
   * Configura event listeners para carga de archivos
   */
  setupFileUpload() {
    // Click en dropzone abre el selector de archivos
    if (this.dropzone) {
      this.dropzone.addEventListener('click', () => {
        this.fileInput?.click();
      });
      
      // Drag & drop
      this.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzone.classList.add('file-upload__dropzone--dragover');
      });
      
      this.dropzone.addEventListener('dragleave', () => {
        this.dropzone.classList.remove('file-upload__dropzone--dragover');
      });
      
      this.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzone.classList.remove('file-upload__dropzone--dragover');
        
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.handleFileSelection(files);
        }
      });
    }
    
    // Cambio en el input de archivos
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          this.handleFileSelection(files);
        }
      });
    }
  }
  
  /**
   * Maneja la selección de archivos
   * @param {FileList} files - Archivos seleccionados
   */
  async handleFileSelection(files) {
    if (!this.currentController) {
      this.uiManager.showError('Por favor selecciona una operación primero');
      return;
    }
    
    // Delegar al controlador actual
    await this.currentController.handleFileSelection(files);
    
    // Resetear el input para permitir seleccionar el mismo archivo nuevamente
    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }
  
  /**
   * Configura event listener para botón de procesar
   */
  setupProcessButton() {
    if (!this.processBtn) return;
    
    this.processBtn.addEventListener('click', async () => {
      await this.handleProcess();
    });
  }
  
  /**
   * Maneja el procesamiento según la operación actual
   */
  async handleProcess() {
    if (!this.currentController || !this.currentOperation) {
      this.uiManager.showError('Por favor selecciona una operación primero');
      return;
    }
    
    // Manejar operaciones específicas que requieren validación adicional
    switch (this.currentOperation) {
      case 'split':
        await this.handleSplitProcess();
        break;
      case 'rotate':
        await this.handleRotateProcess();
        break;
      case 'combine':
        await this.currentController.handleCombine();
        break;
      case 'compress':
        await this.currentController.handleCompress();
        break;
      case 'jpg-to-pdf':
        await this.currentController.handleConvert();
        break;
      case 'png-to-pdf':
        await this.currentController.handleConvert();
        break;
      case 'images-to-pdf':
        await this.currentController.handleConvert();
        break;
      case 'add-page-numbers':
        await this.handlePageNumbersProcess();
        break;
      case 'add-watermark':
        await this.handleWatermarkProcess();
        break;
      default:
        this.uiManager.showError('Operación no implementada');
    }
  }
  
  /**
   * Maneja el procesamiento de división
   */
  async handleSplitProcess() {
    // Procesar división directamente
    // El controlador maneja la validación internamente
    await this.currentController.handleSplit();
  }
  
  /**
   * Maneja el procesamiento de rotación
   */
  async handleRotateProcess() {
    // Obtener selección de páginas
    const pagesInput = this.pageSelection?.value || '';
    
    // Obtener ángulo de rotación
    const angle = parseInt(this.rotationAngle?.value || '90', 10);
    
    // Validar selección de páginas
    const isPagesValid = this.currentController.handlePageSelection(pagesInput);
    
    if (!isPagesValid) {
      return;
    }
    
    // Validar ángulo
    const isAngleValid = this.currentController.handleRotationAngle(angle);
    
    if (!isAngleValid) {
      return;
    }
    
    // Procesar rotación
    await this.currentController.handleRotate();
  }
  
  /**
   * Configura event listeners para lista de archivos
   */
  setupFileList() {
    if (!this.fileList) return;
    
    // Delegación de eventos para botones de eliminar
    this.fileList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.file-preview__remove');
      if (removeBtn) {
        const index = parseInt(removeBtn.getAttribute('data-index'), 10);
        this.handleRemoveFile(index);
      }
    });
  }
  
  /**
   * Maneja el procesamiento de números de página
   */
  async handlePageNumbersProcess() {
    if (this.currentController.selectedFiles.length === 0) {
      this.uiManager.showError('Debes seleccionar al menos 1 archivo PDF');
      return;
    }
    
    const options = this.currentController.getOptionsFromUI();
    await this.currentController.process(this.currentController.selectedFiles, options);
  }
  
  /**
   * Maneja el procesamiento de marca de agua
   */
  async handleWatermarkProcess() {
    if (this.currentController.selectedFiles.length === 0) {
      this.uiManager.showError('Debes seleccionar al menos 1 archivo PDF');
      return;
    }
    
    const watermarkText = this.currentController.getWatermarkTextFromUI();
    if (!this.currentController.validateWatermarkText(watermarkText)) return;
    
    const options = this.currentController.getOptionsFromUI();
    await this.currentController.process(this.currentController.selectedFiles, watermarkText, options);
  }

  /**
   * Maneja la eliminación de un archivo
   * @param {number} index - Índice del archivo a eliminar
   */
  handleRemoveFile(index) {
    if (!this.currentController) return;
    
    // Verificar si el controlador tiene método handleRemoveFile
    if (typeof this.currentController.handleRemoveFile === 'function') {
      this.currentController.handleRemoveFile(index);
    }
  }
  
  /**
   * Configura event listeners para notificaciones
   */
  setupNotifications() {
    if (!this.notificationClose) return;
    
    this.notificationClose.addEventListener('click', () => {
      this.uiManager.hideNotification();
    });
  }
  
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });
} else {
  // DOM ya está listo
  new App();
}
