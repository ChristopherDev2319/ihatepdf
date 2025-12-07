import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileManager } from '../../../js/models/FileManager.js';

describe('FileManager - Unit Tests', () => {
  let fileManager;

  beforeEach(() => {
    fileManager = new FileManager();
  });

  describe('loadFiles', () => {
    test('loads files from FileList successfully', async () => {
      const mockFile1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
      const mockFile2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
      const mockFileList = [mockFile1, mockFile2];
      
      const result = await fileManager.loadFiles(mockFileList);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockFile1);
      expect(result[1]).toBe(mockFile2);
    });

    test('throws error when no files provided', async () => {
      await expect(fileManager.loadFiles(null)).rejects.toThrow('No files provided');
      await expect(fileManager.loadFiles([])).rejects.toThrow('No files provided');
    });
  });

  describe('validatePDFFile', () => {
    test('validates valid PDF files', () => {
      const validPDF = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      expect(fileManager.validatePDFFile(validPDF)).toBe(true);
    });

    test('rejects files with wrong extension', () => {
      const wrongExtension = new File(['content'], 'document.txt', { type: 'application/pdf' });
      expect(fileManager.validatePDFFile(wrongExtension)).toBe(false);
    });

    test('rejects files with wrong MIME type', () => {
      const wrongMimeType = new File(['content'], 'document.pdf', { type: 'text/plain' });
      expect(fileManager.validatePDFFile(wrongMimeType)).toBe(false);
    });

    test('rejects null or undefined files', () => {
      expect(fileManager.validatePDFFile(null)).toBe(false);
      expect(fileManager.validatePDFFile(undefined)).toBe(false);
    });

    test('handles case-insensitive PDF extensions', () => {
      const upperCasePDF = new File(['content'], 'document.PDF', { type: 'application/pdf' });
      expect(fileManager.validatePDFFile(upperCasePDF)).toBe(true);
    });
  });

  describe('validateJPGFile', () => {
    test('validates valid JPG files with .jpg extension', () => {
      const validJPG = new File(['image data'], 'photo.jpg', { type: 'image/jpeg' });
      expect(fileManager.validateJPGFile(validJPG)).toBe(true);
    });

    test('validates valid JPG files with .jpeg extension', () => {
      const validJPEG = new File(['image data'], 'photo.jpeg', { type: 'image/jpeg' });
      expect(fileManager.validateJPGFile(validJPEG)).toBe(true);
    });

    test('rejects files with wrong extension', () => {
      const wrongExtension = new File(['image data'], 'photo.png', { type: 'image/jpeg' });
      expect(fileManager.validateJPGFile(wrongExtension)).toBe(false);
    });

    test('rejects files with wrong MIME type', () => {
      const wrongMimeType = new File(['image data'], 'photo.jpg', { type: 'image/png' });
      expect(fileManager.validateJPGFile(wrongMimeType)).toBe(false);
    });

    test('rejects null or undefined files', () => {
      expect(fileManager.validateJPGFile(null)).toBe(false);
      expect(fileManager.validateJPGFile(undefined)).toBe(false);
    });

    test('handles case-insensitive JPG extensions', () => {
      const upperCaseJPG = new File(['image data'], 'photo.JPG', { type: 'image/jpeg' });
      expect(fileManager.validateJPGFile(upperCaseJPG)).toBe(true);
      
      const upperCaseJPEG = new File(['image data'], 'photo.JPEG', { type: 'image/jpeg' });
      expect(fileManager.validateJPGFile(upperCaseJPEG)).toBe(true);
    });
  });

  describe('createBlobURL', () => {
    beforeEach(() => {
      // Mock URL.createObjectURL for jsdom
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url-123');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('creates Blob URL from Uint8Array data', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const mimeType = 'application/pdf';
      
      const url = fileManager.createBlobURL(data, mimeType);
      
      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
      expect(url).toBe('blob:mock-url-123');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('throws error when data is missing', () => {
      expect(() => fileManager.createBlobURL(null, 'application/pdf')).toThrow('Data and mimeType are required');
    });

    test('throws error when mimeType is missing', () => {
      const data = new Uint8Array([1, 2, 3]);
      expect(() => fileManager.createBlobURL(data, null)).toThrow('Data and mimeType are required');
    });
  });

  describe('downloadFile', () => {
    let mockLink;
    let appendChildSpy;
    let removeChildSpy;

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      
      // Mock URL methods for jsdom
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('downloads file with correct filename', async () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test.pdf';
      
      fileManager.downloadFile(blob, filename);
      
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      
      // Wait for setTimeout to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    test('throws error when blob is missing', () => {
      expect(() => fileManager.downloadFile(null, 'test.pdf')).toThrow('Blob and filename are required');
    });

    test('throws error when filename is missing', () => {
      const blob = new Blob(['test content']);
      expect(() => fileManager.downloadFile(blob, null)).toThrow('Blob and filename are required');
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      // Mock URL methods for jsdom
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url-' + Math.random());
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('registers temporary URLs when creating Blob URLs', () => {
      const data = new Uint8Array([1, 2, 3]);
      const url1 = fileManager.createBlobURL(data, 'application/pdf');
      const url2 = fileManager.createBlobURL(data, 'application/pdf');
      
      expect(fileManager.temporaryURLs.size).toBe(2);
      expect(fileManager.temporaryURLs.has(url1)).toBe(true);
      expect(fileManager.temporaryURLs.has(url2)).toBe(true);
    });

    test('cleans up all temporary URLs after successful operation', () => {
      const data = new Uint8Array([1, 2, 3]);
      fileManager.createBlobURL(data, 'application/pdf');
      fileManager.createBlobURL(data, 'application/pdf');
      
      expect(fileManager.temporaryURLs.size).toBe(2);
      
      fileManager.cleanupTemporaryURLs();
      
      expect(fileManager.temporaryURLs.size).toBe(0);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    test('cleans up temporary URLs even after failed operations', () => {
      const data = new Uint8Array([1, 2, 3]);
      const url = fileManager.createBlobURL(data, 'application/pdf');
      
      // Simulate an error during cleanup
      global.URL.revokeObjectURL = vi.fn(() => {
        throw new Error('Revoke failed');
      });
      
      // Should not throw, just log warning
      expect(() => fileManager.cleanupTemporaryURLs()).not.toThrow();
      
      // URLs should still be cleared from the set
      expect(fileManager.temporaryURLs.size).toBe(0);
    });

    test('can register URLs manually', () => {
      fileManager.registerTemporaryURL('blob:test-url-1');
      fileManager.registerTemporaryURL('blob:test-url-2');
      
      expect(fileManager.temporaryURLs.size).toBe(2);
      expect(fileManager.temporaryURLs.has('blob:test-url-1')).toBe(true);
      expect(fileManager.temporaryURLs.has('blob:test-url-2')).toBe(true);
    });
  });
});
