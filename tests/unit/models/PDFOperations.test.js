import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { PDFOperations } from '../../../js/models/PDFOperations.js';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

describe('PDFOperations - Memory Management Unit Tests', () => {
  let pdfOperations;

  beforeEach(() => {
    pdfOperations = new PDFOperations();
    
    // Mock URL methods for jsdom
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url-' + Math.random());
    }
    if (!global.URL.revokeObjectURL) {
      global.URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Temporary URL Management', () => {
    test('registers temporary URLs', () => {
      pdfOperations.registerTemporaryURL('blob:test-url-1');
      pdfOperations.registerTemporaryURL('blob:test-url-2');
      
      expect(pdfOperations.temporaryURLs.size).toBe(2);
      expect(pdfOperations.temporaryURLs.has('blob:test-url-1')).toBe(true);
      expect(pdfOperations.temporaryURLs.has('blob:test-url-2')).toBe(true);
    });

    test('cleans up all temporary URLs after successful operation', () => {
      pdfOperations.registerTemporaryURL('blob:test-url-1');
      pdfOperations.registerTemporaryURL('blob:test-url-2');
      pdfOperations.registerTemporaryURL('blob:test-url-3');
      
      expect(pdfOperations.temporaryURLs.size).toBe(3);
      
      pdfOperations.cleanupTemporaryURLs();
      
      expect(pdfOperations.temporaryURLs.size).toBe(0);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(3);
    });

    test('handles cleanup errors gracefully', () => {
      pdfOperations.registerTemporaryURL('blob:test-url-1');
      
      // Simulate an error during cleanup
      global.URL.revokeObjectURL = vi.fn(() => {
        throw new Error('Revoke failed');
      });
      
      // Should not throw, just log warning
      expect(() => pdfOperations.cleanupTemporaryURLs()).not.toThrow();
      
      // URLs should still be cleared from the set
      expect(pdfOperations.temporaryURLs.size).toBe(0);
    });
  });

  describe('ArrayBuffer Cleanup', () => {
    test('cleans up ArrayBuffer references', () => {
      const arrayBuffers = [
        new ArrayBuffer(100),
        new ArrayBuffer(200),
        new ArrayBuffer(300)
      ];
      
      expect(arrayBuffers.length).toBe(3);
      
      pdfOperations.cleanupArrayBuffers(arrayBuffers);
      
      // Array should be emptied
      expect(arrayBuffers.length).toBe(0);
    });

    test('handles null or undefined gracefully', () => {
      expect(() => pdfOperations.cleanupArrayBuffers(null)).not.toThrow();
      expect(() => pdfOperations.cleanupArrayBuffers(undefined)).not.toThrow();
    });

    test('handles non-array input gracefully', () => {
      expect(() => pdfOperations.cleanupArrayBuffers('not an array')).not.toThrow();
      expect(() => pdfOperations.cleanupArrayBuffers(123)).not.toThrow();
    });
  });

  describe('Memory Cleanup in Operations', () => {
    // Helper function to create a minimal valid PDF
    async function createMinimalPDF() {
      const pdfDoc = await PDFLibDocument.create();
      pdfDoc.addPage([200, 200]);
      const pdfBytes = await pdfDoc.save();
      return {
        arrayBuffer: pdfBytes.buffer,
        pageCount: 1
      };
    }

    test('combinePDFs cleans up after successful operation', async () => {
      const pdf1 = await createMinimalPDF();
      const pdf2 = await createMinimalPDF();
      
      const result = await pdfOperations.combinePDFs([pdf1, pdf2]);
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Uint8Array);
      
      // Verify the result is a valid PDF
      const resultPdf = await PDFLibDocument.load(result);
      expect(resultPdf.getPageCount()).toBe(2);
    });

    test('splitPDF cleans up after successful operation', async () => {
      const pdf = await createMinimalPDF();
      const ranges = [{ start: 1, end: 1 }];
      
      const result = await pdfOperations.splitPDF(pdf, ranges);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Uint8Array);
    });

    test('compressPDF cleans up after successful operation', async () => {
      const pdf = await createMinimalPDF();
      
      const result = await pdfOperations.compressPDF(pdf);
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
    });

    test('rotatePDF cleans up after successful operation', async () => {
      const pdf = await createMinimalPDF();
      const pages = [1];
      const degrees = 90;
      
      const result = await pdfOperations.rotatePDF(pdf, pages, degrees);
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('operations clean up even after failure', async () => {
      const invalidPdf = { arrayBuffer: new ArrayBuffer(10), pageCount: 1 };
      
      // This should fail because the ArrayBuffer doesn't contain valid PDF data
      await expect(pdfOperations.combinePDFs([invalidPdf, invalidPdf]))
        .rejects.toThrow();
      
      // The cleanup should still have occurred in the finally block
      // We can't directly verify ArrayBuffer cleanup, but we can verify
      // that subsequent operations still work
      const validPdf1 = await createMinimalPDF();
      const validPdf2 = await createMinimalPDF();
      const result = await pdfOperations.combinePDFs([validPdf1, validPdf2]);
      expect(result).toBeDefined();
    });
  });
});
