import { PDFDocument as PDFLibDocument } from 'pdf-lib';

/**
 * PDFDocument - Wrapper alrededor de pdf-lib para simplificar operaciones con PDF
 */
export class PDFDocument {
  /**
   * @param {ArrayBuffer} arrayBuffer - Buffer del archivo PDF
   */
  constructor(arrayBuffer) {
    if (!arrayBuffer) {
      throw new Error('Se requiere ArrayBuffer');
    }
    this.arrayBuffer = arrayBuffer;
    this.pdfDoc = null;
  }

  /**
   * Carga el documento PDF usando pdf-lib
   * @returns {Promise<PDFLibDocument>} - Documento PDF cargado
   */
  async load() {
    if (!this.pdfDoc) {
      this.pdfDoc = await PDFLibDocument.load(this.arrayBuffer);
    }
    return this.pdfDoc;
  }

  /**
   * Guarda el documento PDF como Uint8Array
   * @returns {Promise<Uint8Array>} - Datos del PDF guardado
   */
  async save() {
    if (!this.pdfDoc) {
      await this.load();
    }
    return await this.pdfDoc.save();
  }

  /**
   * Obtiene el número de páginas del documento
   * @returns {number} - Número de páginas
   */
  getPageCount() {
    if (!this.pdfDoc) {
      throw new Error('Documento PDF no cargado. Llama a load() primero.');
    }
    return this.pdfDoc.getPageCount();
  }

  /**
   * Obtiene el tamaño del archivo en bytes
   * @returns {number} - Tamaño del archivo en bytes
   */
  getFileSize() {
    return this.arrayBuffer.byteLength;
  }
}
