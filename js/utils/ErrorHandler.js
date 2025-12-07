/**
 * ErrorHandler - Maneja la clasificación y generación de mensajes de error
 * 
 * Proporciona métodos para clasificar errores en categorías y generar
 * mensajes descriptivos apropiados para mostrar al usuario.
 */
export class ErrorHandler {
  /**
   * Tipos de error soportados
   */
  static ErrorTypes = {
    VALIDATION: 'validation',
    PROCESSING: 'processing',
    SYSTEM: 'system',
    UNKNOWN: 'unknown'
  };

  /**
   * Maneja un error y retorna un resultado estructurado
   * @param {Error} error - El error a manejar
   * @param {string} context - Contexto donde ocurrió el error (ej: 'combine', 'split')
   * @returns {{type: string, message: string, originalError: Error}}
   */
  static handle(error, context = '') {
    const errorType = this.classifyError(error);
    const message = this.generateMessage(error, errorType, context);

    // Log para debugging (en producción esto podría ir a un servicio de logging)
    console.error(`[${errorType.toUpperCase()}] ${context}:`, error);

    return {
      type: errorType,
      message: message,
      originalError: error
    };
  }

  /**
   * Clasifica un error en una categoría
   * @param {Error} error - El error a clasificar
   * @returns {string} - Tipo de error (validation, processing, system, unknown)
   */
  static classifyError(error) {
    if (!error) {
      return this.ErrorTypes.UNKNOWN;
    }

    const errorMessage = error.message || '';

    // Errores de validación
    if (this.isValidationError(error)) {
      return this.ErrorTypes.VALIDATION;
    }

    // Errores de procesamiento
    if (this.isProcessingError(error)) {
      return this.ErrorTypes.PROCESSING;
    }

    // Errores de sistema
    if (this.isSystemError(error)) {
      return this.ErrorTypes.SYSTEM;
    }

    return this.ErrorTypes.UNKNOWN;
  }

