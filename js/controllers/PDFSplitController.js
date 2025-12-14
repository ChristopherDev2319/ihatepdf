import { PDFOperations } from '../models/PDFOperations.js';
import { FileManager } from '../models/FileManager.js';
import { UIManager } from '../views/UIManager.js';

/**
 * PDFSplitController - Controlador para la operación de dividir PDFs
 * 
 * Maneja la lógica de control para dividir un archivo PDF en múltiples documentos.
 * Conecta el Modelo (PDFOperations, FileManager) con la Vista (UIManager).
 */
export class PDFSplitController {
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
    this.pageRanges = [];
    this.totalPages = 0;
    this.splitMode = null; // 'pages' o 'ranges'
    this.pagesPerSplit = 1;
    this.customRanges = [];
    
    // Elementos del DOM
    this.splitInfo = null;
    this.splitOptions = null;
    this.splitByPagesBtn = null;
    this.splitByRangesBtn = null;
    this.splitConfigPages = null;
    this.splitConfigRanges = null;
    this.pagesPerSplitInput = null;
    this.rangesList = null;
  }
  
  /**
   * Inicializa los elementos del DOM y event listeners
   */
  initializeSplitUI() {
    this.splitInfo = document.getElementById('splitInfo');
    this.splitOptions = document.getElementById('splitOptions');
    this.splitByPagesBtn = document.getElementById('splitByPages');
    this.splitByRangesBtn = document.getElementById('splitByRanges');
    this.splitConfigPages = document.getElementById('splitConfigPages');
    this.splitConfigRanges = document.getElementById('splitConfigRanges');
    this.pagesPerSplitInput = document.getElementById('pagesPerSplit');
    this.rangesList = document.getElementById('rangesList');
    
    // Event listeners para botones de modo
    if (this.splitByPagesBtn) {
      this.splitByPagesBtn.addEventListener('click', () => this.selectSplitMode('pages'));
    }
    if (this.splitByRangesBtn) {
      this.splitByRangesBtn.addEventListener('click', () => this.selectSplitMode('ranges'));
    }
    
    // Event listeners para dividir por páginas
    const decreaseBtn = document.getElementById('decreasePages');
    const increaseBtn = document.getElementById('increasePages');
    
    if (decreaseBtn) {
      decreaseBtn.addEventListener('click', () => this.changePagesPerSplit(-1));
    }
    if (increaseBtn) {
      increaseBtn.addEventListener('click', () => this.changePagesPerSplit(1));
    }
    if (this.pagesPerSplitInput) {
      this.pagesPerSplitInput.addEventListener('input', () => this.updatePagesPreview());
    }
    
    // Event listener para agregar rango
    const addRangeBtn = document.getElementById('addRange');
    if (addRangeBtn) {
      addRangeBtn.addEventListener('click', () => this.addCustomRange());
    }
  }
  
  /**
   * Selecciona el modo de división
   */
  selectSplitMode(mode) {
    this.splitMode = mode;
    
    // Actualizar botones
    if (this.splitByPagesBtn) {
      this.splitByPagesBtn.classList.toggle('active', mode === 'pages');
    }
    if (this.splitByRangesBtn) {
      this.splitByRangesBtn.classList.toggle('active', mode === 'ranges');
    }
    
    // Mostrar/ocultar configuraciones
    if (this.splitConfigPages) {
      this.splitConfigPages.hidden = mode !== 'pages';
    }
    if (this.splitConfigRanges) {
      this.splitConfigRanges.hidden = mode !== 'ranges';
    }
    
    if (mode === 'pages') {
      this.updatePagesPreview();
    } else if (mode === 'ranges') {
      if (this.customRanges.length === 0) {
        this.addCustomRange();
      }
    }
  }
  
  /**
   * Cambia el número de páginas por división
   */
  changePagesPerSplit(delta) {
    if (!this.pagesPerSplitInput) return;
    
    let value = parseInt(this.pagesPerSplitInput.value) || 1;
    value = Math.max(1, Math.min(this.totalPages, value + delta));
    this.pagesPerSplitInput.value = value;
    this.pagesPerSplit = value;
    this.updatePagesPreview();
  }
  
  /**
   * Actualiza la vista previa de división por páginas
   */
  updatePagesPreview() {
    if (!this.pagesPerSplitInput) return;
    
    this.pagesPerSplit = parseInt(this.pagesPerSplitInput.value) || 1;
    const numFiles = Math.ceil(this.totalPages / this.pagesPerSplit);
    
    const previewEl = document.getElementById('splitPagesPreview');
    if (previewEl) {
      previewEl.textContent = `Esto creará ${numFiles} archivo${numFiles !== 1 ? 's' : ''}`;
    }
  }
  
  /**
   * Agrega un rango personalizado
   */
  addCustomRange() {
    const rangeId = this.customRanges.length;
    const range = { id: rangeId, start: 1, end: this.totalPages };
    this.customRanges.push(range);
    this.renderCustomRange(range);
  }
  
  /**
   * Renderiza un rango personalizado
   */
  renderCustomRange(range) {
    if (!this.rangesList) return;
    
    const rangeEl = document.createElement('div');
    rangeEl.className = 'range-item';
    rangeEl.dataset.rangeId = range.id;
    rangeEl.innerHTML = `
      <span class="range-item__label">Desde página</span>
      <input 
        type="number" 
        class="range-item__input" 
        data-field="start"
        value="${range.start}"
        min="1"
        max="${this.totalPages}">
      <span class="range-item__separator">hasta</span>
      <input 
        type="number" 
        class="range-item__input" 
        data-field="end"
        value="${range.end}"
        min="1"
        max="${this.totalPages}">
      <button type="button" class="range-item__remove" data-range-id="${range.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    
    // Event listeners para inputs
    const inputs = rangeEl.querySelectorAll('.range-item__input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const field = e.target.dataset.field;
        const value = parseInt(e.target.value) || 1;
        range[field] = Math.max(1, Math.min(this.totalPages, value));
      });
    });
    
    // Event listener para botón de eliminar
    const removeBtn = rangeEl.querySelector('.range-item__remove');
    removeBtn.addEventListener('click', () => {
      this.removeCustomRange(range.id);
    });
    
    this.rangesList.appendChild(rangeEl);
  }
  
  /**
   * Elimina un rango personalizado
   */
  removeCustomRange(rangeId) {
    this.customRanges = this.customRanges.filter(r => r.id !== rangeId);
    const rangeEl = this.rangesList?.querySelector(`[data-range-id="${rangeId}"]`);
    if (rangeEl) {
      rangeEl.remove();
    }
  }
  
  /**
   * Genera los rangos según el modo seleccionado
   */
  generateRanges() {
    if (this.splitMode === 'pages') {
      // Dividir cada N páginas
      const ranges = [];
      for (let i = 1; i <= this.totalPages; i += this.pagesPerSplit) {
        const end = Math.min(i + this.pagesPerSplit - 1, this.totalPages);
        ranges.push({ start: i, end: end });
      }
      return ranges;
    } else if (this.splitMode === 'ranges') {
      // Usar rangos personalizados
      return this.customRanges.map(r => ({ start: r.start, end: r.end }));
    }
    return [];
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
      
      // Obtener número de páginas
      await this._loadPageCount();
      
      // Inicializar UI si no está inicializada
      if (!this.splitInfo) {
        this.initializeSplitUI();
      }
      
      // Mostrar opciones de división
      if (this.splitInfo) {
        this.splitInfo.hidden = true;
      }
      if (this.splitOptions) {
        this.splitOptions.hidden = false;
        
        // Actualizar texto informativo
        const titleEl = this.splitOptions.querySelector('.split-options__title');
        if (titleEl) {
          titleEl.textContent = `¿Cómo quieres dividir el PDF? (${this.totalPages} páginas)`;
        }
      }
      
      // Actualizar la vista con el archivo
      this._updateFileView();
      
    } catch (error) {
      this.uiManager.showError(`Error al cargar archivo: ${error.message}`);
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
   * Maneja la operación de dividir el PDF
   */
  async handleSplit() {
    // Validar que haya un archivo seleccionado
    if (!this.selectedFile) {
      this.uiManager.showError('Debes seleccionar un archivo PDF para dividir');
      return;
    }
    
    // Validar que se haya seleccionado un modo
    if (!this.splitMode) {
      this.uiManager.showError('Debes seleccionar cómo quieres dividir el PDF');
      return;
    }
    
    // Generar rangos según el modo seleccionado
    const ranges = this.generateRanges();
    
    if (ranges.length === 0) {
      this.uiManager.showError('Debes especificar al menos un rango para dividir');
      return;
    }
    
    // Validar rangos
    const validation = this._validateRanges(ranges, this.totalPages);
    if (!validation.valid) {
      this.uiManager.showError(validation.error);
      return;
    }
    
    try {
      // Deshabilitar controles durante el procesamiento
      this.uiManager.disableControls();
      this.uiManager.showProgress('Dividiendo PDF...');
      
      // Dividir el PDF usando el modelo
      const splitPDFs = await this.pdfOperations.splitPDF(this.selectedFile, ranges);
      
      // Para múltiples archivos, mostrar opciones de descarga para cada uno
      if (splitPDFs.length === 1) {
        // Un solo archivo - mostrar opciones de descarga
        const blob = new Blob([splitPDFs[0]], { type: 'application/pdf' });
        const defaultFilename = this.fileManager.generateDefaultFilename('split', this.selectedFile.name);
        
        this.uiManager.hideProgress();
        this.uiManager.showDownloadOptions(blob, defaultFilename);
        this.uiManager.showSuccess('PDF dividido exitosamente. Personaliza las opciones de descarga si lo deseas.');
      } else {
        // Múltiples archivos - descargar directamente con nombres por defecto
        splitPDFs.forEach((pdfBytes, index) => {
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const filename = this._generateSplitFilename(index);
          this.fileManager.downloadFile(blob, filename);
        });
        
        this.uiManager.hideProgress();
        this.uiManager.showSuccess(`PDF dividido exitosamente en ${splitPDFs.length} archivos`);
      }
      
      // Limpiar selección
      this._resetSplitState();
      
    } catch (error) {
      this.uiManager.hideProgress();
      this.uiManager.showError(`Error al dividir PDF: ${error.message}`);
    } finally {
      // Habilitar controles nuevamente
      this.uiManager.enableControls();
    }
  }
  
  /**
   * Reinicia el estado de división
   * @private
   */
  _resetSplitState() {
    this.selectedFile = null;
    this.pageRanges = [];
    this.totalPages = 0;
    this.splitMode = null;
    this.pagesPerSplit = 1;
    this.customRanges = [];
    
    // Ocultar opciones y mostrar info
    if (this.splitInfo) {
      this.splitInfo.hidden = false;
    }
    if (this.splitOptions) {
      this.splitOptions.hidden = true;
    }
    if (this.splitConfigPages) {
      this.splitConfigPages.hidden = true;
    }
    if (this.splitConfigRanges) {
      this.splitConfigRanges.hidden = true;
    }
    if (this.rangesList) {
      this.rangesList.innerHTML = '';
    }
    
    this._updateFileView();
  }



  /**
   * Valida que los rangos sean válidos y no estén superpuestos
   * @private
   * @param {Array<{start: number, end: number}>} ranges - Rangos a validar
   * @param {number} totalPages - Número total de páginas del documento
   * @returns {{valid: boolean, error?: string}} - Resultado de la validación
   */
  _validateRanges(ranges, totalPages) {
    // Validar que cada rango esté dentro de los límites
    for (const range of ranges) {
      if (range.start < 1 || range.start > totalPages) {
        return {
          valid: false,
          error: `Página inicial ${range.start} está fuera de rango (1-${totalPages})`
        };
      }
      if (range.end < 1 || range.end > totalPages) {
        return {
          valid: false,
          error: `Página final ${range.end} está fuera de rango (1-${totalPages})`
        };
      }
      if (range.start > range.end) {
        return {
          valid: false,
          error: `Rango inválido: ${range.start}-${range.end} (inicio mayor que fin)`
        };
      }
    }
    
    // Validar que no haya superposiciones
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const range1 = ranges[i];
        const range2 = ranges[j];
        
        // Verificar si hay superposición
        if (this._rangesOverlap(range1, range2)) {
          return {
            valid: false,
            error: `Los rangos ${range1.start}-${range1.end} y ${range2.start}-${range2.end} se superponen`
          };
        }
      }
    }
    
    return { valid: true };
  }

  /**
   * Verifica si dos rangos se superponen
   * @private
   * @param {{start: number, end: number}} range1 - Primer rango
   * @param {{start: number, end: number}} range2 - Segundo rango
   * @returns {boolean} - true si se superponen, false en caso contrario
   */
  _rangesOverlap(range1, range2) {
    return range1.start <= range2.end && range2.start <= range1.end;
  }


  /**
   * Maneja la eliminación del archivo seleccionado
   * @param {number} index - Índice del archivo a eliminar (siempre 0 para split)
   */
  handleRemoveFile(index) {
    // En split solo hay un archivo, así que siempre eliminamos el seleccionado
    this._resetSplitState();
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
   * Genera un nombre de archivo para un PDF dividido
   * @private
   * @param {number} index - Índice del archivo dividido
   * @returns {string} Nombre del archivo
   */
  _generateSplitFilename(index) {
    const baseName = this.fileManager.generateDefaultFilename('split', this.selectedFile.name);
    const nameWithoutExt = baseName.replace('.pdf', '');
    return `${nameWithoutExt}_parte${index + 1}.pdf`;
  }
}
