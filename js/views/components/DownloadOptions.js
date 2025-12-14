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

    this.container.innerHTML = `
      <div class="download-options__content">
        <h3 class="download-options__title">Guardar archivo</h3>
        
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
        
        
        <div class="download-options__actions">
          <button 
            type="button" 
            id="downloadFileBtn" 
            class="btn btn--primary">
            Guardar archivo
          </button>
          <button 
            type="button" 
            id="cancelDownloadBtn" 
            class="btn btn--secondary">
            Cancelar
          </button>
        </div>
      </div>
    `;

    // Obtener referencias a los elementos
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
    
    // Actualizar la interfaz
    if (this.filenameInput) {
      this.filenameInput.placeholder = defaultFilename;
      this.filenameInput.value = ''; // Limpiar valor anterior
    }

    // Mostrar el componente
    if (this.container) {
      this.container.hidden = false;
      
      // Enfocar el campo de nombre para mejor UX
      if (this.filenameInput) {
        this.filenameInput.focus();
      }
    }
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