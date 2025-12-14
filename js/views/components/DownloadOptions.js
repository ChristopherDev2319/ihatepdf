/**
 * DownloadOptions - Componente para personalizar opciones de descarga
 * 
 * Este componente permite al usuario personalizar el nombre del archivo.
 * Siempre intenta usar ubicación personalizada, con fallback automático a descarga normal.
 */
export class DownloadOptions {
  constructor(fileManager) {
    this.fileManager = fileManager;
    this.container = null;
    this.filenameInput = null;
    this.downloadButton = null;
    this.currentBlob = null;
    this.defaultFilename = '';
    
    this.createComponent();
    this.bindEvents();
  }

  /**
   * Crea la estructura HTML del componente
   */
  createComponent() {
    this.container = document.createElement('div');
    this.container.className = 'download-options';
    this.container.id = 'downloadOptions';
    this.container.hidden = true;
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Opciones de descarga');

    // La estructura se creará dinámicamente en show() según el soporte del navegador
    this.container.innerHTML = '<div class="download-options__content"></div>';
  }

  /**
   * Crea la estructura HTML según el soporte del navegador
   * @private
   * @param {boolean} supportsFileSystemAccess - Si el navegador soporta File System Access API
   */
  _createDynamicStructure(supportsFileSystemAccess) {
    const content = this.container.querySelector('.download-options__content');
    if (!content) return;

    if (supportsFileSystemAccess) {
      // Navegadores compatibles: Solo título y botón de guardar
      content.innerHTML = `
        <h3 class="download-options__title">Guardar archivo</h3>
        
        <div class="download-options__actions">
          <button 
            type="button" 
            id="downloadFileBtn" 
            class="btn btn--primary">
            Elegir ubicación y guardar
          </button>
          <button 
            type="button" 
            id="cancelDownloadBtn" 
            class="btn btn--secondary">
            Cancelar
          </button>
        </div>
      `;
    } else {
      // Navegadores no compatibles: Campo de nombre + información + botón de descarga
      content.innerHTML = `
        <h3 class="download-options__title">Descargar archivo</h3>
        
        <div class="download-options__field">
          <label for="customFilename" class="download-options__label">
            Nombre del archivo:
          </label>
          <input 
            type="text" 
            id="customFilename" 
            class="download-options__input"
            placeholder="nombre_archivo.pdf"
            aria-describedby="filenameHelp">
          <small id="filenameHelp" class="download-options__help">
            Deja vacío para usar el nombre por defecto
          </small>
        </div>
        
        <div class="download-options__info" id="downloadInfo">
          <p class="download-options__info-text" id="downloadInfoText"></p>
        </div>
        
        <div class="download-options__actions">
          <button 
            type="button" 
            id="downloadFileBtn" 
            class="btn btn--primary">
            Descargar
          </button>
          <button 
            type="button" 
            id="cancelDownloadBtn" 
            class="btn btn--secondary">
            Cancelar
          </button>
        </div>
      `;
    }

    // Actualizar referencias a los elementos
    this.filenameInput = this.container.querySelector('#customFilename');
    this.downloadButton = this.container.querySelector('#downloadFileBtn');
    this.cancelButton = this.container.querySelector('#cancelDownloadBtn');
  }

  /**
   * Vincula los eventos del componente
   */
  bindEvents() {
    if (this.downloadButton) {
      this.downloadButton.addEventListener('click', () => {
        this.handleDownload();
      });
    }

    if (this.cancelButton) {
      this.cancelButton.addEventListener('click', () => {
        this.hide();
      });
    }

    // Actualizar el placeholder cuando cambie el nombre por defecto
    if (this.filenameInput) {
      this.filenameInput.addEventListener('input', () => {
        this.validateFilename();
      });
    }
  }

