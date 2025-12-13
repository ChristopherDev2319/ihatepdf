/**
 * FileManager - Gestiona la carga, validación y descarga de archivos
 */
export class FileManager {
  constructor() {
    // Rastrear URLs temporales para limpieza
    this.temporaryURLs = new Set();
  }

  /**
   * Registra una URL temporal para limpieza posterior
   * @param {string} url - URL temporal a registrar
   */
  registerTemporaryURL(url) {
    this.temporaryURLs.add(url);
  }

  /**
   * Limpia todas las URLs temporales registradas
   */
  cleanupTemporaryURLs() {
    for (const url of this.temporaryURLs) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        // Ignorar silenciosamente errores durante la limpieza
        console.warn('Error al revocar URL:', url, error);
      }
    }
    this.temporaryURLs.clear();
  }
  /**
   * Carga archivos desde un FileList
   * @param {FileList} files - Lista de archivos a cargar
   * @returns {Promise<File[]>} - Array de archivos cargados
   */
  async loadFiles(files) {
    if (!files || files.length === 0) {
      throw new Error('No se proporcionaron archivos');
    }
    
    return Array.from(files);
  }

  /**
   * Valida si un archivo es un PDF válido
   * @param {File} file - Archivo a validar
   * @returns {boolean} - true si es un PDF válido
   */
  validatePDFFile(file) {
    if (!file) {
      return false;
    }

    // Verificar extensión
    const hasValidExtension = file.name.toLowerCase().endsWith('.pdf');
    
    // Verificar tipo MIME
    const hasValidMimeType = file.type === 'application/pdf';
    
    return hasValidExtension && hasValidMimeType;
  }

  /**
   * Valida si un archivo es un JPG válido
   * @param {File} file - Archivo a validar
   * @returns {boolean} - true si es un JPG válido
   */
  validateJPGFile(file) {
    if (!file) {
      return false;
    }

    // Verificar extensión
    const fileName = file.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    
    // Verificar tipo MIME
    const hasValidMimeType = file.type === 'image/jpeg';
    
    return hasValidExtension && hasValidMimeType;
  }

  /**
   * Valida si un archivo es un PNG válido
   * @param {File} file - Archivo a validar
   * @returns {boolean} - true si es un PNG válido
   */
  validatePNGFile(file) {
    if (!file) {
      return false;
    }

    // Verificar extensión
    const fileName = file.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.png');
    
    // Verificar tipo MIME
    const hasValidMimeType = file.type === 'image/png';
    
    return hasValidExtension && hasValidMimeType;
  }

  /**
   * Valida si un archivo es una imagen válida (JPG o PNG)
   * @param {File} file - Archivo a validar
   * @returns {boolean} - true si es una imagen válida
   */
  validateImageFile(file) {
    return this.validateJPGFile(file) || this.validatePNGFile(file);
  }

  /**
   * Descarga un archivo al sistema del usuario
   * @param {Blob} blob - Blob del archivo a descargar
   * @param {string} filename - Nombre del archivo
   */
  downloadFile(blob, filename) {
    if (!blob || !filename) {
      throw new Error('Se requieren blob y nombre de archivo');
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Activar descarga
    document.body.appendChild(link);
    link.click();
    
    // Limpiar inmediatamente después de la descarga
    document.body.removeChild(link);
    
    // Usar setTimeout para asegurar que la descarga inicie antes de revocar
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Crea una URL de Blob para un archivo
   * @param {Uint8Array} data - Datos del archivo
   * @param {string} mimeType - Tipo MIME del archivo
   * @returns {string} - URL del Blob
   */
  createBlobURL(data, mimeType) {
    if (!data || !mimeType) {
      throw new Error('Se requieren datos y tipo MIME');
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    // Registrar la URL para limpieza posterior
    this.registerTemporaryURL(url);
    
    return url;
  }
}
