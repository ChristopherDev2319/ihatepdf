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
}
