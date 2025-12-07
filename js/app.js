/**
 * app.js - Archivo principal de la aplicación IHATEPDF
 * 
 * Inicializa todos los componentes MVC, configura event listeners
 * y maneja la navegación entre operaciones.
 */

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

/**
 * Clase principal de la aplicación
 */
class App {
  constructor() {
    // Inicializar modelos (compartidos entre controladores)
    this.pdfOperations = new PDFOperations();
    this.fileManager = new FileManager();
    this.uiManager = new UIManager();
    
    // Inicializar controladores
    this.controllers = {
      combine: new PDFCombineController(this.pdfOperations, this.fileManager, this.uiManager),
      split: new PDFSplitController(this.pdfOperations, this.fileManager, this.uiManager),
      compress: new PDFCompressController(this.pdfOperations, this.fileManager, this.uiManager),
      rotate: new PDFRotateController(this.pdfOperations, this.fileManager, this.uiManager),
      'jpg-to-pdf': new JPGToPDFController(this.pdfOperations, this.fileManager, this.uiManager)
    };
    
    // Estado de la aplicación
    this.currentOperation = null;
    this.currentController = null;
    
    // Elementos del DOM
    this.operationButtons = document.querySelectorAll('.operation-btn');
    this.fileInput = document.getElementById('fileInput');
    this.dropzone = document.getElementById('dropzone');
    this.processBtn = document.getElementById('processBtn');
    this.fileList = document.getElementById('fileList');
    this.notification = document.getElementById('notification');
    this.notificationClose = document.querySelector('.notification__close');
    
    // Controles específicos de operaciones
    this.splitControls = document.getElementById('splitControls');
    this.rotateControls = document.getElementById('rotateControls');
    this.pageRanges = document.getElementById('pageRanges');
    this.pageSelection = document.getElementById('pageSelection');
    this.rotationAngle = document.getElementById('rotationAngle');
    
    // Inicializar la aplicación
    this.init();
  }
  
  /**
   * Inicializa la aplicación configurando event listeners
   */
  init() {
    // Configurar event listeners para botones de operación
    this.setupOperationButtons();
    
    // Configurar event listeners para carga de archivos
    this.setupFileUpload();
    
    // Configurar event listener para botón de procesar
    this.setupProcessButton();
    
    // Configurar event listeners para lista de archivos
    this.setupFileList();
    
    // Configurar event listeners para notificaciones
    this.setupNotifications();
    
    // Configurar event listeners para controles específicos
    this.setupOperationControls();
    
    // Seleccionar operación por defecto (combinar)
    this.selectOperation('combine');
  }
  
  /**
   * Configura event listeners para botones de operación
   */
  setupOperationButtons() {
    this.operationButtons.forEach(button => {
      button.addEventListener('click', () => {
        const operation = button.getAttribute('data-operation');
        this.selectOperation(operation);
      });
      
    });
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
    
    // Actualizar botones de operación (aria-pressed)
    this.operationButtons.forEach(button => {
      const btnOperation = button.getAttribute('data-operation');
      const isSelected = btnOperation === operation;
      button.setAttribute('aria-pressed', isSelected.toString());
      button.classList.toggle('operation-btn--active', isSelected);
    });
    
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
    
    // Mostrar controles específicos según la operación
    switch (operation) {
      case 'split':
        if (this.splitControls) this.splitControls.hidden = false;
        break;
      case 'rotate':
        if (this.rotateControls) this.rotateControls.hidden = false;
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
    if (operation === 'jpg-to-pdf') {
      this.fileInput.setAttribute('accept', '.jpg,.jpeg,image/jpeg');
      this.fileInput.setAttribute('multiple', '');
    } else if (operation === 'combine') {
      this.fileInput.setAttribute('accept', '.pdf,application/pdf');
      this.fileInput.setAttribute('multiple', '');
    } else {
      // Para split, compress, rotate: un solo PDF
      this.fileInput.setAttribute('accept', '.pdf,application/pdf');
      this.fileInput.removeAttribute('multiple');
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
