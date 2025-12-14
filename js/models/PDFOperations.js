import { PDFDocument as PDFLibDocument } from 'pdf-lib';

/**
 * PDFOperations - Contiene la lógica de negocio para operaciones con PDF
 */
export class PDFOperations {
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
   * Limpia recursos después de una operación
   * @param {ArrayBuffer[]} arrayBuffers - ArrayBuffers a limpiar
   */
  cleanupArrayBuffers(arrayBuffers) {
    // En JavaScript, no podemos forzar la liberación de memoria directamente,
    // pero podemos eliminar las referencias para permitir que el GC las recoja
    if (arrayBuffers && Array.isArray(arrayBuffers)) {
      arrayBuffers.length = 0;
    }
  }
  /**
   * Combina múltiples archivos PDF en uno solo
   * @param {File[]|Array<{arrayBuffer: ArrayBuffer}>} pdfFiles - Array de archivos PDF a combinar
   * @returns {Promise<Uint8Array>} - PDF combinado como Uint8Array
   */
  async combinePDFs(pdfFiles) {
    if (!pdfFiles || pdfFiles.length < 2) {
      throw new Error('Se requieren al menos dos archivos PDF para combinar');
    }

    const arrayBuffers = [];
    
    try {
      // Crear un nuevo documento PDF
      const mergedPdf = await PDFLibDocument.create();

      // Iterar sobre cada archivo en el orden proporcionado
      for (const file of pdfFiles) {
        // Leer el archivo como ArrayBuffer
        let arrayBuffer;
        if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
          // Es un File object
          arrayBuffer = await file.arrayBuffer();
        } else if (file.arrayBuffer instanceof ArrayBuffer) {
          // Es un objeto con arrayBuffer directo
          arrayBuffer = file.arrayBuffer;
        } else {
          throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
        }
        
        arrayBuffers.push(arrayBuffer);
        
        // Cargar el PDF
        const pdf = await PDFLibDocument.load(arrayBuffer);
        
        // Copiar todas las páginas del PDF al documento combinado
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        // Agregar las páginas copiadas al documento combinado
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      // Guardar y retornar el PDF combinado
      return await mergedPdf.save();
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Divide un archivo PDF en múltiples documentos según rangos de páginas
   * @param {File|{arrayBuffer: ArrayBuffer}} pdfFile - Archivo PDF a dividir
   * @param {Array<{start: number, end: number}>} ranges - Rangos de páginas (1-indexed)
   * @returns {Promise<Uint8Array[]>} - Array de PDFs divididos como Uint8Array
   */
  async splitPDF(pdfFile, ranges) {
    if (!pdfFile) {
      throw new Error('Se requiere un archivo PDF');
    }

    if (!ranges || ranges.length === 0) {
      throw new Error('Se requiere al menos un rango de páginas');
    }

    const arrayBuffers = [];
    
    try {
      // Leer el archivo como ArrayBuffer
      let arrayBuffer;
      if (pdfFile.arrayBuffer && typeof pdfFile.arrayBuffer === 'function') {
        arrayBuffer = await pdfFile.arrayBuffer();
      } else if (pdfFile.arrayBuffer instanceof ArrayBuffer) {
        arrayBuffer = pdfFile.arrayBuffer;
      } else {
        throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
      }

      arrayBuffers.push(arrayBuffer);

      // Cargar el PDF original
      const originalPdf = await PDFLibDocument.load(arrayBuffer);
      const totalPages = originalPdf.getPageCount();

      // Validar rangos
      for (const range of ranges) {
        if (range.start < 1 || range.start > totalPages) {
          throw new Error(`Rango inválido: la página inicial ${range.start} está fuera de límites (1-${totalPages})`);
        }
        if (range.end < 1 || range.end > totalPages) {
          throw new Error(`Rango inválido: la página final ${range.end} está fuera de límites (1-${totalPages})`);
        }
        if (range.start > range.end) {
          throw new Error(`Rango inválido: la página inicial ${range.start} es mayor que la página final ${range.end}`);
        }
      }

      // Crear un PDF separado para cada rango
      const splitPdfs = [];
      for (const range of ranges) {
        const newPdf = await PDFLibDocument.create();
        
        // Copiar las páginas del rango (convertir de 1-indexed a 0-indexed)
        const pageIndices = [];
        for (let i = range.start - 1; i < range.end; i++) {
          pageIndices.push(i);
        }
        
        const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
        copiedPages.forEach((page) => {
          newPdf.addPage(page);
        });

        const pdfBytes = await newPdf.save();
        splitPdfs.push(pdfBytes);
      }

      return splitPdfs;
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Comprime un archivo PDF
   * @param {File|{arrayBuffer: ArrayBuffer}} pdfFile - Archivo PDF a comprimir
   * @returns {Promise<{data: Uint8Array, originalSize: number, compressedSize: number, reductionPercentage: number}>}
   */
  async compressPDF(pdfFile) {
    if (!pdfFile) {
      throw new Error('Se requiere un archivo PDF');
    }

    const arrayBuffers = [];
    
    try {
      // Leer el archivo como ArrayBuffer
      let arrayBuffer;
      if (pdfFile.arrayBuffer && typeof pdfFile.arrayBuffer === 'function') {
        arrayBuffer = await pdfFile.arrayBuffer();
      } else if (pdfFile.arrayBuffer instanceof ArrayBuffer) {
        arrayBuffer = pdfFile.arrayBuffer;
      } else {
        throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
      }

      arrayBuffers.push(arrayBuffer);

      const originalSize = arrayBuffer.byteLength;

      // Cargar el PDF
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);

      // Guardar con opciones de compresión
      // pdf-lib no tiene opciones de compresión explícitas, pero al volver a guardar
      // puede reducir el tamaño eliminando redundancias
      const compressedBytes = await pdfDoc.save();
      const compressedSize = compressedBytes.byteLength;

      // Calcular porcentaje de reducción
      const reductionPercentage = ((originalSize - compressedSize) / originalSize) * 100;

      return {
        data: compressedBytes,
        originalSize,
        compressedSize,
        reductionPercentage: Math.max(0, reductionPercentage) // Asegurar que no sea negativo
      };
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Rota páginas específicas de un PDF
   * @param {File|{arrayBuffer: ArrayBuffer}} pdfFile - Archivo PDF a rotar
   * @param {number[]} pages - Array de números de página a rotar (1-indexed)
   * @param {number} degrees - Ángulo de rotación (90, 180, o 270)
   * @returns {Promise<Uint8Array>} - PDF rotado como Uint8Array
   */
  async rotatePDF(pdfFile, pages, degrees) {
    if (!pdfFile) {
      throw new Error('Se requiere un archivo PDF');
    }

    if (!pages || pages.length === 0) {
      throw new Error('Se debe seleccionar al menos una página para rotar');
    }

    if (![90, 180, 270].includes(degrees)) {
      throw new Error('El ángulo de rotación debe ser 90, 180 o 270 grados');
    }

    const arrayBuffers = [];
    
    try {
      // Leer el archivo como ArrayBuffer
      let arrayBuffer;
      if (pdfFile.arrayBuffer && typeof pdfFile.arrayBuffer === 'function') {
        arrayBuffer = await pdfFile.arrayBuffer();
      } else if (pdfFile.arrayBuffer instanceof ArrayBuffer) {
        arrayBuffer = pdfFile.arrayBuffer;
      } else {
        throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
      }

      arrayBuffers.push(arrayBuffer);

      // Cargar el PDF
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      // Validar páginas
      for (const pageNum of pages) {
        if (pageNum < 1 || pageNum > totalPages) {
          throw new Error(`Número de página inválido: ${pageNum} (debe estar entre 1 y ${totalPages})`);
        }
      }

      // Rotar las páginas seleccionadas
      for (const pageNum of pages) {
        const page = pdfDoc.getPage(pageNum - 1); // Convertir a 0-indexed
        const currentRotation = page.getRotation().angle;
        page.setRotation({ type: 'degrees', angle: (currentRotation + degrees) % 360 });
      }

      // Guardar y retornar el PDF rotado
      return await pdfDoc.save();
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Convierte imágenes JPG a un documento PDF
   * @param {File[]|Array<{arrayBuffer: ArrayBuffer}>} jpgFiles - Array de archivos JPG a convertir
   * @returns {Promise<Uint8Array>} - PDF con las imágenes como Uint8Array
   */
  async convertJPGToPDF(jpgFiles) {
    if (!jpgFiles || jpgFiles.length === 0) {
      throw new Error('Se requiere al menos un archivo JPG');
    }

    const arrayBuffers = [];
    
    try {
      // Crear un nuevo documento PDF
      const pdfDoc = await PDFLibDocument.create();

      // Iterar sobre cada imagen en el orden proporcionado
      for (const file of jpgFiles) {
        // Leer el archivo como ArrayBuffer
        let arrayBuffer;
        if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
          arrayBuffer = await file.arrayBuffer();
        } else if (file.arrayBuffer instanceof ArrayBuffer) {
          arrayBuffer = file.arrayBuffer;
        } else {
          throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
        }

        arrayBuffers.push(arrayBuffer);

        // Convertir ArrayBuffer a Uint8Array
        const imageBytes = new Uint8Array(arrayBuffer);

        // Embeber la imagen JPG en el PDF
        const jpgImage = await pdfDoc.embedJpg(imageBytes);

        // Obtener dimensiones de la imagen
        const { width, height } = jpgImage.scale(1);

        // Crear una página con el tamaño de la imagen
        const page = pdfDoc.addPage([width, height]);

        // Dibujar la imagen en la página
        page.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width,
          height
        });
      }

      // Guardar y retornar el PDF
      return await pdfDoc.save();
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Convierte imágenes PNG a un documento PDF
   * @param {File[]|Array<{arrayBuffer: ArrayBuffer}>} pngFiles - Array de archivos PNG a convertir
   * @returns {Promise<Uint8Array>} - PDF con las imágenes como Uint8Array
   */
  async convertPNGToPDF(pngFiles) {
    if (!pngFiles || pngFiles.length === 0) {
      throw new Error('Se requiere al menos un archivo PNG');
    }

    const arrayBuffers = [];
    
    try {
      // Crear un nuevo documento PDF
      const pdfDoc = await PDFLibDocument.create();

      // Iterar sobre cada imagen en el orden proporcionado
      for (const file of pngFiles) {
        // Leer el archivo como ArrayBuffer
        let arrayBuffer;
        if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
          arrayBuffer = await file.arrayBuffer();
        } else if (file.arrayBuffer instanceof ArrayBuffer) {
          arrayBuffer = file.arrayBuffer;
        } else {
          throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
        }

        arrayBuffers.push(arrayBuffer);

        // Convertir ArrayBuffer a Uint8Array
        const imageBytes = new Uint8Array(arrayBuffer);

        // Embeber la imagen PNG en el PDF
        const pngImage = await pdfDoc.embedPng(imageBytes);

        // Obtener dimensiones de la imagen
        const { width, height } = pngImage.scale(1);

        // Crear una página con el tamaño de la imagen
        const page = pdfDoc.addPage([width, height]);

        // Dibujar la imagen en la página
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width,
          height
        });
      }

      // Guardar y retornar el PDF
      return await pdfDoc.save();
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Convierte imágenes (JPG y PNG) a un documento PDF
   * @param {File[]|Array<{arrayBuffer: ArrayBuffer}>} imageFiles - Array de archivos de imagen a convertir
   * @returns {Promise<Uint8Array>} - PDF con las imágenes como Uint8Array
   */
  async convertImagesToPDF(imageFiles) {
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('Se requiere al menos un archivo de imagen');
    }

    const arrayBuffers = [];
    
    try {
      // Crear un nuevo documento PDF
      const pdfDoc = await PDFLibDocument.create();

      // Iterar sobre cada imagen en el orden proporcionado
      for (const file of imageFiles) {
        // Leer el archivo como ArrayBuffer
        let arrayBuffer;
        if (file.arrayBuffer && typeof file.arrayBuffer === 'function') {
          arrayBuffer = await file.arrayBuffer();
        } else if (file.arrayBuffer instanceof ArrayBuffer) {
          arrayBuffer = file.arrayBuffer;
        } else {
          throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
        }

        arrayBuffers.push(arrayBuffer);

        // Convertir ArrayBuffer a Uint8Array
        const imageBytes = new Uint8Array(arrayBuffer);

        // Determinar tipo de imagen por el nombre del archivo o contenido
        let image;
        const fileName = file.name ? file.name.toLowerCase() : '';
        
        if (fileName.endsWith('.png') || this._isPNG(imageBytes)) {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || this._isJPEG(imageBytes)) {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          throw new Error(`Formato de imagen no soportado: ${fileName}. Solo se admiten JPG y PNG.`);
        }

        // Obtener dimensiones de la imagen
        const { width, height } = image.scale(1);

        // Crear una página con el tamaño de la imagen
        const page = pdfDoc.addPage([width, height]);

        // Dibujar la imagen en la página
        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height
        });
      }

      // Guardar y retornar el PDF
      return await pdfDoc.save();
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Agrega números de página a un PDF
   * @param {File|{arrayBuffer: ArrayBuffer}} pdfFile - Archivo PDF
   * @param {Object} options - Opciones de numeración
   * @param {string} options.position - Posición ('bottom-right', 'bottom-left', 'bottom-center', 'top-right', 'top-left', 'top-center')
   * @param {number} options.fontSize - Tamaño de fuente (default: 12)
   * @param {number} options.startPage - Página inicial para numerar (default: 1)
   * @param {string} options.format - Formato del número ('number', 'page-of-total') (default: 'number')
   * @returns {Promise<Uint8Array>} - PDF con números de página como Uint8Array
   */
  async addPageNumbers(pdfFile, options = {}) {
    if (!pdfFile) {
      throw new Error('Se requiere un archivo PDF');
    }

    const {
      position = 'bottom-right',
      fontSize = 12,
      startPage = 1,
      format = 'number'
    } = options;

    const arrayBuffers = [];
    
    try {
      // Leer el archivo como ArrayBuffer
      let arrayBuffer;
      if (pdfFile.arrayBuffer && typeof pdfFile.arrayBuffer === 'function') {
        arrayBuffer = await pdfFile.arrayBuffer();
      } else if (pdfFile.arrayBuffer instanceof ArrayBuffer) {
        arrayBuffer = pdfFile.arrayBuffer;
      } else {
        throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
      }

      arrayBuffers.push(arrayBuffer);

      // Cargar el PDF
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      // Iterar sobre cada página
      pages.forEach((page, index) => {
        const pageNumber = index + 1;
        
        // Solo numerar desde la página de inicio especificada
        if (pageNumber < startPage) return;

        // Generar texto del número de página
        let pageText;
        if (format === 'page-of-total') {
          pageText = `${pageNumber} de ${totalPages}`;
        } else {
          pageText = `${pageNumber}`;
        }

        // Calcular posición
        const { width, height } = page.getSize();
        let x, y;

        switch (position) {
          case 'bottom-left':
            x = 30;
            y = 30;
            break;
          case 'bottom-center':
            x = width / 2 - (pageText.length * fontSize) / 4;
            y = 30;
            break;
          case 'bottom-right':
            x = width - 30 - (pageText.length * fontSize) / 2;
            y = 30;
            break;
          case 'top-left':
            x = 30;
            y = height - 30;
            break;
          case 'top-center':
            x = width / 2 - (pageText.length * fontSize) / 4;
            y = height - 30;
            break;
          case 'top-right':
            x = width - 30 - (pageText.length * fontSize) / 2;
            y = height - 30;
            break;
          default:
            x = width - 30 - (pageText.length * fontSize) / 2;
            y = 30;
        }

        // Dibujar el número de página
        page.drawText(pageText, {
          x,
          y,
          size: fontSize,
          opacity: 0.7
        });
      });

      // Guardar y retornar el PDF
      return await pdfDoc.save();
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Agrega una marca de agua a un PDF
   * @param {File|{arrayBuffer: ArrayBuffer}} pdfFile - Archivo PDF
   * @param {string} watermarkText - Texto de la marca de agua
   * @param {Object} options - Opciones de la marca de agua
   * @param {number} options.opacity - Opacidad (0-1) (default: 0.3)
   * @param {number} options.fontSize - Tamaño de fuente (default: 50)
   * @param {number} options.rotation - Rotación en grados (default: 45)
   * @param {string} options.color - Color en formato RGB hex (default: '#000000')
   * @param {string} options.position - Posición ('center', 'diagonal') (default: 'diagonal')
   * @returns {Promise<Uint8Array>} - PDF con marca de agua como Uint8Array
   */
  async addWatermark(pdfFile, watermarkText, options = {}) {
    if (!pdfFile) {
      throw new Error('Se requiere un archivo PDF');
    }

    if (!watermarkText || watermarkText.trim() === '') {
      throw new Error('Se requiere texto para la marca de agua');
    }

    const {
      opacity = 0.3,
      fontSize = 50,
      rotation = 45,
      color = '#000000',
      position = 'diagonal'
    } = options;

    const arrayBuffers = [];
    
    try {
      // Leer el archivo como ArrayBuffer
      let arrayBuffer;
      if (pdfFile.arrayBuffer && typeof pdfFile.arrayBuffer === 'function') {
        arrayBuffer = await pdfFile.arrayBuffer();
      } else if (pdfFile.arrayBuffer instanceof ArrayBuffer) {
        arrayBuffer = pdfFile.arrayBuffer;
      } else {
        throw new Error('Formato de archivo inválido: debe ser File u objeto con propiedad arrayBuffer');
      }

      arrayBuffers.push(arrayBuffer);

      // Cargar el PDF
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Convertir color hex a RGB
      const rgb = this._hexToRgb(color);

      // Iterar sobre cada página
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        
        let x, y, rotate;

        if (position === 'center') {
          // Centrado sin rotación
          x = width / 2 - (watermarkText.length * fontSize) / 4;
          y = height / 2;
          rotate = 0;
        } else {
          // Diagonal (default)
          x = width / 2 - (watermarkText.length * fontSize) / 4;
          y = height / 2;
          rotate = rotation;
        }

        // Dibujar la marca de agua
        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          opacity,
          rotate: { type: 'degrees', angle: rotate },
          color: { type: 'RGB', red: rgb.r / 255, green: rgb.g / 255, blue: rgb.b / 255 }
        });
      });

      // Guardar y retornar el PDF
      return await pdfDoc.save();
    } finally {
      // Limpiar ArrayBuffers después de la operación
      this.cleanupArrayBuffers(arrayBuffers);
    }
  }

  /**
   * Detecta si los bytes corresponden a una imagen PNG
   * @private
   */
  _isPNG(bytes) {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    return bytes.length >= 8 &&
           bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
           bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
  }

  /**
   * Detecta si los bytes corresponden a una imagen JPEG
   * @private
   */
  _isJPEG(bytes) {
    // JPEG signature: FF D8 FF
    return bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }

  /**
   * Convierte color hexadecimal a RGB
   * @private
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
