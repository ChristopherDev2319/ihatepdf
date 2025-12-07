import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';

/**
 * JPGToPDFController - Controlador para la operación de convertir JPG a PDF
 * 
 * Maneja la lógica de control para convertir imágenes JPG a formato PDF.
 * Conecta el Modelo (PDFOperations, FileManager) con la Vista (UIManager).
 */
export class JPGToPDFController {
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
      
      // Validar que todos los archivos sean JPGs
      const validFiles = [];
      const invalidFiles = [];
      
      for (const file of loadedFiles) {
        if (this.fileManager.validateJPGFile(file)) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      }
      
      // Si hay archivos inválidos, mostrar error
      if (invalidFiles.length > 0) {
        this.uiManager.showError(
          `Los siguientes archivos no son JPGs válidos: ${invalidFiles.join(', ')}`
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
   * Maneja el reordenamiento de archivos en la lista
   * @param {number} oldIndex - Índice original del archivo
   * @param {number} newIndex - Nuevo índice del archivo
   */
  handleReorder(oldIndex, newIndex) {
    // Validar índices
    if (oldIndex < 0 || oldIndex >= this.selectedFiles.length ||
        newIndex < 0 || newIndex >= this.selectedFiles.length) {
      return;
    }
    
    // Reordenar el array
    const [movedFile] = this.selectedFiles.splice(oldIndex, 1);
    this.selectedFiles.splice(newIndex, 0, movedFile);
    
    // Actualizar la vista
    this._updateFileListView();
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
   * Maneja la operación de convertir JPG a PDF
   */
  async handleConvert() {
    // Validar que haya al menos 1 archivo
    if (this.selectedFiles.length === 0) {
      this.uiManager.showError('Debes seleccionar al menos 1 archivo JPG para convertir');
      return;
    }
    
    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Convirtiendo JPG a PDF...');
      
      // Convertir JPGs a PDF usando el modelo
      const pdfData = await this.pdfOperations.convertJPGToPDF(this.selectedFiles);
      
      // Crear blob y descargar
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const filename = this._generateConvertedFilename();
      this.fileManager.downloadFile(blob, filename);
      
      // Mostrar éxito
      this.uiManager.hideProgress();
      this.uiManager.showSuccess('JPG convertido a PDF exitosamente');
      
      // Limpiar selección
      this.selectedFiles = [];
      this._updateFileListView();
      
    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al convertir JPG a PDF: ${error.message}`);
    } finally {
      // Habilitar controles nuevamente
      this.uiManager.enableControls();
    }
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
    return `converted_${timestamp}.pdf`;
  }
}
