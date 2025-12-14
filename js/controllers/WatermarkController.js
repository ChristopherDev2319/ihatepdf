import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * WatermarkController - Controlador para agregar marcas de agua a PDFs
 */
export class WatermarkController {
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
   * Procesa la adición de marca de agua
   * @param {File[]} pdfFiles - Array de archivos PDF
   * @param {string} watermarkText - Texto de la marca de agua
   * @param {Object} options - Opciones de la marca de agua
   * @returns {Promise<void>}
   */
  async process(pdfFiles, watermarkText, options = {}) {
    // Validar que haya al menos 1 archivo
    if (!pdfFiles || pdfFiles.length === 0) {
      this.uiManager.showError('Debes seleccionar al menos 1 archivo PDF');
      return;
    }

    if (!watermarkText || watermarkText.trim() === '') {
      this.uiManager.showError('Ingresa el texto para la marca de agua');
      return;
    }

    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Agregando marca de agua...');

      const processedFiles = [];

      // Procesar cada archivo PDF
      for (const pdfFile of pdfFiles) {
        const pdfData = await this.pdfOperations.addWatermark(pdfFile, watermarkText, options);
        
        // Generar nombre del archivo
        const originalName = pdfFile.name.replace(/\.[^/.]+$/, '');
        const fileName = `${originalName}_marca_agua.pdf`;

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
      this.uiManager.showSuccess(`Marca de agua agregada a ${processedFiles.length} archivo(s)`);

      // Limpiar selección
      this.selectedFiles = [];
      this._updateFileListView();

    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al agregar marca de agua: ${error.message}`);
    } finally {
      // Habilitar controles nuevamente
      this.uiManager.enableControls();
    }
  }

  /**
   * Obtiene las opciones de marca de agua desde la UI
   * @returns {Object} - Opciones de marca de agua
   */
  getOptionsFromUI() {
    const position = document.getElementById('watermarkPosition')?.value || 'diagonal';
    const opacity = parseFloat(document.getElementById('watermarkOpacity')?.value) || 0.3;
    const fontSize = parseInt(document.getElementById('watermarkFontSize')?.value) || 50;
    const color = document.getElementById('watermarkColor')?.value || '#000000';

    // Calcular rotación basada en posición
    const rotation = position === 'diagonal' ? 45 : 0;

    return {
      position,
      opacity,
      fontSize,
      color,
      rotation
    };
  }

  /**
   * Obtiene el texto de marca de agua desde la UI
   * @returns {string} - Texto de la marca de agua
   */
  getWatermarkTextFromUI() {
    return document.getElementById('watermarkText')?.value?.trim() || '';
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
   * Valida el texto de marca de agua
   * @param {string} text - Texto a validar
   * @returns {boolean} - True si el texto es válido
   */
  validateWatermarkText(text) {
    if (!text || text.trim() === '') {
      this.uiManager.showNotification('Ingresa el texto para la marca de agua', 'error');
      return false;
    }

    if (text.length > 50) {
      this.uiManager.showNotification('El texto de la marca de agua no puede exceder 50 caracteres', 'error');
      return false;
    }

    return true;
  }

  /**
   * Inicializa los event listeners para los controles de marca de agua
   */
  initializeControls() {
    // Control de opacidad
    const opacitySlider = document.getElementById('watermarkOpacity');
    const opacityValue = document.getElementById('opacityValue');

    opacitySlider?.addEventListener('input', (e) => {
      const value = Math.round(e.target.value * 100);
      opacityValue.textContent = `${value}%`;
    });

    // Controles de tamaño de fuente
    const decreaseWatermarkSize = document.getElementById('decreaseWatermarkSize');
    const increaseWatermarkSize = document.getElementById('increaseWatermarkSize');
    const fontSizeInput = document.getElementById('watermarkFontSize');

    decreaseWatermarkSize?.addEventListener('click', () => {
      const currentValue = parseInt(fontSizeInput.value);
      if (currentValue > 20) {
        fontSizeInput.value = currentValue - 5;
      }
    });

    increaseWatermarkSize?.addEventListener('click', () => {
      const currentValue = parseInt(fontSizeInput.value);
      if (currentValue < 100) {
        fontSizeInput.value = currentValue + 5;
      }
    });

    // Control de color
    const colorPicker = document.getElementById('watermarkColor');
    const colorLabel = document.querySelector('.color-input__label');

    colorPicker?.addEventListener('change', (e) => {
      const colorNames = {
        '#000000': 'Negro',
        '#ff0000': 'Rojo',
        '#0000ff': 'Azul',
        '#008000': 'Verde',
        '#800080': 'Morado',
        '#ffa500': 'Naranja',
        '#808080': 'Gris'
      };

      const colorName = colorNames[e.target.value.toLowerCase()] || 'Personalizado';
      if (colorLabel) {
        colorLabel.textContent = colorName;
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