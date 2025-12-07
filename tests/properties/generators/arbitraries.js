import * as fc from 'fast-check';
import { PDFDocument } from 'pdf-lib';

/**
 * Genera un archivo PDF válido con un número aleatorio de páginas
 * @returns {fc.Arbitrary<Promise<{arrayBuffer: ArrayBuffer, pageCount: number}>>}
 */
export function arbitraryPDFFile() {
  return fc.integer({ min: 1, max: 10 }).map(async (pageCount) => {
    // Crear un PDF con el número especificado de páginas
    const pdfDoc = await PDFDocument.create();
    
    for (let i = 0; i < pageCount; i++) {
      pdfDoc.addPage([600, 800]);
    }
    
    const pdfBytes = await pdfDoc.save();
    const arrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );
    
    return { arrayBuffer, pageCount };
  });
}

/**
 * Genera un archivo JPG válido
 * @returns {fc.Arbitrary<{arrayBuffer: ArrayBuffer}>}
 */
export function arbitraryJPGFile() {
  return fc.integer({ min: 50, max: 200 }).map((size) => {
    // Crear una imagen JPG mínima válida (1x1 pixel)
    // Este es un JPG válido de 1x1 pixel en formato base64
    const base64Jpg = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
    
    // Convertir base64 a ArrayBuffer
    const binaryString = atob(base64Jpg);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return {
      arrayBuffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    };
  });
}

/**
 * Genera un rango de páginas válido
 * @param {number} maxPages - Número máximo de páginas
 * @returns {fc.Arbitrary<{start: number, end: number}>}
 */
export function arbitraryPageRange(maxPages) {
  return fc.integer({ min: 1, max: maxPages }).chain((start) => {
    return fc.integer({ min: start, max: maxPages }).map((end) => ({
      start,
      end
    }));
  });
}

/**
 * Genera una selección de páginas válida
 * @param {number} maxPages - Número máximo de páginas
 * @returns {fc.Arbitrary<number[]>}
 */
export function arbitraryPageSelection(maxPages) {
  return fc.array(
    fc.integer({ min: 1, max: maxPages }),
    { minLength: 1, maxLength: maxPages }
  ).map((pages) => [...new Set(pages)].sort((a, b) => a - b));
}

/**
 * Genera un ángulo de rotación válido (90, 180, 270)
 * @returns {fc.Arbitrary<number>}
 */
export function arbitraryRotationAngle() {
  return fc.constantFrom(90, 180, 270);
}
