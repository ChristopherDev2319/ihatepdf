import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';

/**
 * PDFRotateController - Controlador para la operación de rotar PDFs
 * 
 * Maneja la lógica de control para rotar páginas de un archivo PDF.
 * Conecta el Modelo (PDFOperations, FileManager) con la Vista (UIManager).
 */
export class PDFRotateController {
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
    this.selectedPages = [];
    this.rotationAngle = 90; // Ángulo por defecto
    this.totalPages = 0;
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
      
      // Guardar el archivo seleccionado
      this.selectedFile = file;
      
      // Obtener el número total de páginas
      await this._loadPageCount();
      
      // Actualizar la vista con el archivo
      this._updateFileView();
      
    } catch (error) {
      this.uiManager.showError(`Error al cargar archivo: ${error.message}`);
    }
  }

  /**
   * Maneja la selección de páginas por parte del usuario
   * @param {number[]|string} pages - Array de números de página o string con páginas (ej: "1,3,5" o "1-5")
   * @returns {boolean} - true si la selección es válida, false en caso contrario
   */
  handlePageSelection(pages) {
    try {
      // Validar que haya un archivo seleccionado
      if (!this.selectedFile) {
        this.uiManager.showError('Primero debes seleccionar un archivo PDF');
        return false;
      }
      
      // Parsear las páginas si es un string
      let parsedPages = pages;
      if (typeof pages === 'string') {
        parsedPages = this._parsePageSelection(pages);
      }
      
      // Validar que sea un array
      if (!Array.isArray(parsedPages)) {
        this.uiManager.showError('Formato de selección de páginas inválido');
        return false;
      }
      
      // Validar que no esté vacío
      if (parsedPages.length === 0) {
        this.uiManager.showError('Debes seleccionar al menos una página para rotar');
        return false;
      }
      
      // Validar que todas las páginas estén dentro del rango
      const validation = this._validatePageSelection(parsedPages);
      
      if (!validation.valid) {
        this.uiManager.showError(validation.error);
        return false;
      }
      
      // Guardar la selección validada
      this.selectedPages = parsedPages;
      return true;
      
    } catch (error) {
      this.uiManager.showError(`Error al procesar selección de páginas: ${error.message}`);
      return false;
    }
  }

  /**
   * Maneja la selección del ángulo de rotación
   * @param {number} degrees - Ángulo de rotación (90, 180 o 270)
   * @returns {boolean} - true si el ángulo es válido, false en caso contrario
   */
  handleRotationAngle(degrees) {
    // Validar que el ángulo sea válido
    const validAngles = [90, 180, 270];
    
    if (!validAngles.includes(degrees)) {
      this.uiManager.showError(`Ángulo de rotación inválido. Debe ser 90, 180 o 270 grados`);
      return false;
    }
    
    // Guardar el ángulo
    this.rotationAngle = degrees;
    return true;
  }

  /**
   * Maneja la operación de rotar el PDF
   */
  async handleRotate() {
    // Validar que haya un archivo seleccionado
    if (!this.selectedFile) {
      this.uiManager.showError('Debes seleccionar un archivo PDF para rotar');
      return;
    }
    
    // Validar que haya páginas seleccionadas
    if (this.selectedPages.length === 0) {
      this.uiManager.showError('Debes seleccionar al menos una página para rotar');
      return;
    }
    
    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Rotando páginas...');
      
      // Rotar el PDF usando el modelo
      const rotatedPDF = await this.pdfOperations.rotatePDF(
        this.selectedFile,
        this.selectedPages,
        this.rotationAngle
      );
      
      // Crear blob y descargar
      const blob = new Blob([rotatedPDF], { type: 'application/pdf' });
      const filename = this._generateRotatedFilename();
      this.fileManager.downloadFile(blob, filename);
      
      // Mostrar éxito
      const successMessage = this._formatSuccessMessage();
      this.uiManager.hideProgress();
      this.uiManager.showSuccess(successMessage);
      
      // Limpiar selección
      this.selectedFile = null;
      this.selectedPages = [];
      this.rotationAngle = 90;
      this.totalPages = 0;
      this._updateFileView();
      
    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al rotar PDF: ${error.message}`);
    } finally {
      // Habilitar controles nuevamente
      this.uiManager.enableControls();
    }
  }

  /**
   * Carga el número total de páginas del PDF seleccionado
   * @private
   */
  async _loadPageCount() {
    try {
      const arrayBuffer = await this.selectedFile.arrayBuffer();
      const { PDFDocument: PDFLibDocument } = await import('pdf-lib');
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      this.totalPages = pdfDoc.getPageCount();
    } catch (error) {
      throw new Error(`No se pudo cargar el PDF: ${error.message}`);
    }
  }

  /**
   * Parsea una cadena de selección de páginas
   * @private
   * @param {string} pagesInput - String con páginas (ej: "1,3,5" o "1-5")
   * @returns {number[]} - Array de números de página
   */
  _parsePageSelection(pagesInput) {
    if (!pagesInput || typeof pagesInput !== 'string') {
      return [];
    }
    
    const pages = new Set();
    const parts = pagesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Rango (ej: "1-5")
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.add(i);
          }
        }
      } else {
        // Página individual (ej: "3")
        const page = parseInt(part, 10);
        if (!isNaN(page)) {
          pages.add(page);
        }
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  }

  /**
   * Valida que la selección de páginas sea válida
   * @private
   * @param {number[]} pages - Array de números de página
   * @returns {{valid: boolean, error?: string}} - Resultado de la validación
   */
  _validatePageSelection(pages) {
    // Validar que todas las páginas estén dentro del rango
    for (const page of pages) {
      if (page < 1 || page > this.totalPages) {
        return {
          valid: false,
          error: `Página ${page} está fuera de rango (1-${this.totalPages})`
        };
      }
    }
    
    return { valid: true };
  }

  /**
   * Maneja la eliminación del archivo seleccionado
   * @param {number} index - Índice del archivo a eliminar (siempre 0 para rotate)
   */
  handleRemoveFile(index) {
    this.selectedFile = null;
    this.selectedPages = [];
    this.totalPages = 0;
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
        size: this.selectedFile.size,
        pageCount: this.totalPages
      }];
      this.uiManager.updateFileList(fileInfo);
    } else {
      this.uiManager.clearFileList();
    }
  }

  /**
   * Genera un nombre de archivo para el PDF rotado
   * @private
   * @returns {string} Nombre del archivo
   */
  _generateRotatedFilename() {
    const originalName = this.selectedFile.name.replace('.pdf', '');
    return `${originalName}_rotated.pdf`;
  }

  /**
   * Formatea el mensaje de éxito
   * @private
   * @returns {string} Mensaje formateado
   */
  _formatSuccessMessage() {
    const pageCount = this.selectedPages.length;
    const pageWord = pageCount === 1 ? 'página' : 'páginas';
    return `${pageCount} ${pageWord} rotada${pageCount === 1 ? '' : 's'} ${this.rotationAngle}° exitosamente`;
  }
}
