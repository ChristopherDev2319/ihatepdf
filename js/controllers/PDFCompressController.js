import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';

/**
 * PDFCompressController - Controlador para la operación de comprimir PDFs
 * 
 * Maneja la lógica de control para comprimir archivos PDF.
 * Conecta el Modelo (PDFOperations, FileManager) con la Vista (UIManager).
 */
export class PDFCompressController {
  /**
   * @param {PDFOperations} pdfOperations - Instancia de PDFOperations
   * @param {FileManager} fileManager - Instancia de FileManager
   * @param {UIManager} uiManager - Instancia de UIManager
   */
  constructor(pdfOperations, fileManager, uiManager) {
    this.pdfOperations = pdfOperations;
    this.fileManager = fileManager;
    this.uiManager = uiManager;
    
    // Estado interno
    this.selectedFile = null;
    this.originalSize = null;
  }

  /**
   * Maneja la selección de archivo por parte del usuario
   * @param {FileList|File} files - Archivo seleccionado (puede ser FileList o File único)
   */
  async handleFileSelection(files) {
    try {
      // Si es FileList, tomar el primer archivo
      const file = files instanceof FileList ? files[0] : files;
      
      if (!file) {
        this.uiManager.showError('No se seleccionó ningún archivo');
        return;
      }
      
      // Validar que el archivo sea un PDF
      if (!this.fileManager.validatePDFFile(file)) {
        this.uiManager.showError(`El archivo ${file.name} no es un PDF válido`);
        return;
      }
      
      // Guardar el archivo seleccionado y su tamaño
      this.selectedFile = file;
      this.originalSize = file.size;
      
      // Actualizar la vista con el archivo
      this._updateFileView();
      
    } catch (error) {
      this.uiManager.showError(`Error al cargar archivo: ${error.message}`);
    }
  }

  /**
   * Maneja la operación de comprimir el PDF
   */
  async handleCompress() {
    // Validar que haya un archivo seleccionado
    if (!this.selectedFile) {
      this.uiManager.showError('Debes seleccionar un archivo PDF para comprimir');
      return;
    }
    
    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Comprimiendo PDF...');
      
      // Comprimir el PDF usando el modelo
      const result = await this.pdfOperations.compressPDF(this.selectedFile);
      
      // Crear blob para descarga
      const blob = new Blob([result.data], { type: 'application/pdf' });
      
      // Generar nombre por defecto basado en la operación
      const defaultFilename = this.fileManager.generateDefaultFilename('compress', this.selectedFile.name);
      
      // Mostrar opciones de descarga
      this.uiManager.hideProgress();
      this.uiManager.showDownloadOptions(blob, defaultFilename);
      
      // Mostrar éxito con información de tamaños y porcentaje
      const successMessage = this._formatSuccessMessage(
        result.originalSize,
        result.compressedSize,
        result.reductionPercentage
      );
      this.uiManager.showSuccess(successMessage + ' Personaliza las opciones de descarga si lo deseas.');
      
      // Limpiar selección
      this.selectedFile = null;
      this.originalSize = null;
      this._updateFileView();
      
    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al comprimir PDF: ${error.message}`);
    } finally {
      // Habilitar controles nuevamente
      this.uiManager.enableControls();
    }
  }

  /**
   * Maneja la eliminación del archivo seleccionado
   * @param {number} index - Índice del archivo a eliminar (siempre 0 para compress)
   */
  handleRemoveFile(index) {
    this.selectedFile = null;
    this.originalSize = null;
    this._updateFileView();
  }

  /**
   * Actualiza la vista con el archivo actual
   * @private
   */
  _updateFileView() {
    if (this.selectedFile) {
      const fileInfo = [{
        file: this.selectedFile,
        name: this.selectedFile.name,
        size: this.selectedFile.size
      }];
      this.uiManager.updateFileList(fileInfo);
    } else {
      this.uiManager.clearFileList();
    }
  }



  /**
   * Formatea el mensaje de éxito con información de tamaños y porcentaje
   * @private
   * @param {number} originalSize - Tamaño original en bytes
   * @param {number} compressedSize - Tamaño comprimido en bytes
   * @param {number} reductionPercentage - Porcentaje de reducción
   * @returns {string} Mensaje formateado
   */
  _formatSuccessMessage(originalSize, compressedSize, reductionPercentage) {
    const formatBytes = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };
    
    const originalSizeStr = formatBytes(originalSize);
    const compressedSizeStr = formatBytes(compressedSize);
    const reductionStr = reductionPercentage.toFixed(2);
    
    return `PDF comprimido exitosamente. Tamaño original: ${originalSizeStr}, Tamaño comprimido: ${compressedSizeStr}, Reducción: ${reductionStr}%`;
  }
}