  /**
   * Muestra las opciones de descarga
   * @param {Blob} blob - Blob del archivo a descargar
   * @param {string} defaultFilename - Nombre por defecto del archivo
   */
  show(blob, defaultFilename) {
    if (!blob || !defaultFilename) {
      throw new Error('Se requieren blob y nombre por defecto');
    }

    this.currentBlob = blob;
    this.defaultFilename = defaultFilename;
    
    // Determinar si el navegador soporta File System Access API
    const supportsAPI = this.fileManager.supportsFileSystemAccess();
    
    // Crear estructura dinámica según el soporte
    this._createDynamicStructure(supportsAPI);
    
    // Configurar eventos después de crear la estructura
    this.bindEvents();
    
    // Actualizar la interfaz según el tipo de navegador
    if (!supportsAPI) {
      // Solo actualizar campo de nombre si existe (navegadores no compatibles)
      if (this.filenameInput) {
        this.filenameInput.placeholder = defaultFilename;
        this.filenameInput.value = ''; // Limpiar valor anterior
      }
      
      // Mostrar información contextual
      this._updateContextualInfo();
    }

    // Mostrar el componente
    if (this.container) {
      this.container.hidden = false;
      
      // Enfocar el campo de nombre solo si existe y no es móvil
      if (this.filenameInput && !this.fileManager.isMobileDevice()) {
        this.filenameInput.focus();
      }
    }
  }

  /**
   * Actualiza la información contextual para navegadores no compatibles
   * @private
   */
  _updateContextualInfo() {
    const infoDiv = this.container.querySelector('#downloadInfo');
    const infoText = this.container.querySelector('#downloadInfoText');
    
    if (!infoDiv || !infoText) return;

    // Mostrar razón por la que no está disponible la selección de ubicación
    const reason = this.fileManager.getFileSystemAccessUnavailableReason();
    infoText.textContent = reason;
    infoDiv.hidden = false;
  }

  /**
   * Oculta las opciones de descarga
   */
  hide() {
    if (this.container) {
      this.container.hidden = true;
    }
    
    // Limpiar datos temporales
    this.currentBlob = null;
    this.defaultFilename = '';
  }

  /**
   * Obtiene el nombre personalizado del archivo
   * @returns {string} - Nombre personalizado o nombre por defecto
   */
  getCustomFilename() {
    // Si no hay campo de entrada (navegadores compatibles), usar nombre por defecto
    if (!this.filenameInput) {
      return this.defaultFilename;
    }

    const customName = this.filenameInput.value.trim();
    
    if (!customName) {
      return this.defaultFilename;
    }

    // Asegurar que termine en .pdf
    if (!customName.toLowerCase().endsWith('.pdf')) {
      return customName + '.pdf';
    }

    return customName;
  }

  /**
   * Siempre usa ubicación personalizada (con fallback automático)
   * @returns {boolean} - siempre true para intentar ubicación personalizada
   */
  isCustomLocationSelected() {
    return true;
  }

  /**
   * Maneja la descarga del archivo
   */
  async handleDownload() {
    if (!this.currentBlob) {
      console.error('No hay archivo para descargar');
      return;
    }

    try {
      // Deshabilitar botón durante la descarga
      if (this.downloadButton) {
        this.downloadButton.disabled = true;
        this.downloadButton.textContent = 'Guardando...';
      }

      const filename = this.getCustomFilename();
      
      // Siempre intentar usar ubicación personalizada (con fallback automático)
      await this.fileManager.downloadFileWithCustomLocation(this.currentBlob, filename);

      // Ocultar opciones después de descarga exitosa
      this.hide();

    } catch (error) {
      console.error('Error durante la descarga:', error);
      // Mostrar error al usuario si es necesario
      
    } finally {
      // Restaurar botón
      if (this.downloadButton) {
        this.downloadButton.disabled = false;
        this.downloadButton.textContent = 'Guardar archivo';
      }
    }
  }

  /**
   * Valida el nombre del archivo ingresado
   */
  validateFilename() {
    if (!this.filenameInput) {
      return;
    }

    const filename = this.filenameInput.value.trim();
    
    // Validar caracteres no permitidos en nombres de archivo
    const invalidChars = /[<>:"/\\|?*]/;
    
    if (filename && invalidChars.test(filename)) {
      this.filenameInput.setCustomValidity('El nombre contiene caracteres no válidos');
      this.filenameInput.reportValidity();
    } else {
      this.filenameInput.setCustomValidity('');
    }
  }

  /**
   * Obtiene el elemento contenedor del componente
   * @returns {HTMLElement} - Elemento contenedor
   */
  getElement() {
    return this.container;
  }

  /**
   * Destruye el componente y limpia recursos
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.filenameInput = null;
    this.downloadButton = null;
    this.cancelButton = null;
    this.currentBlob = null;
    this.defaultFilename = '';
  }
}