  /**
   * Determina si un error es de validación
   * @param {Error} error - El error a verificar
   * @returns {boolean}
   */
  static isValidationError(error) {
    if (!error || !error.message) {
      return false;
    }

    const validationPatterns = [
      /at least.*required/i,
      /invalid.*file/i,
      /not.*valid/i,
      /must be/i,
      /invalid range/i,
      /out of bounds/i,
      /greater than/i,
      /no files provided/i,
      /invalid page/i,
      /must be selected/i,
      /not.*pdf/i,
      /not.*jpg/i,
      /invalid format/i
    ];

    return validationPatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Determina si un error es de procesamiento
   * @param {Error} error - El error a verificar
   * @returns {boolean}
   */
  static isProcessingError(error) {
    if (!error || !error.message) {
      return false;
    }

    const processingPatterns = [
      /failed to.*load/i,
      /failed to.*parse/i,
      /failed to.*save/i,
      /corrupt/i,
      /damaged/i,
      /cannot.*process/i,
      /error.*processing/i,
      /unable to/i,
      /could not/i
    ];

    return processingPatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Determina si un error es de sistema
   * @param {Error} error - El error a verificar
   * @returns {boolean}
   */
  static isSystemError(error) {
    if (!error) {
      return false;
    }

    // Errores de sistema comunes
    const systemErrorTypes = [
      'OutOfMemoryError',
      'QuotaExceededError',
      'NotSupportedError',
      'SecurityError'
    ];

    if (systemErrorTypes.includes(error.name)) {
      return true;
    }

    if (!error.message) {
      return false;
    }

    const systemPatterns = [
      /out of memory/i,
      /quota exceeded/i,
      /not supported/i,
      /browser.*not support/i,
      /insufficient memory/i
    ];

    return systemPatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Genera un mensaje descriptivo para el usuario
   * @param {Error} error - El error original
   * @param {string} errorType - Tipo de error clasificado
   * @param {string} context - Contexto de la operación
   * @returns {string} - Mensaje descriptivo para el usuario
   */
  static generateMessage(error, errorType, context = '') {
    const errorMessage = error?.message || 'Error desconocido';

    switch (errorType) {
      case this.ErrorTypes.VALIDATION:
        return this._generateValidationMessage(errorMessage, context);

      case this.ErrorTypes.PROCESSING:
        return this._generateProcessingMessage(errorMessage, context);

      case this.ErrorTypes.SYSTEM:
        return this._generateSystemMessage(errorMessage, context);

      case this.ErrorTypes.UNKNOWN:
      default:
        return this._generateUnknownMessage(errorMessage, context);
    }
  }

  /**
   * Genera mensaje para errores de validación
   * @private
   */
  static _generateValidationMessage(errorMessage, context) {
    // Mensajes específicos basados en patrones comunes
    if (/at least.*two.*required/i.test(errorMessage)) {
      return 'Debes seleccionar al menos 2 archivos PDF para combinar.';
    }

    if (/at least.*one.*required|at least.*one.*must be selected/i.test(errorMessage)) {
      if (context.includes('split')) {
        return 'Debes especificar al menos un rango de páginas para dividir.';
      }
      if (context.includes('rotate')) {
        return 'Debes seleccionar al menos una página para rotar.';
      }
      if (context.includes('jpg') || context.includes('convert')) {
        return 'Debes seleccionar al menos una imagen JPG para convertir.';
      }
      return 'Debes seleccionar al menos un archivo.';
    }

    if (/invalid range/i.test(errorMessage)) {
      return `Rango de páginas inválido: ${errorMessage}. Verifica que los números de página sean correctos.`;
    }

    if (/invalid page/i.test(errorMessage)) {
      return `Número de página inválido: ${errorMessage}. Verifica que la página exista en el documento.`;
    }

    if (/not.*valid|invalid.*file/i.test(errorMessage)) {
      return `Archivo inválido: ${errorMessage}. Asegúrate de seleccionar archivos del tipo correcto.`;
    }

    if (/rotation angle must be/i.test(errorMessage)) {
      return 'El ángulo de rotación debe ser 90, 180 o 270 grados.';
    }

    // Mensaje genérico de validación
    return `Error de validación: ${errorMessage}`;
  }

  /**
   * Genera mensaje para errores de procesamiento
   * @private
   */
  static _generateProcessingMessage(errorMessage, context) {
    if (/corrupt|damaged/i.test(errorMessage)) {
      return 'El archivo PDF está corrupto o dañado. Intenta con otro archivo.';
    }

    if (/failed to.*load|cannot.*load/i.test(errorMessage)) {
      return 'No se pudo cargar el archivo PDF. Verifica que el archivo sea válido.';
    }

    if (/failed to.*save|cannot.*save/i.test(errorMessage)) {
      return 'No se pudo guardar el archivo resultante. Intenta nuevamente.';
    }

    // Mensaje genérico de procesamiento
    const operation = this._getOperationName(context);
    return `Error al ${operation} el PDF: ${errorMessage}. Por favor, intenta nuevamente.`;
  }

  /**
   * Genera mensaje para errores de sistema
   * @private
   */
  static _generateSystemMessage(errorMessage, context) {
    if (/out of memory|insufficient memory/i.test(errorMessage)) {
      return 'Memoria insuficiente para procesar el archivo. Intenta con un archivo más pequeño o cierra otras pestañas del navegador.';
    }

    if (/quota exceeded/i.test(errorMessage)) {
      return 'Se ha excedido el límite de almacenamiento. Libera espacio e intenta nuevamente.';
    }

    if (/not supported|browser.*not support/i.test(errorMessage)) {
      return 'Tu navegador no soporta esta operación. Intenta con un navegador más reciente (Chrome, Firefox, Safari, Edge).';
    }

    // Mensaje genérico de sistema
    return `Error del sistema: ${errorMessage}. Intenta recargar la página o usar otro navegador.`;
  }

  /**
   * Genera mensaje para errores desconocidos
   * @private
   */
  static _generateUnknownMessage(errorMessage, context) {
    const operation = this._getOperationName(context);
    return `Ocurrió un error inesperado al ${operation}: ${errorMessage}. Por favor, intenta nuevamente.`;
  }

  /**
   * Obtiene el nombre de la operación en español
   * @private
   */
  static _getOperationName(context) {
    const contextLower = context.toLowerCase();

    if (contextLower.includes('combine') || contextLower.includes('combinar')) {
      return 'combinar los PDFs';
    }
    if (contextLower.includes('split') || contextLower.includes('dividir')) {
      return 'dividir el PDF';
    }
    if (contextLower.includes('compress') || contextLower.includes('comprimir')) {
      return 'comprimir el PDF';
    }
    if (contextLower.includes('rotate') || contextLower.includes('rotar')) {
      return 'rotar el PDF';
    }
    if (contextLower.includes('convert') || contextLower.includes('jpg') || contextLower.includes('convertir')) {
      return 'convertir las imágenes';
    }

    return 'procesar el archivo';
  }
}
