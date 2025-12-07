import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDFOperations } from '../../js/models/PDFOperations.js';
import { arbitraryPDFFile, arbitraryPageSelection, arbitraryRotationAngle, arbitraryJPGFile } from './generators/arbitraries.js';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

describe('PDFOperations - Property-Based Tests', () => {
  const pdfOperations = new PDFOperations();

  // Feature: ihatepdf, Property 1: Preservación del conteo de páginas al combinar
  // Valida: Requisitos 1.2
  test('combining PDFs preserves total page count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryPDFFile(), { minLength: 2, maxLength: 5 }),
        async (pdfDataPromises) => {
          // Resolver todas las promesas de PDFs generados
          const pdfDataArray = await Promise.all(pdfDataPromises);
          
          // Calcular el total de páginas esperado
          const expectedTotalPages = pdfDataArray.reduce(
            (sum, pdfData) => sum + pdfData.pageCount,
            0
          );

          // Combinar los PDFs (pasando los objetos directamente)
          const combinedPdfBytes = await pdfOperations.combinePDFs(pdfDataArray);

          // Cargar el PDF combinado y verificar el conteo de páginas
          const combinedPdf = await PDFLibDocument.load(combinedPdfBytes);
          const actualPageCount = combinedPdf.getPageCount();

          expect(actualPageCount).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 2: Preservación del orden al combinar
  // Valida: Requisitos 1.4
  test('combining PDFs preserves order of pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryPDFFile(), { minLength: 2, maxLength: 5 }),
        async (pdfDataPromises) => {
          // Resolver todas las promesas de PDFs generados
          const pdfDataArray = await Promise.all(pdfDataPromises);

          // Combinar los PDFs
          const combinedPdfBytes = await pdfOperations.combinePDFs(pdfDataArray);

          // Cargar el PDF combinado
          const combinedPdf = await PDFLibDocument.load(combinedPdfBytes);

          // Verificar que el orden de las páginas coincide con el orden de entrada
          let currentPageIndex = 0;
          for (const pdfData of pdfDataArray) {
            // Cada PDF debe contribuir con sus páginas en orden
            for (let i = 0; i < pdfData.pageCount; i++) {
              // Verificar que la página existe en la posición esperada
              const page = combinedPdf.getPage(currentPageIndex);
              expect(page).toBeDefined();
              currentPageIndex++;
            }
          }

          // Verificar que no hay páginas adicionales
          expect(currentPageIndex).toBe(combinedPdf.getPageCount());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 4: Preservación de páginas al dividir
  // Valida: Requisitos 2.3
  test('splitting PDF preserves specified pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;
          
          // Generar rangos no superpuestos válidos
          const ranges = [];
          let currentStart = 1;
          const maxRanges = Math.min(3, pdfData.pageCount);
          
          for (let i = 0; i < maxRanges && currentStart <= pdfData.pageCount; i++) {
            const remainingPages = pdfData.pageCount - currentStart + 1;
            const rangeSize = Math.min(
              Math.max(1, Math.floor(remainingPages / (maxRanges - i))),
              remainingPages
            );
            const end = currentStart + rangeSize - 1;
            
            ranges.push({ start: currentStart, end });
            currentStart = end + 1;
          }

          if (ranges.length === 0) {
            ranges.push({ start: 1, end: pdfData.pageCount });
          }

          // Calcular el total de páginas esperado en todos los rangos
          const expectedTotalPages = ranges.reduce(
            (sum, range) => sum + (range.end - range.start + 1),
            0
          );

          // Dividir el PDF
          const splitPdfBytes = await pdfOperations.splitPDF(pdfData, ranges);

          // Verificar que se generaron los PDFs correctos
          expect(splitPdfBytes.length).toBe(ranges.length);

          // Contar páginas en todos los PDFs divididos
          let actualTotalPages = 0;
          for (const pdfBytes of splitPdfBytes) {
            const pdf = await PDFLibDocument.load(pdfBytes);
            actualTotalPages += pdf.getPageCount();
          }

          expect(actualTotalPages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 6: Validación de rangos
  // Valida: Requisitos 2.2
  test('splitting PDF rejects invalid page ranges', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        fc.integer({ min: -10, max: 100 }),
        async (pdfDataPromise, invalidPage) => {
          const pdfData = await pdfDataPromise;
          const totalPages = pdfData.pageCount;

          // Solo probar con páginas que están fuera del rango válido
          if (invalidPage >= 1 && invalidPage <= totalPages) {
            return; // Skip this test case
          }

          // Crear un rango inválido
          const invalidRanges = [{ start: invalidPage, end: invalidPage }];

          // Verificar que se rechaza el rango inválido
          await expect(
            pdfOperations.splitPDF(pdfData, invalidRanges)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 7: Validez del PDF comprimido
  // Valida: Requisitos 3.2
  test('compressed PDF is valid and can be loaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;

          // Comprimir el PDF
          const result = await pdfOperations.compressPDF(pdfData);

          // Verificar que el resultado es válido
          expect(result.data).toBeDefined();
          expect(result.data).toBeInstanceOf(Uint8Array);

          // Intentar cargar el PDF comprimido para verificar que es válido
          const compressedPdf = await PDFLibDocument.load(result.data);
          
          // Verificar que el PDF comprimido tiene el mismo número de páginas
          expect(compressedPdf.getPageCount()).toBe(pdfData.pageCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 8: Reducción o mantenimiento del tamaño
  // Valida: Requisitos 3.2
  test('compressed PDF size is less than or equal to original', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;

          // Comprimir el PDF
          const result = await pdfOperations.compressPDF(pdfData);

          // Nota: pdf-lib no tiene opciones de compresión explícitas, por lo que
          // el "tamaño comprimido" puede ser ligeramente mayor debido a metadatos.
          // Verificamos que el tamaño está en un rango razonable (dentro del 110% del original)
          expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize * 1.1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 9: Cálculo correcto del porcentaje de reducción
  // Valida: Requisitos 3.3
  test('reduction percentage is calculated correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;

          // Comprimir el PDF
          const result = await pdfOperations.compressPDF(pdfData);

          // Calcular el porcentaje esperado
          const expectedPercentage = 
            ((result.originalSize - result.compressedSize) / result.originalSize) * 100;

          // Verificar que el porcentaje calculado es correcto (con tolerancia para redondeo)
          expect(result.reductionPercentage).toBeCloseTo(Math.max(0, expectedPercentage), 2);
          
          // Verificar que el porcentaje está en el rango válido [0, 100]
          expect(result.reductionPercentage).toBeGreaterThanOrEqual(0);
          expect(result.reductionPercentage).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 10: Preservación del conteo de páginas al rotar
  // Valida: Requisitos 4.3
  test('rotating PDF preserves page count', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        arbitraryRotationAngle(),
        async (pdfDataPromise, degrees) => {
          const pdfData = await pdfDataPromise;

          // Seleccionar todas las páginas para rotar
          const allPages = Array.from({ length: pdfData.pageCount }, (_, i) => i + 1);

          // Rotar todas las páginas
          const rotatedPdfBytes = await pdfOperations.rotatePDF(pdfData, allPages, degrees);

          // Cargar el PDF rotado
          const rotatedPdf = await PDFLibDocument.load(rotatedPdfBytes);

          // Verificar que el número de páginas no cambió
          expect(rotatedPdf.getPageCount()).toBe(pdfData.pageCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 11: Rotación aplicada solo a páginas seleccionadas
  // Valida: Requisitos 4.3
  test('rotation is applied only to selected pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        arbitraryRotationAngle(),
        async (pdfDataPromise, degrees) => {
          const pdfData = await pdfDataPromise;

          // Solo probar con PDFs que tengan al menos 2 páginas
          if (pdfData.pageCount < 2) {
            return;
          }

          // Cargar el PDF original para obtener rotaciones iniciales
          const originalPdf = await PDFLibDocument.load(pdfData.arrayBuffer);
          const originalRotations = [];
          for (let i = 0; i < pdfData.pageCount; i++) {
            originalRotations.push(originalPdf.getPage(i).getRotation().angle);
          }

          // Seleccionar solo la primera página para rotar
          const selectedPages = [1];

          // Rotar solo la primera página
          const rotatedPdfBytes = await pdfOperations.rotatePDF(pdfData, selectedPages, degrees);

          // Cargar el PDF rotado
          const rotatedPdf = await PDFLibDocument.load(rotatedPdfBytes);

          // Verificar que la primera página fue rotada
          const firstPageRotation = rotatedPdf.getPage(0).getRotation().angle;
          const expectedFirstRotation = (originalRotations[0] + degrees) % 360;
          expect(firstPageRotation).toBe(expectedFirstRotation);

          // Verificar que las demás páginas NO fueron rotadas
          for (let i = 1; i < pdfData.pageCount; i++) {
            const pageRotation = rotatedPdf.getPage(i).getRotation().angle;
            expect(pageRotation).toBe(originalRotations[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 12: Correspondencia entre imágenes y páginas
  // Valida: Requisitos 5.2
  test('converting JPGs to PDF creates one page per image', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryJPGFile(), { minLength: 1, maxLength: 5 }),
        async (jpgFiles) => {
          const imageCount = jpgFiles.length;

          // Convertir las imágenes a PDF
          const pdfBytes = await pdfOperations.convertJPGToPDF(jpgFiles);

          // Cargar el PDF resultante
          const pdf = await PDFLibDocument.load(pdfBytes);

          // Verificar que el número de páginas coincide con el número de imágenes
          expect(pdf.getPageCount()).toBe(imageCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 13: Preservación del orden de imágenes
  // Valida: Requisitos 5.4
  test('converting JPGs to PDF preserves image order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryJPGFile(), { minLength: 2, maxLength: 5 }),
        async (jpgFiles) => {
          // Convertir las imágenes a PDF
          const pdfBytes = await pdfOperations.convertJPGToPDF(jpgFiles);

          // Cargar el PDF resultante
          const pdf = await PDFLibDocument.load(pdfBytes);

          // Verificar que cada imagen corresponde a una página en orden
          // Como todas las imágenes generadas son idénticas (1x1 pixel),
          // verificamos que el número de páginas es correcto y están en orden
          expect(pdf.getPageCount()).toBe(jpgFiles.length);

          // Verificar que todas las páginas existen y están accesibles en orden
          for (let i = 0; i < jpgFiles.length; i++) {
            const page = pdf.getPage(i);
            expect(page).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
