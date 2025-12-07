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
  test('all operations produce valid PDF files that can be loaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Test combine operation
          fc.record({
            operation: fc.constant('combine'),
            files: fc.array(arbitraryPDFFile(), { minLength: 2, maxLength: 5 })
          }),
          // Test split operation
          fc.record({
            operation: fc.constant('split'),
            file: arbitraryPDFFile()
          }).chain(async (config) => {
            const pdfData = await config.file;
            // Generate valid ranges
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

            return fc.constant({
              operation: 'split',
              file: pdfData,
              ranges
            });
          }),
          // Test compress operation
          fc.record({
            operation: fc.constant('compress'),
            file: arbitraryPDFFile()
          }),
          // Test rotate operation
          fc.record({
            operation: fc.constant('rotate'),
            file: arbitraryPDFFile(),
            degrees: arbitraryRotationAngle()
          }),
          // Test JPG to PDF conversion
          fc.record({
            operation: fc.constant('convert'),
            files: fc.array(arbitraryJPGFile(), { minLength: 1, maxLength: 5 })
          })
        ),
        async (testCase) => {
          let outputFiles = [];

          // Execute the operation based on type
          switch (testCase.operation) {
            case 'combine': {
              const pdfDataArray = await Promise.all(testCase.files);
              const result = await pdfOperations.combinePDFs(pdfDataArray);
              outputFiles = [result];
              break;
            }
            case 'split': {
              const results = await pdfOperations.splitPDF(testCase.file, testCase.ranges);
              outputFiles = results;
              break;
            }
            case 'compress': {
              const pdfData = await testCase.file;
              const result = await pdfOperations.compressPDF(pdfData);
              outputFiles = [result.data];
              break;
            }
            case 'rotate': {
              const pdfData = await testCase.file;
              const allPages = Array.from({ length: pdfData.pageCount }, (_, i) => i + 1);
              const result = await pdfOperations.rotatePDF(pdfData, allPages, testCase.degrees);
              outputFiles = [result];
              break;
            }
            case 'convert': {
              const result = await pdfOperations.convertJPGToPDF(testCase.files);
              outputFiles = [result];
              break;
            }
          }

          // Property: All output files must be valid PDFs that can be loaded
          for (const outputFile of outputFiles) {
            expect(outputFile).toBeDefined();
            expect(outputFile).toBeInstanceOf(Uint8Array);
            expect(outputFile.length).toBeGreaterThan(0);

            // The critical test: can we load the output as a valid PDF?
            const loadedPdf = await PDFLibDocument.load(outputFile);
            expect(loadedPdf).toBeDefined();
            expect(loadedPdf.getPageCount()).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
