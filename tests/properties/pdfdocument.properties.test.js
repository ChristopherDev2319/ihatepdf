import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { PDFDocument } from '../../js/models/PDFDocument.js';
import { arbitraryPDFFile } from './generators/arbitraries.js';

describe('PDFDocument - Property-Based Tests', () => {
  // Feature: ihatepdf, Property 5: Extracción correcta del conteo de páginas
  test('correctly extracts page count from any valid PDF', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryPDFFile(), async (pdfPromise) => {
        const { arrayBuffer, pageCount } = await pdfPromise;
        const pdfDoc = new PDFDocument(arrayBuffer);
        await pdfDoc.load();
        
        const extractedPageCount = pdfDoc.getPageCount();
        expect(extractedPageCount).toBe(pageCount);
      }),
      { numRuns: 100 }
    );
  });
});
