import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * PageNumbersController - Controlador para agregar números de página a PDFs
 */
export class PageNumbersController {
  /**
   * @param {PDFOperations} pdfOperations - Instancia de PDFOperations
   * @param {FileManager} fileManager - Instancia de FileManager
   * @param {UIManager} uiManager - Instancia de UIManager
   */
  constructor(pdfOperations, fileManager, uiManager) {
    this.pdfOperations = pdfOperations || new PDFOperations();
    this.fileManager = fileManager || new FileManager();
    this.uiManager = uiManager || new UIManager();
    this.errorHandler = new ErrorHandler();
    
    // Estado interno
    this.selectedFiles = [];
  }

  /**
   * Maneja la selección de archivos por parte del usuario
   * @param {FileList} files - Lista de archivos seleccionados
   */
  async handleFileSelection(files) {
    try {
      // Cargar archivos usando FileManager
      const loadedFiles = await this.fileManager.loadFiles(files);
      
      // Validar que todos los archivos sean PDFs
      const validFiles = [];
      const invalidFiles = [];
      
      for (const file of loadedFiles) {
        if (this.fileManager.validatePDFFile(file)) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      }
      
      // Si hay archivos inválidos, mostrar error
      if (invalidFiles.length > 0) {
        this.uiManager.showError(
          `Los siguientes archivos no son PDFs válidos: ${invalidFiles.join(', ')}`
        );
      }
      
      // Agregar archivos válidos a la selección
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
      
      // Actualizar la vista con la lista de archivos
      this._updateFileListView();
      
    } catch (error) {
      this.uiManager.showError(`Error al cargar archivos: ${error.message}`);
    }
  }

  /**
   * Maneja la eliminación de un archivo de la lista
   * @param {number} index - Índice del archivo a eliminar
   */
  handleRemoveFile(index) {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
      this._updateFileListView();
    }
  }

  /**
   * Procesa la adición de números de página
   * @param {File[]} pdfFiles - Array de archivos PDF
   * @param {Object} options - Opciones de numeración
   * @returns {Promise<void>}
   */
  async process(pdfFiles, options = {}) {
    // Validar que haya al menos 1 archivo
    if (!pdfFiles || pdfFiles.length === 0) {
      this.uiManager.showError('Debes seleccionar al menos 1 archivo PDF');
      return;
    }

    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Agregando números de página...');

      const processedFiles = [];

      // Procesar cada archivo PDF
      for (const pdfFile of pdfFiles) {
        const pdfData = await this.pdfOperations.addPageNumbers(pdfFile, options);
        
        // Generar nombre del archivo
        const originalName = pdfFile.name.replace(/\.[^/.]+$/, '');
        const fileName = `${originalName}_numerado.pdf`;

        processedFiles.push({
          data: pdfData,
          name: fileName
        });
      }

      // Descargar archivos
      for (const file of processedFiles) {
        const blob = new Blob([file.data], { type: 'application/pdf' });
        this.fileManager.downloadFile(blob, file.name);
        // Pequeña pausa entre descargas
        if (processedFiles.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Mostrar éxito
      this.uiManager.hideProgress();
      this.uiManager.showSuccess(`Números de página agregados a ${processedFiles.length} archivo(s)`);

      // Limpiar selección
      this.selectedFiles = [];
      this._updateFileListView();

    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al agregar números de página: ${error.message}`);
    } finally {
      // Habilitar controles nuevamente
      this.uiManager.enableControls();
    }
  }

  /**
   * Obtiene las opciones de numeración desde la UI
   * @returns {Object} - Opciones de numeración
   */
  getOptionsFromUI() {
    const position = document.getElementById('pageNumberPosition')?.value || 'bottom-right';
    const format = document.getElementById('pageNumberFormat')?.value || 'number';
    const fontSize = parseInt(document.getElementById('pageNumberFontSize')?.value) || 12;
    const startPage = parseInt(document.getElementById('startPageNumber')?.value) || 1;

    return {
      position,
      format,
      fontSize,
      startPage
    };
  }

  /**
   * Valida los archivos PDF antes del procesamiento
   * @param {File[]} files - Archivos a validar
   * @returns {boolean} - True si todos los archivos son válidos
   */
  validateFiles(files) {
    if (!files || files.length === 0) {
      this.uiManager.showNotification('Selecciona al menos un archivo PDF', 'error');
      return false;
    }

    const maxFileSize = 100 * 1024 * 1024; // 100MB por archivo
    const invalidFiles = [];

    for (const file of files) {
      // Validar tipo de archivo
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        invalidFiles.push(`${file.name} (no es PDF)`);
        continue;
      }

      // Validar tamaño
      if (file.size > maxFileSize) {
        invalidFiles.push(`${file.name} (muy grande: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      }
    }

    if (invalidFiles.length > 0) {
      this.uiManager.showNotification(
        `Archivos inválidos: ${invalidFiles.join(', ')}`, 
        'error'
      );
      return false;
    }

    return true;
  }

  /**
   * Inicializa los event listeners para los controles de números de página
   */
  initializeControls() {
    // Controles de tamaño de fuente
    const decreaseFontSize = document.getElementById('decreaseFontSize');
    const increaseFontSize = document.getElementById('increaseFontSize');
    const fontSizeInput = document.getElementById('pageNumberFontSize');

    decreaseFontSize?.addEventListener('click', () => {
      const currentValue = parseInt(fontSizeInput.value);
      if (currentValue > 8) {
        fontSizeInput.value = currentValue - 1;
      }
    });

    increaseFontSize?.addEventListener('click', () => {
      const currentValue = parseInt(fontSizeInput.value);
      if (currentValue < 24) {
        fontSizeInput.value = currentValue + 1;
      }
    });

    // Controles de página de inicio
    const decreaseStartPage = document.getElementById('decreaseStartPage');
    const increaseStartPage = document.getElementById('increaseStartPage');
    const startPageInput = document.getElementById('startPageNumber');

    decreaseStartPage?.addEventListener('click', () => {
      const currentValue = parseInt(startPageInput.value);
      if (currentValue > 1) {
        startPageInput.value = currentValue - 1;
      }
    });

    increaseStartPage?.addEventListener('click', () => {
      const currentValue = parseInt(startPageInput.value);
      if (currentValue < 999) {
        startPageInput.value = currentValue + 1;
      }
    });
  }

  /**
   * Actualiza la vista con la lista actual de archivos
   * @private
   */
  _updateFileListView() {
    const fileInfoList = this.selectedFiles.map(file => ({
      file: file,
      name: file.name,
      size: file.size
    }));
    
    this.uiManager.updateFileList(fileInfoList);
  }
}