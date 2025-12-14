import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * ImagesToPDFController - Controlador para convertir imágenes (JPG y PNG) a PDF
 */
export class ImagesToPDFController {
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
      
      // Validar que todos los archivos sean imágenes
      const validFiles = [];
      const invalidFiles = [];
      
      for (const file of loadedFiles) {
        if (this.fileManager.validateImageFile(file)) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      }
      
      // Si hay archivos inválidos, mostrar error
      if (invalidFiles.length > 0) {
        this.uiManager.showError(
          `Los siguientes archivos no son imágenes válidas: ${invalidFiles.join(', ')}`
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
   * Maneja la operación de convertir imágenes a PDF
   */
  async handleConvert() {
    await this.process(this.selectedFiles);
  }

  /**
   * Procesa la conversión de imágenes a PDF
   * @param {File[]} imageFiles - Array de archivos de imagen
   * @returns {Promise<void>}
   */
  async process(imageFiles) {
    // Validar que haya al menos 1 archivo
    if (!imageFiles || imageFiles.length === 0) {
      this.uiManager.showError('Debes seleccionar al menos 1 archivo de imagen para convertir');
      return;
    }

    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Convirtiendo imágenes a PDF...');

      // Convertir imágenes a PDF
      const pdfData = await this.pdfOperations.convertImagesToPDF(imageFiles);

      // Crear blob y descargar
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const filename = this._generateConvertedFilename();
      this.fileManager.downloadFile(blob, filename);

      // Mostrar éxito
      this.uiManager.hideProgress();
      this.uiManager.showSuccess('Imágenes convertidas a PDF exitosamente');

      // Limpiar selección
      this.selectedFiles = [];
      this._updateFileListView();

    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al convertir imágenes a PDF: ${error.message}`);
    } finally {
      // Habilitar controles nuevamente
      this.uiManager.enableControls();
    }
  }

  /**
   * Valida los archivos de imagen antes del procesamiento
   * @param {File[]} files - Archivos a validar
   * @returns {boolean} - True si todos los archivos son válidos
   */
  validateFiles(files) {
    if (!files || files.length === 0) {
      this.uiManager.showNotification('Selecciona al menos un archivo de imagen', 'error');
      return false;
    }

    const maxFileSize = 50 * 1024 * 1024; // 50MB por archivo
    const invalidFiles = [];

    for (const file of files) {
      // Validar tipo de archivo
      const isJPG = file.type.includes('jpeg') || file.type.includes('jpg') || 
                   file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
      const isPNG = file.type.includes('png') || file.name.toLowerCase().endsWith('.png');
      
      if (!isJPG && !isPNG) {
        invalidFiles.push(`${file.name} (no es JPG/PNG)`);
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

  /**
   * Genera un nombre de archivo para el PDF convertido
   * @private
   * @returns {string} Nombre del archivo
   */
  _generateConvertedFilename() {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `converted_images_${timestamp}.pdf`;
  }
}