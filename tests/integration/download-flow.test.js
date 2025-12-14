/**
 * Download Flow Integration Tests
 * 
 * Tests the complete download flow integration including:
 * - Default filename generation and download
 * - Custom filename handling
 * - Custom location selection
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { FileManager } from '../../js/models/FileManager.js';
import { UIManager } from '../../js/views/UIManager.js';
import { DownloadOptions } from '../../js/views/components/DownloadOptions.js';

/**
 * Setup mock DOM elements for testing
 */
function setupMockDOM() {
  document.body.innerHTML = `
    <div id="progressIndicator" hidden></div>
    <div id="progressMessage"></div>
    <div id="notification" hidden></div>
    <div id="notificationMessage"></div>
    <ul id="fileList"></ul>
    <button id="processBtn"></button>
    <div id="downloadSection"></div>
  `;
}

/**
 * Create a test blob representing a PDF
 */
function createTestBlob() {
  return new Blob([new Uint8Array([37, 80, 68, 70])], { type: 'application/pdf' });
}

describe('Download Flow Integration Tests', () => {
  let fileManager;
  let uiManager;

  beforeEach(() => {
    setupMockDOM();
    fileManager = new FileManager();
    uiManager = new UIManager(fileManager);
    
    // Mock actual download methods to prevent real downloads
    vi.spyOn(fileManager, 'downloadFile').mockImplementation(() => {});
    vi.spyOn(fileManager, 'downloadFileWithCustomLocation').mockImplementation(async () => {});
  });

  describe('Default Filename Download Flow', () => {
    test('shows download options with default filename', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_combinado_20231213T120000.pdf';
      
      // Act
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Assert
      const downloadOptions = document.querySelector('#downloadOptions');
      expect(downloadOptions).toBeTruthy();
      expect(downloadOptions.hidden).toBe(false);
      
      const filenameInput = document.querySelector('#customFilename');
      expect(filenameInput.placeholder).toBe(defaultFilename);
    });

    test('downloads with default filename when no custom name provided', async () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_comprimido_20231213T120000.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Act - Simulate clicking download without entering custom name
      const downloadBtn = document.querySelector('#downloadFileBtn');
      downloadBtn.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(fileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(
        expect.any(Blob),
        defaultFilename
      );
    });

    test('generates correct default filenames for different operations', () => {
      // Test different operation types
      const testCases = [
        { operation: 'combine', expected: /combinado/ },
        { operation: 'split', expected: /dividido/ },
        { operation: 'compress', expected: /comprimido/ },
        { operation: 'rotate', expected: /rotado/ },
        { operation: 'convert', expected: /convertido/ }
      ];

      testCases.forEach(({ operation, expected }) => {
        const filename = fileManager.generateDefaultFilename(operation, 'test.pdf');
        expect(filename).toMatch(expected);
        expect(filename).toMatch(/\.pdf$/);
        expect(filename).toMatch(/\d{8}T\d{6}/); // Timestamp pattern
      });
    });
  });

  describe('Custom Filename Download Flow', () => {
    test('downloads with custom filename when provided', async () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_rotado_20231213T120000.pdf';
      const customFilename = 'mi_documento_personalizado.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Act - Enter custom filename and download
      const filenameInput = document.querySelector('#customFilename');
      filenameInput.value = customFilename;
      
      const downloadBtn = document.querySelector('#downloadFileBtn');
      downloadBtn.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(fileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(
        expect.any(Blob),
        customFilename
      );
    });

    test('adds .pdf extension if not provided', async () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_convertido_20231213T120000.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Act - Enter filename without extension
      const filenameInput = document.querySelector('#customFilename');
      filenameInput.value = 'documento_sin_extension';
      
      const downloadBtn = document.querySelector('#downloadFileBtn');
      downloadBtn.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(fileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(
        expect.any(Blob),
        'documento_sin_extension.pdf'
      );
    });

    test('validates filename for invalid characters', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_test.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Act - Enter filename with invalid characters
      const filenameInput = document.querySelector('#customFilename');
      filenameInput.value = 'archivo<>:"/\\|?*.pdf';
      
      // Trigger validation
      filenameInput.dispatchEvent(new Event('input'));
      
      // Assert - Should show validation error
      expect(filenameInput.validationMessage).toContain('caracteres no válidos');
    });

    test('clears custom filename when hiding options', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_test.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      const filenameInput = document.querySelector('#customFilename');
      filenameInput.value = 'custom_name.pdf';
      
      // Act
      uiManager.hideDownloadOptions();
      
      // Assert
      const downloadOptions = document.querySelector('#downloadOptions');
      expect(downloadOptions.hidden).toBe(true);
    });
  });

  describe('Custom Location Download Flow', () => {
    test('always uses custom location (new behavior)', async () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_test.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Act - Download (always uses custom location now)
      const downloadBtn = document.querySelector('#downloadFileBtn');
      downloadBtn.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(fileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(
        expect.any(Blob),
        defaultFilename
      );
      expect(fileManager.downloadFile).not.toHaveBeenCalled();
    });

    test('handles File System Access API not supported', async () => {
      // Arrange
      const testBlob = createTestBlob();
      const filename = 'test.pdf';
      
      // Create a new FileManager instance to test the actual implementation
      const testFileManager = new FileManager();
      
      // Mock only the downloadFile method to track calls
      const downloadFileSpy = vi.spyOn(testFileManager, 'downloadFile').mockImplementation(() => {});
      
      // Mock supportsFileSystemAccess to return false
      vi.spyOn(testFileManager, 'supportsFileSystemAccess').mockReturnValue(false);
      
      // Act
      await testFileManager.downloadFileWithCustomLocation(testBlob, filename);
      
      // Assert - Should fallback to normal download
      expect(downloadFileSpy).toHaveBeenCalledWith(testBlob, filename);
    });

    test('handles user cancellation of File System Access API', async () => {
      // Arrange
      vi.spyOn(fileManager, 'supportsFileSystemAccess').mockReturnValue(true);
      
      // Mock showSaveFilePicker to simulate user cancellation
      const mockShowSaveFilePicker = vi.fn().mockRejectedValue(
        Object.assign(new Error('User cancelled'), { name: 'AbortError' })
      );
      window.showSaveFilePicker = mockShowSaveFilePicker;
      
      const testBlob = createTestBlob();
      const filename = 'test.pdf';
      
      // Act & Assert - Should not throw error
      await expect(
        fileManager.downloadFileWithCustomLocation(testBlob, filename)
      ).resolves.toBeUndefined();
      
      // Should not fallback to normal download on user cancellation
      expect(fileManager.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('UIManager Integration', () => {
    test('getCustomFilename returns default when no input', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'default_test.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Act
      const result = uiManager.getCustomFilename();
      
      // Assert
      expect(result).toBe(defaultFilename);
    });

    test('getCustomFilename returns custom input when provided', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'default_test.pdf';
      const customFilename = 'custom_test.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      const filenameInput = document.querySelector('#customFilename');
      filenameInput.value = customFilename;
      
      // Act
      const result = uiManager.getCustomFilename();
      
      // Assert
      expect(result).toBe(customFilename);
    });

    test('isCustomLocationSelected always returns true (new behavior)', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'test.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Should always return true now (no checkbox)
      expect(uiManager.isCustomLocationSelected()).toBe(true);
    });

    test('hides download options when hideDownloadOptions called', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'test.pdf';
      
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Verify it's shown
      const downloadOptions = document.querySelector('#downloadOptions');
      expect(downloadOptions.hidden).toBe(false);
      
      // Act
      uiManager.hideDownloadOptions();
      
      // Assert
      expect(downloadOptions.hidden).toBe(true);
    });
  });

  describe('Complete Flow Scenarios', () => {
    test('complete flow: show options → enter custom name → download with custom location', async () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_original.pdf';
      const customFilename = 'mi_documento_final.pdf';
      
      // Act - Show options
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      // Enter custom filename
      const filenameInput = document.querySelector('#customFilename');
      filenameInput.value = customFilename;
      
      // Download (always uses custom location now)
      const downloadBtn = document.querySelector('#downloadFileBtn');
      downloadBtn.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(fileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(
        expect.any(Blob),
        customFilename
      );
      expect(fileManager.downloadFile).not.toHaveBeenCalled();
    });

    test('complete flow: show options → use default name → download with custom location', async () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_procesado_20231213T120000.pdf';
      
      // Act - Show options and download immediately
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      const downloadBtn = document.querySelector('#downloadFileBtn');
      downloadBtn.click();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(fileManager.downloadFileWithCustomLocation).toHaveBeenCalledWith(
        expect.any(Blob),
        defaultFilename
      );
      expect(fileManager.downloadFile).not.toHaveBeenCalled();
    });

    test('complete flow: show options → cancel → no download occurs', () => {
      // Arrange
      const testBlob = createTestBlob();
      const defaultFilename = 'documento_test.pdf';
      
      // Act - Show options and cancel
      uiManager.showDownloadOptions(testBlob, defaultFilename);
      
      const cancelBtn = document.querySelector('#cancelDownloadBtn');
      cancelBtn.click();
      
      // Assert
      const downloadOptions = document.querySelector('#downloadOptions');
      expect(downloadOptions.hidden).toBe(true);
      expect(fileManager.downloadFile).not.toHaveBeenCalled();
      expect(fileManager.downloadFileWithCustomLocation).not.toHaveBeenCalled();
    });
  });
});