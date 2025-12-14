import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';

/**
 * PDFCombineController - Controlador para la operación de combinar PDFs
 * 
 * Maneja la lógica de control para combinar múltiples archivos PDF en uno solo.
 * Conecta el Modelo (PDFOperations, FileManager) con la Vista (UIManager).
 */
export class PDFCombineController {
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
   * Maneja la operación de combinar PDFs
   */
  async handleCombine() {
    // Validar que haya al menos 2 archivos
    if (this.selectedFiles.length < 2) {
      this.uiManager.showError('Debes seleccionar al menos 2 archivos PDF para combinar');
      return;
    }
    
    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Combinando PDFs...');
      
      // Combinar PDFs usando el modelo
      const combinedPDF = await this.pdfOperations.combinePDFs(this.selectedFiles);
      
      // Crear blob para descarga
      const blob = new Blob([combinedPDF], { type: 'application/pdf' });
      
      // Generar nombre por defecto basado en la operación
      const originalFilename = this.selectedFiles.length > 0 ? this.selectedFiles[0].name : null;
      const defaultFilename = this.fileManager.generateDefaultFilename('combine', originalFilename);
      
      // Mostrar opciones de descarga
      this.uiManager.hideProgress();
      this.uiManager.showDownloadOptions(blob, defaultFilename);
      this.uiManager.showSuccess('PDFs combinados exitosamente. Personaliza las opciones de descarga si lo deseas.');
      
      // Limpiar selección
      this.selectedFiles = [];
      this._updateFileListView();
      
    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al combinar PDFs: ${error.message}`);
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


}
