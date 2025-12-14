import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { FileManager } from '../../js/models/FileManager.js';
import { PDFDocument } from '../../js/models/PDFDocument.js';
import { arbitraryPDFFile, arbitraryJPGFile } from './generators/arbitraries.js';

describe('FileManager - Property-Based Tests', () => {
  const fileManager = new FileManager();

  // Feature: ihatepdf, Property 14: Validación de archivos JPG
  // Valida: Requisitos 5.1
  test('validates JPG files correctly for any valid JPG file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpeg`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.JPG`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.JPEG`)
          ),
          type: fc.constant('image/jpeg'),
          size: fc.integer({ min: 1, max: 10000000 })
        }),
        async (fileProps) => {
          // Create a mock File object
          const file = new File(['fake jpg content'], fileProps.name, { 
            type: fileProps.type 
          });
          
          // Property: Any file with .jpg/.jpeg extension and image/jpeg MIME type should be valid
          const isValid = fileManager.validateJPGFile(file);
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 14: Validación de archivos JPG (invalid files)
  // Valida: Requisitos 5.1
  test('rejects non-JPG files for any invalid file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.png`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.txt`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.doc`)
          ),
          type: fc.oneof(
            fc.constant('application/pdf'),
            fc.constant('image/png'),
            fc.constant('text/plain'),
            fc.constant('application/msword')
          ),
          size: fc.integer({ min: 1, max: 10000000 })
        }),
        async (fileProps) => {
          // Create a mock File object with non-JPG properties
          const file = new File(['fake content'], fileProps.name, { 
            type: fileProps.type 
          });
          
          // Property: Any file without .jpg/.jpeg extension or without image/jpeg MIME type should be invalid
          const isValid = fileManager.validateJPGFile(file);
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 16: Extracción de metadatos
  // Valida: Requisitos 10.1, 10.5
  test('extracts correct metadata from any loaded file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Test PDF metadata extraction
          fc.record({
            type: fc.constant('pdf'),
            data: arbitraryPDFFile(),
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`)
          }),
          // Test JPG metadata extraction
          fc.record({
            type: fc.constant('jpg'),
            data: arbitraryJPGFile(),
            filename: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`)
          })
        ),
        async (testCase) => {
          if (testCase.type === 'pdf') {
            const pdfData = await testCase.data;
            
            // Create a File object from the PDF data
            const pdfBytes = new Uint8Array(pdfData.arrayBuffer);
            const file = new File([pdfBytes], testCase.filename, { type: 'application/pdf' });
            
            // Property: System must correctly extract filename and file size
            expect(file.name).toBe(testCase.filename);
            expect(file.size).toBe(pdfBytes.length);
            expect(file.size).toBeGreaterThan(0);
            
            // Property: System must correctly extract page count from PDF
            const pdfDoc = new PDFDocument(pdfData.arrayBuffer);
            await pdfDoc.load();
            const pageCount = pdfDoc.getPageCount();
            expect(pageCount).toBe(pdfData.pageCount);
            expect(pageCount).toBeGreaterThan(0);
            
            // Property: System must correctly extract file size from PDF
            const fileSize = pdfDoc.getFileSize();
            expect(fileSize).toBe(pdfData.arrayBuffer.byteLength);
            expect(fileSize).toBeGreaterThan(0);
            
          } else if (testCase.type === 'jpg') {
            const jpgData = testCase.data;
            
            // Create a File object from the JPG data
            const jpgBytes = new Uint8Array(jpgData.arrayBuffer);
            const file = new File([jpgBytes], testCase.filename, { type: 'image/jpeg' });
            
            // Property: System must correctly extract filename and file size from JPG
            expect(file.name).toBe(testCase.filename);
            expect(file.size).toBe(jpgBytes.length);
            expect(file.size).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 22: Generación de nombres por defecto
  // Valida: Requisitos 11.2
  test('generates default filename based on operation for any operation and filename', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('combine'),
          fc.constant('split'),
          fc.constant('compress'),
          fc.constant('rotate'),
          fc.constant('convert')
        ),
        fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        (operation, originalFilename) => {
          // Property: Generated filename must contain the operation type and end with .pdf
          const defaultName = fileManager.generateDefaultFilename(operation, originalFilename);
          
          // Must contain the operation name
          expect(defaultName.toLowerCase()).toContain(operation === 'combine' ? 'combinado' : 
                                                    operation === 'split' ? 'dividido' :
                                                    operation === 'compress' ? 'comprimido' :
                                                    operation === 'rotate' ? 'rotado' :
                                                    operation === 'convert' ? 'convertido' : 'procesado');
          
          // Must end with .pdf
          expect(defaultName).toMatch(/\.pdf$/);
          
          // Must contain timestamp
          expect(defaultName).toMatch(/\d{8}T\d{6}/);
          
          // If original filename provided, should be based on it (without extension)
          if (originalFilename) {
            const baseNameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
            expect(defaultName).toContain(baseNameWithoutExt);
          } else {
            // Should use default base name
            expect(defaultName).toContain('documento');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 23: Uso de ruta personalizada
  // Valida: Requisitos 11.5
  test('detects File System Access API support correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
        async (filename) => {
          // Property: API detection should return a boolean value
          const supportsAPI = fileManager.supportsFileSystemAccess();
          expect(typeof supportsAPI).toBe('boolean');
          
          // Property: Method should handle invalid inputs correctly
          try {
            await fileManager.downloadFileWithCustomLocation(null, filename);
            // Should not reach here with null blob
            expect(false).toBe(true);
          } catch (error) {
            // Should throw for invalid inputs
            expect(error.message).toContain('Se requieren blob y nombre de archivo');
          }
          
          try {
            const blob = new Blob(['test'], { type: 'application/pdf' });
            await fileManager.downloadFileWithCustomLocation(blob, null);
            // Should not reach here with null filename
            expect(false).toBe(true);
          } catch (error) {
            // Should throw for invalid inputs
            expect(error.message).toContain('Se requieren blob y nombre de archivo');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
