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
      await expect(fileManager.loadFiles(null)).rejects.toThrow('No se proporcionaron archivos');
      await expect(fileManager.loadFiles([])).rejects.toThrow('No se proporcionaron archivos');
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
      expect(() => fileManager.createBlobURL(null, 'application/pdf')).toThrow('Se requieren datos y tipo MIME');
    });

    test('throws error when mimeType is missing', () => {
      const data = new Uint8Array([1, 2, 3]);
      expect(() => fileManager.createBlobURL(data, null)).toThrow('Se requieren datos y tipo MIME');
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
      expect(() => fileManager.downloadFile(null, 'test.pdf')).toThrow('Se requieren blob y nombre de archivo');
    });

    test('throws error when filename is missing', () => {
      const blob = new Blob(['test content']);
      expect(() => fileManager.downloadFile(blob, null)).toThrow('Se requieren blob y nombre de archivo');
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

  describe('generateDefaultFilename', () => {
    test('generates default filename for combine operation', () => {
      const filename = fileManager.generateDefaultFilename('combine', 'original.pdf');
      
      expect(filename).toContain('original');
      expect(filename).toContain('combinado');
      expect(filename).toMatch(/\.pdf$/);
      expect(filename).toMatch(/\d{8}T\d{6}/); // timestamp pattern
    });

    test('generates default filename for split operation', () => {
      const filename = fileManager.generateDefaultFilename('split', 'document.pdf');
      
      expect(filename).toContain('document');
      expect(filename).toContain('dividido');
      expect(filename).toMatch(/\.pdf$/);
    });

    test('generates default filename for compress operation', () => {
      const filename = fileManager.generateDefaultFilename('compress', 'large.pdf');
      
      expect(filename).toContain('large');
      expect(filename).toContain('comprimido');
      expect(filename).toMatch(/\.pdf$/);
    });

    test('generates default filename for rotate operation', () => {
      const filename = fileManager.generateDefaultFilename('rotate', 'sideways.pdf');
      
      expect(filename).toContain('sideways');
      expect(filename).toContain('rotado');
      expect(filename).toMatch(/\.pdf$/);
    });

    test('generates default filename for convert operation', () => {
      const filename = fileManager.generateDefaultFilename('convert', 'image.jpg');
      
      expect(filename).toContain('image');
      expect(filename).toContain('convertido');
      expect(filename).toMatch(/\.pdf$/);
    });

    test('uses "documento" as base name when no original filename provided', () => {
      const filename = fileManager.generateDefaultFilename('combine');
      
      expect(filename).toContain('documento');
      expect(filename).toContain('combinado');
      expect(filename).toMatch(/\.pdf$/);
    });

    test('removes extension from original filename', () => {
      const filename = fileManager.generateDefaultFilename('compress', 'test.pdf');
      
      expect(filename).toContain('test');
      expect(filename).not.toContain('test.pdf');
      expect(filename).toMatch(/\.pdf$/);
    });

    test('handles unknown operation types', () => {
      const filename = fileManager.generateDefaultFilename('unknown', 'test.pdf');
      
      expect(filename).toContain('test');
      expect(filename).toContain('procesado');
      expect(filename).toMatch(/\.pdf$/);
    });

    test('throws error when operation is not provided', () => {
      expect(() => fileManager.generateDefaultFilename(null)).toThrow('Se requiere especificar la operación');
      expect(() => fileManager.generateDefaultFilename('')).toThrow('Se requiere especificar la operación');
    });
  });

  describe('supportsFileSystemAccess', () => {
    test('detects File System Access API support', () => {
      // Mock the API as not available (default in test environment)
      const supports = fileManager.supportsFileSystemAccess();
      expect(typeof supports).toBe('boolean');
      expect(supports).toBe(false); // Should be false in test environment
    });

    test('detects File System Access API when available', () => {
      // Mock the API as available
      global.window.showSaveFilePicker = vi.fn();
      
      const supports = fileManager.supportsFileSystemAccess();
      expect(supports).toBe(true);
      
      // Cleanup
      delete global.window.showSaveFilePicker;
    });
  });

  describe('Device and Browser Detection', () => {
    test('detects mobile devices correctly', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      
      const isMobile = fileManager.isMobileDevice();
      expect(isMobile).toBe(true);
    });

    test('detects desktop devices correctly', () => {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true
      });
      
      // Mock large screen
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true
      });
      
      const isMobile = fileManager.isMobileDevice();
      expect(isMobile).toBe(false);
    });

    test('gets browser information correctly', () => {
      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });
      Object.defineProperty(navigator, 'vendor', {
        value: 'Google Inc.',
        configurable: true
      });
      
      const browserInfo = fileManager.getBrowserInfo();
      
      expect(browserInfo.isChrome).toBe(true);
      expect(browserInfo.isFirefox).toBe(false);
      expect(browserInfo.isBrave).toBe(false);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.version).toBe(91);
      expect(browserInfo.chromeVersion).toBe(91);
    });

    test('detects Brave Browser correctly', () => {
      // Mock Brave user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
      });
      Object.defineProperty(navigator, 'vendor', {
        value: 'Google Inc.',
        configurable: true
      });
      Object.defineProperty(navigator, 'brave', {
        value: { isBrave: true },
        configurable: true
      });
      
      const browserInfo = fileManager.getBrowserInfo();
      
      expect(browserInfo.isBrave).toBe(true);
      expect(browserInfo.isChrome).toBe(false); // Should be false when Brave is detected
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.version).toBe(91);
      expect(browserInfo.chromeVersion).toBe(91);
    });

    test('detects Edge Browser correctly', () => {
      // Mock Edge user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        configurable: true
      });
      Object.defineProperty(navigator, 'vendor', {
        value: 'Google Inc.',
        configurable: true
      });
      
      const browserInfo = fileManager.getBrowserInfo();
      
      expect(browserInfo.isEdge).toBe(true);
      expect(browserInfo.isChrome).toBe(false);
      expect(browserInfo.isChromiumBased).toBe(true);
      expect(browserInfo.version).toBe(91);
      expect(browserInfo.chromeVersion).toBe(91);
    });

    test('provides appropriate unavailable reason for Firefox', () => {
      // Mock Firefox and secure context
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true
      });
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true
      });
      
      const reason = fileManager.getFileSystemAccessUnavailableReason();
      expect(reason).toContain('Firefox no soporta');
    });

    test('provides appropriate unavailable reason for mobile', () => {
      // Mock mobile device and secure context
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true
      });
      
      const reason = fileManager.getFileSystemAccessUnavailableReason();
      expect(reason).toContain('dispositivos móviles');
    });

    test('provides appropriate unavailable reason for insecure context', () => {
      // Mock insecure context (HTTP)
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        configurable: true
      });
      
      const reason = fileManager.getFileSystemAccessUnavailableReason();
      expect(reason).toContain('HTTPS');
    });
  });

  describe('downloadFileWithCustomLocation', () => {
    beforeEach(() => {
      // Mock URL methods for jsdom
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('falls back to normal download when File System Access API not supported', async () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test.pdf';
      
      // Mock normal download method
      const downloadSpy = vi.spyOn(fileManager, 'downloadFile').mockImplementation(() => {});
      
      await fileManager.downloadFileWithCustomLocation(blob, filename);
      
      expect(downloadSpy).toHaveBeenCalledWith(blob, filename);
    });

    test('uses File System Access API when supported', async () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test.pdf';
      
      // Mock File System Access API
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn()
      };
      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable)
      };
      global.window.showSaveFilePicker = vi.fn().mockResolvedValue(mockFileHandle);
      
      await fileManager.downloadFileWithCustomLocation(blob, filename);
      
      expect(global.window.showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: filename,
        types: [
          {
            description: 'Archivos PDF',
            accept: {
              'application/pdf': ['.pdf'],
            },
          },
        ],
      });
      expect(mockFileHandle.createWritable).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalledWith(blob);
      expect(mockWritable.close).toHaveBeenCalled();
      
      // Cleanup
      delete global.window.showSaveFilePicker;
    });

    test('falls back to normal download when user cancels File System Access dialog', async () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test.pdf';
      
      // Mock File System Access API with user cancellation
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      global.window.showSaveFilePicker = vi.fn().mockRejectedValue(abortError);
      
      // Should not call downloadFile when user cancels
      const downloadSpy = vi.spyOn(fileManager, 'downloadFile').mockImplementation(() => {});
      
      await fileManager.downloadFileWithCustomLocation(blob, filename);
      
      expect(downloadSpy).not.toHaveBeenCalled();
      
      // Cleanup
      delete global.window.showSaveFilePicker;
    });

    test('falls back to normal download when File System Access API fails', async () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test.pdf';
      
      // Mock File System Access API with error
      global.window.showSaveFilePicker = vi.fn().mockRejectedValue(new Error('API Error'));
      
      const downloadSpy = vi.spyOn(fileManager, 'downloadFile').mockImplementation(() => {});
      
      await fileManager.downloadFileWithCustomLocation(blob, filename);
      
      expect(downloadSpy).toHaveBeenCalledWith(blob, filename);
      
      // Cleanup
      delete global.window.showSaveFilePicker;
    });

    test('throws error when blob is missing', async () => {
      await expect(fileManager.downloadFileWithCustomLocation(null, 'test.pdf'))
        .rejects.toThrow('Se requieren blob y nombre de archivo');
    });

    test('throws error when filename is missing', async () => {
      const blob = new Blob(['test content']);
      await expect(fileManager.downloadFileWithCustomLocation(blob, null))
        .rejects.toThrow('Se requieren blob y nombre de archivo');
    });
  });
});
