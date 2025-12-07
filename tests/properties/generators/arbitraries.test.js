import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import {
  arbitraryPDFFile,
  arbitraryJPGFile,
  arbitraryPageRange,
  arbitraryPageSelection,
  arbitraryRotationAngle
} from './arbitraries.js';

describe('Generator Tests - arbitraries.js', () => {
  describe('arbitraryPDFFile', () => {
    test('generates valid PDF files that can be loaded', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryPDFFile(), async (pdfPromise) => {
          const { arrayBuffer, pageCount } = await pdfPromise;

          // Verificar que el arrayBuffer es válido
          expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
          expect(arrayBuffer.byteLength).toBeGreaterThan(0);

          // Verificar que el pageCount es un número positivo
          expect(pageCount).toBeGreaterThan(0);
          expect(Number.isInteger(pageCount)).toBe(true);

          // Verificar que el PDF puede ser cargado por pdf-lib
          const pdfDoc = await PDFLibDocument.load(arrayBuffer);
          expect(pdfDoc).toBeDefined();

          // Verificar que el conteo de páginas coincide
          expect(pdfDoc.getPageCount()).toBe(pageCount);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('arbitraryJPGFile', () => {
    test('generates valid JPG files with correct structure', async () => {
      await fc.assert(
        fc.property(arbitraryJPGFile(), (jpgData) => {
          const { arrayBuffer } = jpgData;

          // Verificar que el arrayBuffer es válido
          expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
          expect(arrayBuffer.byteLength).toBeGreaterThan(0);

          // Verificar que comienza con los bytes mágicos de JPG (FF D8 FF)
          const bytes = new Uint8Array(arrayBuffer);
          expect(bytes[0]).toBe(0xFF);
          expect(bytes[1]).toBe(0xD8);
          expect(bytes[2]).toBe(0xFF);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('arbitraryPageRange', () => {
    test('generates valid page ranges within bounds', () => {
      // Test with a fixed maxPages value
      const maxPages = 20;
      
      fc.assert(
        fc.property(arbitraryPageRange(maxPages), (range) => {
          // Verificar que start y end son números enteros positivos
          expect(Number.isInteger(range.start)).toBe(true);
          expect(Number.isInteger(range.end)).toBe(true);
          expect(range.start).toBeGreaterThan(0);
          expect(range.end).toBeGreaterThan(0);

          // Verificar que start <= end
          expect(range.start).toBeLessThanOrEqual(range.end);

          // Verificar que están dentro de los límites
          expect(range.start).toBeLessThanOrEqual(maxPages);
          expect(range.end).toBeLessThanOrEqual(maxPages);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('arbitraryPageSelection', () => {
    test('generates valid page selections without duplicates', () => {
      // Test with a fixed maxPages value
      const maxPages = 30;
      
      fc.assert(
        fc.property(arbitraryPageSelection(maxPages), (selection) => {
          // Verificar que es un array
          expect(Array.isArray(selection)).toBe(true);
          expect(selection.length).toBeGreaterThan(0);

          // Verificar que no hay duplicados
          const uniquePages = new Set(selection);
          expect(uniquePages.size).toBe(selection.length);

          // Verificar que todas las páginas están dentro de los límites
          for (const page of selection) {
            expect(Number.isInteger(page)).toBe(true);
            expect(page).toBeGreaterThan(0);
            expect(page).toBeLessThanOrEqual(maxPages);
          }

          // Verificar que está ordenado
          for (let i = 1; i < selection.length; i++) {
            expect(selection[i]).toBeGreaterThan(selection[i - 1]);
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('arbitraryRotationAngle', () => {
    test('generates only valid rotation angles (90, 180, 270)', () => {
      fc.assert(
        fc.property(arbitraryRotationAngle(), (angle) => {
          // Verificar que el ángulo es uno de los valores válidos
          expect([90, 180, 270]).toContain(angle);
        }),
        { numRuns: 50 }
      );
    });
  });
});
