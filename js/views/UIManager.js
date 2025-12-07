/**
 * UIManager - Gestiona la actualización de la interfaz de usuario
 * 
 * Esta clase maneja todas las interacciones con el DOM para actualizar
 * la interfaz de usuario, incluyendo indicadores de progreso, notificaciones,
 * lista de archivos y estado de controles.
 */
export class UIManager {
  constructor() {
    // Elementos del DOM
    this.progressIndicator = document.getElementById('progressIndicator');
    this.progressMessage = document.getElementById('progressMessage');
    this.notification = document.getElementById('notification');
    this.notificationMessage = document.getElementById('notificationMessage');
    this.fileList = document.getElementById('fileList');
    this.processBtn = document.getElementById('processBtn');
    this.operationButtons = document.querySelectorAll('.operation-btn');
    this.fileInput = document.getElementById('fileInput');
    this.dropzone = document.getElementById('dropzone');
    
    // Controles específicos de operaciones
    this.splitControls = document.getElementById('splitControls');
    this.rotateControls = document.getElementById('rotateControls');
    this.pageRanges = document.getElementById('pageRanges');
    this.pageSelection = document.getElementById('pageSelection');
    this.rotationAngle = document.getElementById('rotationAngle');
    
    // Estado
    this.notificationTimeout = null;
  }

  /**
   * Muestra el indicador de progreso con un mensaje
   * @param {string} message - Mensaje a mostrar durante el procesamiento
   */
  showProgress(message = 'Procesando...') {
    if (this.progressIndicator) {
      this.progressIndicator.hidden = false;
      if (this.progressMessage) {
        this.progressMessage.textContent = message;
      }
    }
  }

  /**
   * Oculta el indicador de progreso
   */
  hideProgress() {
    if (this.progressIndicator) {
      this.progressIndicator.hidden = true;
    }
  }

  /**
   * Muestra una notificación de éxito
   * @param {string} message - Mensaje de éxito a mostrar
   * @param {number} duration - Duración en ms antes de auto-cerrar (default: 5000)
   */
  showSuccess(message, duration = 5000) {
    this._showNotification(message, 'success', duration);
  }

  /**
   * Muestra una notificación de error
   * @param {string} message - Mensaje de error a mostrar
   * @param {number} duration - Duración en ms antes de auto-cerrar (default: 8000)
   */
  showError(message, duration = 8000) {
    this._showNotification(message, 'error', duration);
  }

  /**
   * Muestra una notificación con el tipo especificado
   * @private
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación ('success' o 'error')
   * @param {number} duration - Duración en ms antes de auto-cerrar
   */
  _showNotification(message, type, duration) {
    if (!this.notification || !this.notificationMessage) {
      return;
    }

    // Limpiar timeout anterior si existe
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    // Actualizar contenido y estilo
    this.notificationMessage.textContent = message;
    this.notification.className = `notification notification--${type}`;
    this.notification.hidden = false;

    // Auto-cerrar después de la duración especificada
    if (duration > 0) {
      this.notificationTimeout = setTimeout(() => {
        this.hideNotification();
      }, duration);
    }
  }

  /**
   * Oculta la notificación actual
   */
  hideNotification() {
    if (this.notification) {
      this.notification.hidden = true;
    }
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  }

  /**
   * Actualiza la lista de archivos en la interfaz
   * @param {Array<Object>} files - Array de objetos con información de archivos
   * @param {File} files[].file - Objeto File
   * @param {string} files[].name - Nombre del archivo
   * @param {number} files[].size - Tamaño del archivo en bytes
   * @param {number} [files[].pageCount] - Número de páginas (para PDFs)
   */
  updateFileList(files) {
    if (!this.fileList) {
      return;
    }

    // Limpiar lista actual
    this.fileList.innerHTML = '';

    // Si no hay archivos, mostrar mensaje
    if (!files || files.length === 0) {
      this.fileList.innerHTML = '<li class="file-preview__empty">No hay archivos seleccionados</li>';
      return;
    }

    // Agregar cada archivo a la lista
    files.forEach((fileInfo, index) => {
      const li = document.createElement('li');
      li.className = 'file-preview__item';
      li.setAttribute('data-index', index);
      li.setAttribute('role', 'listitem');

      const fileSize = this._formatFileSize(fileInfo.size);
      const pageInfo = fileInfo.pageCount ? ` - ${fileInfo.pageCount} página${fileInfo.pageCount !== 1 ? 's' : ''}` : '';

      const escapedName = this._escapeHtml(fileInfo.name);
      
      li.innerHTML = `
        <div class="file-preview__info">
          <span class="file-preview__name">${escapedName}</span>
          <span class="file-preview__meta">${fileSize}${pageInfo}</span>
        </div>
        <button 
          type="button" 
          class="file-preview__remove" 
          data-index="${index}"
          aria-label="Eliminar ${escapedName}">
          ×
        </button>
      `;

      this.fileList.appendChild(li);
    });
  }

  /**
   * Limpia la lista de archivos
   */
  clearFileList() {
    this.updateFileList([]);
  }

  /**
   * Habilita todos los controles de la interfaz
   */
  enableControls() {
    // Habilitar botón de procesar
    if (this.processBtn) {
      this.processBtn.disabled = false;
    }

    // Habilitar botones de operación
    if (this.operationButtons) {
      this.operationButtons.forEach(btn => {
        btn.disabled = false;
      });
    }

    // Habilitar input de archivos
    if (this.fileInput) {
      this.fileInput.disabled = false;
    }

    // Habilitar dropzone
    if (this.dropzone) {
      this.dropzone.classList.remove('file-upload__dropzone--disabled');
      this.dropzone.setAttribute('tabindex', '0');
    }

    // Habilitar controles específicos de operaciones
    if (this.pageRanges) {
      this.pageRanges.disabled = false;
    }
    if (this.pageSelection) {
      this.pageSelection.disabled = false;
    }
    if (this.rotationAngle) {
      this.rotationAngle.disabled = false;
    }
  }

  /**
   * Deshabilita todos los controles de la interfaz
   */
  disableControls() {
    // Deshabilitar botón de procesar
    if (this.processBtn) {
      this.processBtn.disabled = true;
    }

    // Deshabilitar botones de operación
    if (this.operationButtons) {
      this.operationButtons.forEach(btn => {
        btn.disabled = true;
      });
    }

    // Deshabilitar input de archivos
    if (this.fileInput) {
      this.fileInput.disabled = true;
    }

    // Deshabilitar dropzone
    if (this.dropzone) {
      this.dropzone.classList.add('file-upload__dropzone--disabled');
      this.dropzone.setAttribute('tabindex', '-1');
    }

    // Deshabilitar controles específicos de operaciones
    if (this.pageRanges) {
      this.pageRanges.disabled = true;
    }
    if (this.pageSelection) {
      this.pageSelection.disabled = true;
    }
    if (this.rotationAngle) {
      this.rotationAngle.disabled = true;
    }
  }

  /**
   * Formatea el tamaño de archivo en formato legible
   * @private
   * @param {number} bytes - Tamaño en bytes
   * @returns {string} Tamaño formateado (ej: "2.3 MB")
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   * @private
   * @param {string} text - Texto a escapar
   * @returns {string} Texto escapado
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
