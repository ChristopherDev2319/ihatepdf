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
      downloadFile: vi.fn()
    };

    mockUIManager = {
      showProgress: vi.fn(),
      hideProgress: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      updateFileList: vi.fn(),
      clearFileList: vi.fn(),
      enableControls: vi.fn(),
      disableControls: vi.fn()
    };

    controller = new PDFSplitController(mockPDFOperations, mockFileManager, mockUIManager);
  });

  describe('handleFileSelection', () => {
    test('handles file selection successfully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      mockFileManager.validatePDFFile.mockReturnValue(true);

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

  describe('handleRangeInput - parsing', () => {
    test('parses single page range correctly', async () => {
      const mockFile = await createTestPDF(5);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1-3');

      expect(result).toBe(true);
      expect(controller.pageRanges).toEqual([{ start: 1, end: 3 }]);
    });

    test('parses multiple page ranges correctly', async () => {
      const mockFile = await createTestPDF(15);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1-3, 5-7, 10-12');

      expect(result).toBe(true);
      expect(controller.pageRanges).toEqual([
        { start: 1, end: 3 },
        { start: 5, end: 7 },
        { start: 10, end: 12 }
      ]);
    });

    test('parses individual pages correctly', async () => {
      const mockFile = await createTestPDF(10);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1, 3, 5');

      expect(result).toBe(true);
      expect(controller.pageRanges).toEqual([
        { start: 1, end: 1 },
        { start: 3, end: 3 },
        { start: 5, end: 5 }
      ]);
    });

    test('parses mixed ranges and individual pages', async () => {
      const mockFile = await createTestPDF(10);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1-3, 5, 7-9');

      expect(result).toBe(true);
      expect(controller.pageRanges).toEqual([
        { start: 1, end: 3 },
        { start: 5, end: 5 },
        { start: 7, end: 9 }
      ]);
    });
  });

  describe('handleRangeInput - validation of invalid ranges (edge case)', () => {
    test('rejects ranges with start page less than 1', async () => {
      const mockFile = await createTestPDF(5);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('0-3');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('fuera de rango')
      );
    });

    test('rejects ranges with end page greater than total pages', async () => {
      const mockFile = await createTestPDF(5);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1-100');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('fuera de rango')
      );
    });

    test('rejects ranges where start is greater than end', async () => {
      const mockFile = await createTestPDF(5);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('5-3');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Rango inválido')
      );
    });

    test('rejects empty range input', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('al menos un rango')
      );
    });

    test('requires file to be selected before parsing ranges', async () => {
      controller.selectedFile = null;

      const result = await controller.handleRangeInput('1-3');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('seleccionar un archivo')
      );
    });
  });

  describe('handleRangeInput - validation of overlapping ranges (edge case)', () => {
    test('rejects overlapping ranges', async () => {
      const mockFile = await createTestPDF(10);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1-5, 3-7');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('se superponen')
      );
    });

    test('rejects ranges that touch at boundaries', async () => {
      const mockFile = await createTestPDF(10);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1-3, 3-5');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('se superponen')
      );
    });

    test('rejects completely overlapping ranges', async () => {
      const mockFile = await createTestPDF(10);
      controller.selectedFile = mockFile;

      const result = await controller.handleRangeInput('1-10, 3-5');

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('se superponen')
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

    test('validates that ranges are specified', async () => {
      controller.selectedFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.pageRanges = [];

      await controller.handleSplit();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('especificar rangos')
      );
      expect(mockPDFOperations.splitPDF).not.toHaveBeenCalled();
    });

    test('splits PDF successfully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      const initialRanges = [
        { start: 1, end: 3 },
        { start: 5, end: 7 }
      ];
      controller.selectedFile = mockFile;
      controller.pageRanges = initialRanges;

      const mockSplitPDFs = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6])
      ];
      mockPDFOperations.splitPDF.mockResolvedValue(mockSplitPDFs);

      await controller.handleSplit();

      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalledWith('Dividiendo PDF...');
      expect(mockPDFOperations.splitPDF).toHaveBeenCalledWith(mockFile, initialRanges);
      expect(mockFileManager.downloadFile).toHaveBeenCalledTimes(2);
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('dividido exitosamente')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
      expect(controller.selectedFile).toBeNull();
      expect(controller.pageRanges).toEqual([]);
    });

    test('handles split errors gracefully', async () => {
      controller.selectedFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.pageRanges = [{ start: 1, end: 3 }];

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
      controller.pageRanges = [{ start: 1, end: 3 }];

      mockPDFOperations.splitPDF.mockRejectedValue(new Error('Test error'));

      await controller.handleSplit();

      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });
  });

  describe('Integration with Model and View', () => {
    test('properly coordinates between Model and View during split operation', async () => {
      const mockFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.pageRanges = [{ start: 1, end: 5 }];

      const mockSplitPDFs = [new Uint8Array([1, 2, 3, 4, 5])];
      mockPDFOperations.splitPDF.mockResolvedValue(mockSplitPDFs);

      await controller.handleSplit();

      // Verify all methods were called
      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockPDFOperations.splitPDF).toHaveBeenCalled();
      expect(mockFileManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });
  });
});
