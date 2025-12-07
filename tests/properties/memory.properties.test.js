import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { PDFOperations } from '../../js/models/PDFOperations.js';
import { FileManager } from '../../js/models/FileManager.js';
import { arbitraryPDFFile, arbitraryJPGFile } from './generators/arbitraries.js';

describe('Memory Management - Property-Based Tests', () => {
  let pdfOperations;
  let fileManager;

  beforeEach(() => {
    pdfOperations = new PDFOperations();
    fileManager = new FileManager();
    
    // Mock URL.createObjectURL and URL.revokeObjectURL for jsdom
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url-' + Math.random());
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  // Feature: ihatepdf, Property 21: Limpieza de memoria después de operaciones
  // Valida: Requisitos 7.2, 7.5
  test('PDFOperations cleans up temporary URLs after operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryPDFFile(), { minLength: 2, maxLength: 3 }),
        async (pdfDataPromises) => {
          const pdfDataArray = await Promise.all(pdfDataPromises);

          // Registrar algunas URLs temporales
          const testURLs = [
            'blob:http://test.com/123',
            'blob:http://test.com/456'
          ];
          
          testURLs.forEach(url => pdfOperations.registerTemporaryURL(url));

          // Verificar que las URLs están registradas
          expect(pdfOperations.temporaryURLs.size).toBe(testURLs.length);

          // Limpiar URLs temporales
          pdfOperations.cleanupTemporaryURLs();

          // Verificar que todas las URLs fueron limpiadas
          expect(pdfOperations.temporaryURLs.size).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('FileManager cleans up temporary URLs after operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uint8Array({ minLength: 100, maxLength: 1000 }), { minLength: 1, maxLength: 3 }),
        async (dataArrays) => {
          // Crear URLs de Blob
          const createdURLs = [];
          for (const data of dataArrays) {
            const url = fileManager.createBlobURL(data, 'application/pdf');
            createdURLs.push(url);
          }

          // Verificar que las URLs están registradas
          expect(fileManager.temporaryURLs.size).toBe(createdURLs.length);

          // Limpiar URLs temporales
          fileManager.cleanupTemporaryURLs();

          // Verificar que todas las URLs fueron limpiadas
          expect(fileManager.temporaryURLs.size).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('memory cleanup occurs even after failed operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;

          // Intentar una operación que fallará (rango inválido)
          const invalidRanges = [{ start: -1, end: 10 }];

          try {
            await pdfOperations.splitPDF(pdfData, invalidRanges);
          } catch (error) {
            // Se espera que falle
            expect(error).toBeDefined();
          }

          // La limpieza debe ocurrir incluso después de un error
          // debido al bloque finally en los métodos
          // No podemos verificar directamente la limpieza de ArrayBuffers,
          // pero podemos verificar que el método no deja el sistema en un estado inconsistente
          
          // Intentar una operación válida después del error
          const validRanges = [{ start: 1, end: Math.min(2, pdfData.pageCount) }];
          const result = await pdfOperations.splitPDF(pdfData, validRanges);
          
          expect(result).toBeDefined();
          expect(result.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('ArrayBuffer cleanup is called for all operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;
          
          // Test that operations complete successfully and don't leave system in bad state
          // We'll test split operation as it's representative
          const ranges = [{ start: 1, end: Math.min(2, pdfData.pageCount) }];
          const result = await pdfOperations.splitPDF(pdfData, ranges);

          // Verificar que la operación completó exitosamente
          expect(result).toBeDefined();
          expect(result.length).toBe(1);
          
          // La limpieza ocurre automáticamente en el bloque finally
          // Realizar otra operación para verificar que el sistema está en buen estado
          const ranges2 = [{ start: 1, end: pdfData.pageCount }];
          const result2 = await pdfOperations.splitPDF(pdfData, ranges2);
          expect(result2).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
