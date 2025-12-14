import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { DownloadOptions } from '../../../js/views/components/DownloadOptions.js';

describe('DownloadOptions - Unit Tests', () => {
  let dom;
  let document;
  let downloadOptions;
  let mockFileManager;

  beforeEach(() => {
    // Crear un DOM simulado para las pruebas
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="downloadSection"></div>
        </body>
      </html>
    `);
    
    global.document = dom.window.document;
    global.window = dom.window;
    
    // Mock del FileManager
    mockFileManager = {
      downloadFile: vi.fn(),
      downloadFileWithCustomLocation: vi.fn().mockResolvedValue(undefined),
      supportsFileSystemAccess: vi.fn().mockReturnValue(true),
      isMobileDevice: vi.fn().mockReturnValue(false),
      getFileSystemAccessUnavailableReason: vi.fn().mockReturnValue('Test reason')
    };
    
    downloadOptions = new DownloadOptions(mockFileManager);
  });

  afterEach(() => {
    if (downloadOptions) {
      downloadOptions.destroy();
    }
  });

  describe('Component Creation', () => {
    test('should create component with correct structure', () => {
      const element = downloadOptions.getElement();
      
      expect(element).toBeTruthy();
      expect(element.className).toBe('download-options');
      expect(element.hidden).toBe(true);
      expect(element.getAttribute('role')).toBe('region');
      expect(element.getAttribute('aria-label')).toBe('Opciones de descarga');
    });

    test('should create dynamic structure based on browser support', () => {
      const element = downloadOptions.getElement();
      
      // Initially, only the content container should exist
      const contentDiv = element.querySelector('.download-options__content');
      expect(contentDiv).toBeTruthy();
      
      // Form elements are created dynamically in show() method
      const filenameInput = element.querySelector('#customFilename');
      const downloadButton = element.querySelector('#downloadFileBtn');
      
      expect(filenameInput).toBeNull(); // Not created until show() is called
      expect(downloadButton).toBeNull(); // Not created until show() is called
    });
  });

  describe('Show/Hide Functionality', () => {
    test('should show download options with correct default filename for non-compatible browsers', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.isMobileDevice.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const defaultFilename = 'test_document.pdf';
      
      downloadOptions.show(mockBlob, defaultFilename);
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      
      expect(element.hidden).toBe(false);
      expect(filenameInput).toBeTruthy(); // Should exist for non-compatible browsers
      expect(filenameInput.placeholder).toBe(defaultFilename);
      expect(filenameInput.value).toBe('');
    });

    test('should show download options for compatible browsers without filename input', () => {
      // Mock FileManager to simulate compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(true);
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const defaultFilename = 'test_document.pdf';
      
      downloadOptions.show(mockBlob, defaultFilename);
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      const downloadButton = element.querySelector('#downloadFileBtn');
      
      expect(element.hidden).toBe(false);
      expect(filenameInput).toBeNull(); // Should not exist for compatible browsers
      expect(downloadButton).toBeTruthy(); // Should have download button
      expect(downloadButton.textContent.trim()).toBe('Elegir ubicación y guardar');
    });

    test('should hide download options and clear data', () => {
      // Mock FileManager to simulate non-compatible browser for this test
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      downloadOptions.show(mockBlob, 'test.pdf');
      downloadOptions.hide();
      
      const element = downloadOptions.getElement();
      
      expect(element.hidden).toBe(true);
      expect(downloadOptions.currentBlob).toBe(null);
      expect(downloadOptions.defaultFilename).toBe('');
    });

    test('should throw error when showing without required parameters', () => {
      expect(() => {
        downloadOptions.show(null, 'test.pdf');
      }).toThrow('Se requieren blob y nombre por defecto');
      
      expect(() => {
        downloadOptions.show(new Blob(['test']), null);
      }).toThrow('Se requieren blob y nombre por defecto');
    });

    test('should clear filename input when showing', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      // First show to create the elements
      downloadOptions.show(mockBlob, 'test.pdf');
      
      const element = downloadOptions.getElement();
      let filenameInput = element.querySelector('#customFilename');
      
      // Set some value first
      filenameInput.value = 'previous_value.pdf';
      
      // Show again to test clearing
      downloadOptions.show(mockBlob, 'test.pdf');
      
      // Get the input again since the structure was recreated
      filenameInput = element.querySelector('#customFilename');
      
      expect(filenameInput.value).toBe('');
      expect(filenameInput.placeholder).toBe('test.pdf');
    });
  });

  describe('Custom Filename Functionality', () => {
    test('should return default filename when no custom name provided', () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const defaultFilename = 'default_document.pdf';
      
      downloadOptions.show(mockBlob, defaultFilename);
      
      expect(downloadOptions.getCustomFilename()).toBe(defaultFilename);
    });

    test('should return default filename for compatible browsers (no input field)', () => {
      // Mock FileManager to simulate compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(true);
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const defaultFilename = 'default_document.pdf';
      
      downloadOptions.show(mockBlob, defaultFilename);
      
      // Should return default filename since there's no input field
      expect(downloadOptions.getCustomFilename()).toBe(defaultFilename);
    });

    test('should return custom filename when provided', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      downloadOptions.show(mockBlob, 'default.pdf');
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      filenameInput.value = 'custom_name.pdf';
      
      expect(downloadOptions.getCustomFilename()).toBe('custom_name.pdf');
    });

    test('should add .pdf extension if missing', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      downloadOptions.show(mockBlob, 'default.pdf');
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      filenameInput.value = 'custom_name';
      
      expect(downloadOptions.getCustomFilename()).toBe('custom_name.pdf');
    });

    test('should handle whitespace in custom filename', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      downloadOptions.show(mockBlob, 'default.pdf');
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      filenameInput.value = '  custom_name.pdf  ';
      
      expect(downloadOptions.getCustomFilename()).toBe('custom_name.pdf');
    });
  });

  describe('Custom Location Functionality', () => {
    test('should always return true for custom location (new behavior)', () => {
      expect(downloadOptions.isCustomLocationSelected()).toBe(true);
    });

    test('should always use custom location regardless of UI state', () => {
      const testBlob = new Blob(['test'], { type: 'application/pdf' });
      downloadOptions.show(testBlob, 'test.pdf');
      
      // Should always return true (no checkbox anymore)
      expect(downloadOptions.isCustomLocationSelected()).toBe(true);
    });
  });

  describe('Download Functionality', () => {
    test('should always call downloadFileWithCustomLocation (new behavior)', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const filename = 'test.pdf';
      
      downloadOptions.show(mockBlob, filename);
      
      await downloadOptions.handleDownload();
      
      expect(mockFileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(mockBlob, filename);
      expect(mockFileManager.downloadFile).not.toHaveBeenCalled();
    });

    test('should use custom filename in download', async () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      downloadOptions.show(mockBlob, 'default.pdf');
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      filenameInput.value = 'custom.pdf';
      
      await downloadOptions.handleDownload();
      
      expect(mockFileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(mockBlob, 'custom.pdf');
    });

    test('should hide options after successful download', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      downloadOptions.show(mockBlob, 'test.pdf');
      
      await downloadOptions.handleDownload();
      
      const element = downloadOptions.getElement();
      expect(element.hidden).toBe(true);
    });

    test('should handle download errors gracefully', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFileManager.downloadFileWithCustomLocation.mockImplementation(() => {
        throw new Error('Download failed');
      });
      
      downloadOptions.show(mockBlob, 'test.pdf');
      
      await downloadOptions.handleDownload();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error durante la descarga:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cancel Functionality', () => {
    test('should hide options when cancel button clicked', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      
      downloadOptions.show(mockBlob, 'test.pdf');
      
      const element = downloadOptions.getElement();
      const cancelButton = element.querySelector('#cancelDownloadBtn');
      
      // Simular click en cancelar
      cancelButton.click();
      
      expect(element.hidden).toBe(true);
    });
  });

  describe('Filename Validation', () => {
    test('should validate filename with invalid characters', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      downloadOptions.show(mockBlob, 'test.pdf');
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      
      filenameInput.value = 'invalid<>:"/\\|?*name.pdf';
      
      downloadOptions.validateFilename();
      
      // Verificar que se estableció un mensaje de validación personalizado
      expect(filenameInput.validity.customError).toBe(true);
    });

    test('should clear validation for valid filename', () => {
      // Mock FileManager to simulate non-compatible browser
      mockFileManager.supportsFileSystemAccess.mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason.mockReturnValue('Test reason');
      
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      downloadOptions.show(mockBlob, 'test.pdf');
      
      const element = downloadOptions.getElement();
      const filenameInput = element.querySelector('#customFilename');
      
      filenameInput.value = 'valid_filename.pdf';
      
      downloadOptions.validateFilename();
      
      expect(filenameInput.validity.customError).toBe(false);
    });
  });

  describe('Contextual Information', () => {
    test('should show info when File System Access API not supported', () => {
      // Mock FileManager to return false for API support
      mockFileManager.supportsFileSystemAccess = vi.fn().mockReturnValue(false);
      mockFileManager.getFileSystemAccessUnavailableReason = vi.fn().mockReturnValue('Test reason');
      
      const testBlob = new Blob(['test'], { type: 'application/pdf' });
      downloadOptions.show(testBlob, 'test.pdf');
      
      const infoDiv = downloadOptions.container.querySelector('#downloadInfo');
      const infoText = downloadOptions.container.querySelector('#downloadInfoText');
      
      expect(infoDiv.hidden).toBe(false);
      expect(infoText.textContent).toBe('Test reason');
    });

    test('should hide info when File System Access API is supported', () => {
      // Mock FileManager to return true for API support
      mockFileManager.supportsFileSystemAccess.mockReturnValue(true);
      
      const testBlob = new Blob(['test'], { type: 'application/pdf' });
      downloadOptions.show(testBlob, 'test.pdf');
      
      const infoDiv = downloadOptions.container.querySelector('#downloadInfo');
      
      expect(infoDiv).toBeNull(); // Info div should not exist for compatible browsers
    });
  });

  describe('Component Destruction', () => {
    test('should clean up resources when destroyed', () => {
      const element = downloadOptions.getElement();
      const parent = dom.window.document.createElement('div');
      parent.appendChild(element);
      
      downloadOptions.destroy();
      
      expect(downloadOptions.container).toBe(null);
      expect(downloadOptions.filenameInput).toBe(null);
      expect(downloadOptions.downloadButton).toBe(null);
      expect(downloadOptions.currentBlob).toBe(null);
      expect(downloadOptions.defaultFilename).toBe('');
    });
  });
});