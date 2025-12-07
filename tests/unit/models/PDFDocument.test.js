import { describe, test, expect, beforeEach } from 'vitest';
import { PDFDocument } from '../../../js/models/PDFDocument.js';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';

describe('PDFDocument', () => {
  let validPDFBuffer;

  beforeEach(async () => {
    // Crear un PDF válido para las pruebas
    const pdfDoc = await PDFLibDocument.create();
    pdfDoc.addPage([600, 800]);
    pdfDoc.addPage([600, 800]);
    pdfDoc.addPage([600, 800]);
    
    const pdfBytes = await pdfDoc.save();
    validPDFBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    );
  });

  describe('constructor', () => {
    test('should create instance with valid ArrayBuffer', () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      expect(pdfDoc).toBeInstanceOf(PDFDocument);
      expect(pdfDoc.arrayBuffer).toBe(validPDFBuffer);
    });

    test('should throw error when ArrayBuffer is not provided', () => {
      expect(() => new PDFDocument(null)).toThrow('ArrayBuffer is required');
      expect(() => new PDFDocument(undefined)).toThrow('ArrayBuffer is required');
    });
  });

  describe('load', () => {
    test('should load a valid PDF', async () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      const loadedDoc = await pdfDoc.load();
      
      expect(loadedDoc).toBeDefined();
      expect(pdfDoc.pdfDoc).toBe(loadedDoc);
    });

    test('should return same instance on multiple calls', async () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      const firstLoad = await pdfDoc.load();
      const secondLoad = await pdfDoc.load();
      
      expect(firstLoad).toBe(secondLoad);
    });
  });

  describe('getPageCount', () => {
    test('should return correct page count for loaded PDF', async () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      await pdfDoc.load();
      
      const pageCount = pdfDoc.getPageCount();
      expect(pageCount).toBe(3);
    });

    test('should throw error if PDF not loaded', () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      
      expect(() => pdfDoc.getPageCount()).toThrow('PDF document not loaded. Call load() first.');
    });
  });

  describe('getFileSize', () => {
    test('should return correct file size in bytes', () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      
      const fileSize = pdfDoc.getFileSize();
      expect(fileSize).toBe(validPDFBuffer.byteLength);
      expect(fileSize).toBeGreaterThan(0);
    });
  });

  describe('save', () => {
    test('should save PDF and return Uint8Array', async () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      await pdfDoc.load();
      
      const savedBytes = await pdfDoc.save();
      expect(savedBytes).toBeInstanceOf(Uint8Array);
      expect(savedBytes.length).toBeGreaterThan(0);
    });

    test('should auto-load PDF if not already loaded', async () => {
      const pdfDoc = new PDFDocument(validPDFBuffer);
      
      const savedBytes = await pdfDoc.save();
      expect(savedBytes).toBeInstanceOf(Uint8Array);
      expect(pdfDoc.pdfDoc).toBeDefined();
    });
  });
});
