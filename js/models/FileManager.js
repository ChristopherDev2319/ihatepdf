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

  /**
   * Genera un nombre de archivo por defecto basado en la operación
   * @param {string} operation - Tipo de operación (combine, split, compress, rotate, convert)
   * @param {string} originalFilename - Nombre del archivo original (opcional)
   * @returns {string} - Nombre de archivo por defecto
   */
  generateDefaultFilename(operation, originalFilename = null) {
    if (!operation) {
      throw new Error('Se requiere especificar la operación');
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    let baseName = '';

    if (originalFilename) {
      // Remover extensión del archivo original
      baseName = originalFilename.replace(/\.[^/.]+$/, '');
    } else {
      baseName = 'documento';
    }

    switch (operation.toLowerCase()) {
      case 'combine':
        return `${baseName}_combinado_${timestamp}.pdf`;
      case 'split':
        return `${baseName}_dividido_${timestamp}.pdf`;
      case 'compress':
        return `${baseName}_comprimido_${timestamp}.pdf`;
      case 'rotate':
        return `${baseName}_rotado_${timestamp}.pdf`;
      case 'convert':
        return `${baseName}_convertido_${timestamp}.pdf`;
      default:
        return `${baseName}_procesado_${timestamp}.pdf`;
    }
  }

  /**
   * Verifica si el navegador soporta File System Access API
   * @returns {boolean} - true si soporta la API
   */
  supportsFileSystemAccess() {
    // Verificación básica
    if ('showSaveFilePicker' in window) {
      return true;
    }
    
    // Detección especial para Brave Browser
    // Brave puede no reportar la API correctamente pero sí la soporta
    const userAgent = navigator.userAgent;
    const isBrave = navigator.brave !== undefined;
    const isChromiumBased = /Chrome/.test(userAgent);
    
    if (isBrave && isChromiumBased) {
      // Extraer versión de Chrome para Brave
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;
      
      // Brave basado en Chrome 86+ soporta la API
      return chromeVersion >= 86;
    }
    
    return false;
  }

  /**
   * Detecta si el usuario está en un dispositivo móvil
   * @returns {boolean} - true si está en móvil
   */
  isMobileDevice() {
    // Verificar por user agent (más específico)
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    
    // Si el user agent indica móvil, es móvil
    if (mobileRegex.test(userAgent)) {
      return true;
    }
    
    // Para desktop con touch (como laptops con pantalla táctil), ser más conservador
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const isVerySmallScreen = window.innerWidth <= 480;
    
    // Solo considerar móvil si es pantalla muy pequeña Y tiene touch
    // O si es pantalla pequeña Y no hay mouse disponible
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    
    return (isVerySmallScreen && hasTouchScreen) || (isSmallScreen && hasCoarsePointer);
  }

  /**
   * Detecta el tipo de navegador
   * @returns {Object} - Información del navegador
   */
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor || '';
    
    // Detectar navegadores específicos (orden importante)
    const isBrave = /Brave/.test(userAgent) || navigator.brave !== undefined;
    const isEdge = /Edg/.test(userAgent);
    const isOpera = /OPR/.test(userAgent) || /Opera/.test(userAgent);
    const isVivaldi = /Vivaldi/.test(userAgent);
    const isYandex = /YaBrowser/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !isEdge && !isOpera && !isBrave && !isVivaldi && !isYandex;
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(vendor) && !isChrome && !isEdge;
    
    // Detectar si es basado en Chromium (incluye Chrome, Brave, Edge, Opera, Vivaldi, Yandex)
    const isChromiumBased = /Chrome/.test(userAgent) || isEdge || isBrave || isVivaldi || isYandex;
    
    // Detectar versiones
    let version = 'unknown';
    let chromeVersion = 'unknown';
    
    if (isChromiumBased) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 'unknown';
      version = chromeVersion;
    }
    
    if (isEdge) {
      const edgeMatch = userAgent.match(/Edg\/(\d+)/);
      version = edgeMatch ? parseInt(edgeMatch[1]) : chromeVersion;
    } else if (isFirefox) {
      const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
      version = firefoxMatch ? parseInt(firefoxMatch[1]) : 'unknown';
    } else if (isSafari) {
      const safariMatch = userAgent.match(/Version\/(\d+)/);
      version = safariMatch ? parseInt(safariMatch[1]) : 'unknown';
    } else if (isOpera) {
      const operaMatch = userAgent.match(/OPR\/(\d+)/);
      version = operaMatch ? parseInt(operaMatch[1]) : chromeVersion;
    }
    
    return {
      isChrome,
      isEdge,
      isFirefox,
      isSafari,
      isOpera,
      isBrave,
      isVivaldi,
      isYandex,
      isChromiumBased,
      version,
      chromeVersion, // Versión del motor Chrome para navegadores basados en Chromium
      supportsFileSystemAccess: this.supportsFileSystemAccess(),
      isMobile: this.isMobileDevice(),
      isSecureContext: window.isSecureContext
    };
  }

  /**
   * Obtiene una explicación de por qué la File System Access API no está disponible
   * @returns {string} - Razón por la que no está disponible
   */
  getFileSystemAccessUnavailableReason() {
    const browserInfo = this.getBrowserInfo();
    const supportsAPI = this.supportsFileSystemAccess();
    
    // Debug: Si la API está disponible pero aún se llama este método, hay un problema
    if (supportsAPI) {
      return `DEBUG: La API está disponible ('showSaveFilePicker' in window = true) pero se está mostrando como no soportada. Navegador: ${browserInfo.isBrave ? 'Brave' : browserInfo.isChrome ? 'Chrome' : 'Otro'}, Móvil: ${browserInfo.isMobile}, Contexto seguro: ${browserInfo.isSecureContext}`;
    }
    
    if (!browserInfo.isSecureContext) {
      return 'La página debe servirse por HTTPS para usar la selección de ubicación personalizada.';
    }
    
    if (browserInfo.isMobile) {
      return `Los dispositivos móviles no soportan selección de ubicación personalizada. (Pantalla: ${window.innerWidth}px, Touch: ${'ontouchstart' in window}, MaxTouchPoints: ${navigator.maxTouchPoints})`;
    }
    
    if (browserInfo.isFirefox) {
      return 'Firefox no soporta selección de ubicación personalizada. El archivo se descargará automáticamente.';
    }
    
    if (browserInfo.isSafari) {
      return 'Safari no soporta selección de ubicación personalizada. El archivo se descargará automáticamente.';
    }
    
    // Brave Browser - no debería llegar aquí si la detección es correcta
    if (browserInfo.isBrave && !supportsAPI) {
      return 'Brave Browser: Funcionalidad de selección de ubicación no disponible en este contexto.';
    }
    
    // Para navegadores basados en Chromium, verificar la versión del motor Chrome
    if (browserInfo.isChromiumBased && browserInfo.chromeVersion < 86) {
      const browserName = browserInfo.isBrave ? 'Brave' : 
                         browserInfo.isEdge ? 'Edge' : 
                         browserInfo.isOpera ? 'Opera' :
                         browserInfo.isVivaldi ? 'Vivaldi' :
                         browserInfo.isYandex ? 'Yandex Browser' : 'Chrome';
      return `Tu versión de ${browserName} es muy antigua. Necesitas una versión basada en Chrome 86+ para seleccionar ubicación personalizada. (Versión Chrome: ${browserInfo.chromeVersion})`;
    }
    
    return `Tu navegador no soporta selección de ubicación personalizada. El archivo se descargará automáticamente. (showSaveFilePicker disponible: ${supportsAPI})`;
  }

  /**
   * Descarga un archivo con ubicación personalizada usando File System Access API
   * @param {Blob} blob - Blob del archivo a descargar
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<void>}
   */
  async downloadFileWithCustomLocation(blob, filename) {
    if (!blob || !filename) {
      throw new Error('Se requieren blob y nombre de archivo');
    }

    // Verificar soporte de File System Access API
    if (!this.supportsFileSystemAccess()) {
      // Fallback a descarga normal
      this.downloadFile(blob, filename);
      return;
    }

    try {
      // Usar File System Access API para permitir al usuario elegir ubicación
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Archivos PDF',
            accept: {
              'application/pdf': ['.pdf'],
            },
          },
        ],
      });

      // Escribir el archivo en la ubicación seleccionada
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      // Si el usuario cancela o hay error, usar fallback
      if (error.name === 'AbortError') {
        // Usuario canceló, no hacer nada
        return;
      }
      
      // Para otros errores, usar descarga normal como fallback
      console.warn('Error con File System Access API, usando descarga normal:', error);
      this.downloadFile(blob, filename);
    }
  }
}
