import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDFOperations } from '../../js/models/PDFOperations.js';
import { FileManager } from '../../js/models/FileManager.js';
import { arbitraryPDFFile, arbitraryJPGFile, arbitraryRotationAngle } from './generators/arbitraries.js';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

describe('Output Validity - Property-Based Tests', () => {
  const pdfOperations = new PDFOperations();
  const fileManager = new FileManager();

  // Feature: ihatepdf, Property 15: Validez de archivos de salida
  // Valida: Requisitos 1.3, 2.4, 3.4, 4.4, 5.3
  test('combine operation produces valid PDF files that can be loaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryPDFFile(), { minLength: 2, maxLength: 5 }),
        async (pdfDataPromises) => {
          const pdfDataArray = await Promise.all(pdfDataPromises);
          const result = await pdfOperations.combinePDFs(pdfDataArray);

          // Property: Output file must be a valid PDF that can be loaded
          expect(result).toBeDefined();
          expect(result).toBeInstanceOf(Uint8Array);
          expect(result.length).toBeGreaterThan(0);

          const loadedPdf = await PDFLibDocument.load(result);
          expect(loadedPdf).toBeDefined();
          expect(loadedPdf.getPageCount()).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('split operation produces valid PDF files that can be loaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;
          
          // Generate valid ranges for splitting
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

          const results = await pdfOperations.splitPDF(pdfData, ranges);

          // Property: All output files must be valid PDFs that can be loaded
          for (const outputFile of results) {
            expect(outputFile).toBeDefined();
            expect(outputFile).toBeInstanceOf(Uint8Array);
            expect(outputFile.length).toBeGreaterThan(0);

            const loadedPdf = await PDFLibDocument.load(outputFile);
            expect(loadedPdf).toBeDefined();
            expect(loadedPdf.getPageCount()).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  test('compress operation produces valid PDF files that can be loaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        async (pdfDataPromise) => {
          const pdfData = await pdfDataPromise;
          const result = await pdfOperations.compressPDF(pdfData);

          // Property: Output file must be a valid PDF that can be loaded
          expect(result.data).toBeDefined();
          expect(result.data).toBeInstanceOf(Uint8Array);
          expect(result.data.length).toBeGreaterThan(0);

          const loadedPdf = await PDFLibDocument.load(result.data);
          expect(loadedPdf).toBeDefined();
          expect(loadedPdf.getPageCount()).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('rotate operation produces valid PDF files that can be loaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryPDFFile(),
        arbitraryRotationAngle(),
        async (pdfDataPromise, degrees) => {
          const pdfData = await pdfDataPromise;
          const allPages = Array.from({ length: pdfData.pageCount }, (_, i) => i + 1);
          const result = await pdfOperations.rotatePDF(pdfData, allPages, degrees);

          // Property: Output file must be a valid PDF that can be loaded
          expect(result).toBeDefined();
          expect(result).toBeInstanceOf(Uint8Array);
          expect(result.length).toBeGreaterThan(0);

          const loadedPdf = await PDFLibDocument.load(result);
          expect(loadedPdf).toBeDefined();
          expect(loadedPdf.getPageCount()).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('convert operation produces valid PDF files that can be loaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryJPGFile(), { minLength: 1, maxLength: 5 }),
        async (jpgFiles) => {
          const result = await pdfOperations.convertJPGToPDF(jpgFiles);

          // Property: Output file must be a valid PDF that can be loaded
          expect(result).toBeDefined();
          expect(result).toBeInstanceOf(Uint8Array);
          expect(result.length).toBeGreaterThan(0);

          const loadedPdf = await PDFLibDocument.load(result);
          expect(loadedPdf).toBeDefined();
          expect(loadedPdf.getPageCount()).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });
});
