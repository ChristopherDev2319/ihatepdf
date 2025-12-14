import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PDFSplitController } from '../../../js/controllers/PDFSplitController.js';
import { PDFOperations } from '../../../js/models/PDFOperations.js';
import { FileManager } from '../../../js/models/FileManager.js';
import { UIManager } from '../../../js/views/UIManager.js';

// Helper function to create a test PDF file with specified number of pages
async function createTestPDF(pageCount) {
  const { PDFDocument: PDFLibDocument } = await import('pdf-lib');
  const pdfDoc = await PDFLibDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage();
  }
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
  
  // Polyfill arrayBuffer method if not available (jsdom compatibility)
  if (!file.arrayBuffer) {
    file.arrayBuffer = async function() {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(this);
      });
    };
  }
  
  return file;
}

describe('PDFSplitController - Unit Tests', () => {
  let controller;
  let mockPDFOperations;
  let mockFileManager;
  let mockUIManager;

  beforeEach(() => {
    // Create mock instances
    mockPDFOperations = {
      splitPDF: vi.fn()
    };

    mockFileManager = {
      validatePDFFile: vi.fn(),
      downloadFile: vi.fn(),
      generateDefaultFilename: vi.fn(),
      downloadFileWithCustomLocation: vi.fn()
    };

    mockUIManager = {
      showProgress: vi.fn(),
      hideProgress: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      updateFileList: vi.fn(),
      clearFileList: vi.fn(),
      enableControls: vi.fn(),
      disableControls: vi.fn(),
      showDownloadOptions: vi.fn(),
      hideDownloadOptions: vi.fn(),
      getCustomFilename: vi.fn(),
      isCustomLocationSelected: vi.fn()
    };

    controller = new PDFSplitController(mockPDFOperations, mockFileManager, mockUIManager);
  });

  describe('handleFileSelection', () => {
    test('handles file selection successfully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      mockFileManager.validatePDFFile.mockReturnValue(true);
      
      // Mock the _loadPageCount method
      controller._loadPageCount = vi.fn().mockResolvedValue();
      controller.totalPages = 5;

      await controller.handleFileSelection(mockFile);

      expect(mockFileManager.validatePDFFile).toHaveBeenCalledWith(mockFile);
      expect(controller.selectedFile).toBe(mockFile);
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('handles FileList input', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      const mockFileList = {
        0: mockFile,
        length: 1,
        item: (index) => index === 0 ? mockFile : null
      };
      Object.setPrototypeOf(mockFileList, FileList.prototype);

      mockFileManager.validatePDFFile.mockReturnValue(true);
      
      // Mock the _loadPageCount method
      controller._loadPageCount = vi.fn().mockResolvedValue();
      controller.totalPages = 5;

      await controller.handleFileSelection(mockFileList);

      expect(controller.selectedFile).toBe(mockFile);
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('rejects invalid PDF files', async () => {
      const invalidFile = new File(['not a pdf'], 'invalid.txt', { type: 'text/plain' });
      mockFileManager.validatePDFFile.mockReturnValue(false);

      await controller.handleFileSelection(invalidFile);

      expect(controller.selectedFile).toBeNull();
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('no es un PDF válido')
      );
    });

    test('handles empty file selection', async () => {
      await controller.handleFileSelection(null);

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('No se seleccionó ningún archivo')
      );
    });

    test('handles file loading errors', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      mockFileManager.validatePDFFile.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await controller.handleFileSelection(mockFile);

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Validation failed')
      );
    });
  });



  describe('handleSplit', () => {
    test('validates that file is selected', async () => {
      controller.selectedFile = null;

      await controller.handleSplit();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('seleccionar un archivo')
      );
      expect(mockPDFOperations.splitPDF).not.toHaveBeenCalled();
    });

    test('validates that split mode is selected', async () => {
      controller.selectedFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.splitMode = null;

      await controller.handleSplit();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('seleccionar cómo quieres dividir')
      );
      expect(mockPDFOperations.splitPDF).not.toHaveBeenCalled();
    });

    test('splits PDF successfully with download options for single file', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      const initialRanges = [{ start: 1, end: 3 }];
      controller.selectedFile = mockFile;
      controller.splitMode = 'ranges';

      const mockSplitPDFs = [new Uint8Array([1, 2, 3])];
      const mockDefaultFilename = 'test_dividido_20231213T120000.pdf';
      
      mockPDFOperations.splitPDF.mockResolvedValue(mockSplitPDFs);
      mockFileManager.generateDefaultFilename.mockReturnValue(mockDefaultFilename);

      // Mock generateRanges and validation methods
      controller.generateRanges = vi.fn().mockReturnValue(initialRanges);
      controller._validateRanges = vi.fn().mockReturnValue({ valid: true });

      await controller.handleSplit();

      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalledWith('Dividiendo PDF...');
      expect(mockPDFOperations.splitPDF).toHaveBeenCalledWith(mockFile, initialRanges);
      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalledWith('split', 'test.pdf');
      expect(mockUIManager.showDownloadOptions).toHaveBeenCalledWith(
        expect.any(Blob),
        mockDefaultFilename
      );
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('PDF dividido exitosamente')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('splits PDF successfully with direct download for multiple files', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      const initialRanges = [
        { start: 1, end: 3 },
        { start: 5, end: 7 }
      ];
      controller.selectedFile = mockFile;
      controller.splitMode = 'ranges';

      const mockSplitPDFs = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6])
      ];
      mockPDFOperations.splitPDF.mockResolvedValue(mockSplitPDFs);
      mockFileManager.generateDefaultFilename.mockReturnValue('test_dividido.pdf');

      // Mock generateRanges and validation methods
      controller.generateRanges = vi.fn().mockReturnValue(initialRanges);
      controller._validateRanges = vi.fn().mockReturnValue({ valid: true });
      controller._generateSplitFilename = vi.fn()
        .mockReturnValueOnce('test_dividido_parte1.pdf')
        .mockReturnValueOnce('test_dividido_parte2.pdf');

      await controller.handleSplit();

      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalledWith('Dividiendo PDF...');
      expect(mockPDFOperations.splitPDF).toHaveBeenCalledWith(mockFile, initialRanges);
      expect(mockFileManager.downloadFile).toHaveBeenCalledTimes(2);
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('PDF dividido exitosamente en 2 archivos')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('handles split errors gracefully', async () => {
      controller.selectedFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.splitMode = 'ranges';

      // Mock methods
      controller.generateRanges = vi.fn().mockReturnValue([{ start: 1, end: 3 }]);
      controller._validateRanges = vi.fn().mockReturnValue({ valid: true });
      mockPDFOperations.splitPDF.mockRejectedValue(new Error('Split failed'));

      await controller.handleSplit();

      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Split failed')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('ensures controls are re-enabled even on error', async () => {
      controller.selectedFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.splitMode = 'ranges';

      // Mock methods
      controller.generateRanges = vi.fn().mockReturnValue([{ start: 1, end: 3 }]);
      controller._validateRanges = vi.fn().mockReturnValue({ valid: true });
      mockPDFOperations.splitPDF.mockRejectedValue(new Error('Test error'));

      await controller.handleSplit();

      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });
  });

  describe('Integration with Model and View', () => {
    test('properly coordinates between Model and View during split operation with single file', async () => {
      const mockFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.splitMode = 'ranges';

      const mockSplitPDFs = [new Uint8Array([1, 2, 3, 4, 5])];
      const mockDefaultFilename = 'document_dividido_20231213T120000.pdf';
      
      mockPDFOperations.splitPDF.mockResolvedValue(mockSplitPDFs);
      mockFileManager.generateDefaultFilename.mockReturnValue(mockDefaultFilename);

      // Mock required methods
      controller.generateRanges = vi.fn().mockReturnValue([{ start: 1, end: 5 }]);
      controller._validateRanges = vi.fn().mockReturnValue({ valid: true });

      await controller.handleSplit();

      // Verify all methods were called
      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockPDFOperations.splitPDF).toHaveBeenCalled();
      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalled();
      expect(mockUIManager.showDownloadOptions).toHaveBeenCalled();
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('properly coordinates between Model and View during split operation with multiple files', async () => {
      const mockFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.splitMode = 'ranges';

      const mockSplitPDFs = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6])
      ];
      mockPDFOperations.splitPDF.mockResolvedValue(mockSplitPDFs);
      mockFileManager.generateDefaultFilename.mockReturnValue('document_dividido.pdf');

      // Mock required methods
      controller.generateRanges = vi.fn().mockReturnValue([{ start: 1, end: 3 }, { start: 4, end: 6 }]);
      controller._validateRanges = vi.fn().mockReturnValue({ valid: true });
      controller._generateSplitFilename = vi.fn()
        .mockReturnValueOnce('document_dividido_parte1.pdf')
        .mockReturnValueOnce('document_dividido_parte2.pdf');

      await controller.handleSplit();

      // Verify all methods were called
      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockPDFOperations.splitPDF).toHaveBeenCalled();
      expect(mockFileManager.downloadFile).toHaveBeenCalledTimes(2);
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });
  });
});
