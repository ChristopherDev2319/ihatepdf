import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PDFCombineController } from '../../../js/controllers/PDFCombineController.js';
import { PDFOperations } from '../../../js/models/PDFOperations.js';
import { FileManager } from '../../../js/models/FileManager.js';
import { UIManager } from '../../../js/views/UIManager.js';

describe('PDFCombineController - Unit Tests', () => {
  let controller;
  let mockPDFOperations;
  let mockFileManager;
  let mockUIManager;

  beforeEach(() => {
    // Create mock instances
    mockPDFOperations = {
      combinePDFs: vi.fn()
    };

    mockFileManager = {
      loadFiles: vi.fn(),
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

    controller = new PDFCombineController(mockPDFOperations, mockFileManager, mockUIManager);
  });

  describe('handleFileSelection', () => {
    test('loads and validates PDF files successfully', async () => {
      const mockFile1 = new File(['%PDF-1.4'], 'test1.pdf', { type: 'application/pdf' });
      const mockFile2 = new File(['%PDF-1.4'], 'test2.pdf', { type: 'application/pdf' });
      const mockFileList = [mockFile1, mockFile2];

      mockFileManager.loadFiles.mockResolvedValue([mockFile1, mockFile2]);
      mockFileManager.validatePDFFile.mockReturnValue(true);

      await controller.handleFileSelection(mockFileList);

      expect(mockFileManager.loadFiles).toHaveBeenCalledWith(mockFileList);
      expect(mockFileManager.validatePDFFile).toHaveBeenCalledTimes(2);
      expect(controller.selectedFiles).toHaveLength(2);
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('filters out invalid PDF files and shows error', async () => {
      const validPDF = new File(['%PDF-1.4'], 'valid.pdf', { type: 'application/pdf' });
      const invalidFile = new File(['not a pdf'], 'invalid.txt', { type: 'text/plain' });
      
      mockFileManager.loadFiles.mockResolvedValue([validPDF, invalidFile]);
      mockFileManager.validatePDFFile.mockImplementation((file) => file.name === 'valid.pdf');

      await controller.handleFileSelection([validPDF, invalidFile]);

      expect(controller.selectedFiles).toHaveLength(1);
      expect(controller.selectedFiles[0].name).toBe('valid.pdf');
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('invalid.txt')
      );
    });

    test('handles file loading errors', async () => {
      mockFileManager.loadFiles.mockRejectedValue(new Error('Load failed'));

      await controller.handleFileSelection([]);

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Load failed')
      );
    });
  });

  describe('handleReorder', () => {
    beforeEach(() => {
      // Setup initial files
      controller.selectedFiles = [
        new File(['1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['2'], 'file2.pdf', { type: 'application/pdf' }),
        new File(['3'], 'file3.pdf', { type: 'application/pdf' })
      ];
    });

    test('reorders files correctly', () => {
      controller.handleReorder(0, 2);

      expect(controller.selectedFiles[0].name).toBe('file2.pdf');
      expect(controller.selectedFiles[1].name).toBe('file3.pdf');
      expect(controller.selectedFiles[2].name).toBe('file1.pdf');
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('handles reordering from end to beginning', () => {
      controller.handleReorder(2, 0);

      expect(controller.selectedFiles[0].name).toBe('file3.pdf');
      expect(controller.selectedFiles[1].name).toBe('file1.pdf');
      expect(controller.selectedFiles[2].name).toBe('file2.pdf');
    });

    test('ignores invalid indices', () => {
      const originalOrder = [...controller.selectedFiles];
      
      controller.handleReorder(-1, 1);
      expect(controller.selectedFiles).toEqual(originalOrder);
      
      controller.handleReorder(0, 10);
      expect(controller.selectedFiles).toEqual(originalOrder);
    });
  });

  describe('handleRemoveFile', () => {
    beforeEach(() => {
      controller.selectedFiles = [
        new File(['1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['2'], 'file2.pdf', { type: 'application/pdf' })
      ];
    });

    test('removes file at specified index', () => {
      controller.handleRemoveFile(0);

      expect(controller.selectedFiles).toHaveLength(1);
      expect(controller.selectedFiles[0].name).toBe('file2.pdf');
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('ignores invalid indices', () => {
      controller.handleRemoveFile(-1);
      expect(controller.selectedFiles).toHaveLength(2);

      controller.handleRemoveFile(10);
      expect(controller.selectedFiles).toHaveLength(2);
    });
  });

  describe('handleCombine', () => {
    test('validates empty file selection (edge case)', async () => {
      controller.selectedFiles = [];

      await controller.handleCombine();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('al menos 2 archivos')
      );
      expect(mockPDFOperations.combinePDFs).not.toHaveBeenCalled();
    });

    test('validates single file selection (edge case)', async () => {
      controller.selectedFiles = [
        new File(['%PDF-1.4'], 'single.pdf', { type: 'application/pdf' })
      ];

      await controller.handleCombine();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('al menos 2 archivos')
      );
      expect(mockPDFOperations.combinePDFs).not.toHaveBeenCalled();
    });

    test('combines PDFs successfully with valid files and shows download options', async () => {
      const file1 = new File(['%PDF-1.4'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['%PDF-1.4'], 'test2.pdf', { type: 'application/pdf' });
      controller.selectedFiles = [file1, file2];

      const mockCombinedPDF = new Uint8Array([1, 2, 3, 4]);
      const mockDefaultFilename = 'test1_combinado_20231213T120000.pdf';
      
      mockPDFOperations.combinePDFs.mockResolvedValue(mockCombinedPDF);
      mockFileManager.generateDefaultFilename.mockReturnValue(mockDefaultFilename);

      await controller.handleCombine();

      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalledWith('Combinando PDFs...');
      expect(mockPDFOperations.combinePDFs).toHaveBeenCalledWith([file1, file2]);
      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalledWith('combine', 'test1.pdf');
      expect(mockUIManager.showDownloadOptions).toHaveBeenCalledWith(
        expect.any(Blob),
        mockDefaultFilename
      );
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('PDFs combinados exitosamente')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
      expect(controller.selectedFiles).toHaveLength(0);
    });

    test('handles combination errors gracefully', async () => {
      controller.selectedFiles = [
        new File(['%PDF-1.4'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['%PDF-1.4'], 'test2.pdf', { type: 'application/pdf' })
      ];

      mockPDFOperations.combinePDFs.mockRejectedValue(new Error('Combination failed'));

      await controller.handleCombine();

      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Combination failed')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('ensures controls are re-enabled even on error', async () => {
      controller.selectedFiles = [
        new File(['%PDF-1.4'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['%PDF-1.4'], 'test2.pdf', { type: 'application/pdf' })
      ];

      mockPDFOperations.combinePDFs.mockRejectedValue(new Error('Test error'));

      await controller.handleCombine();

      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });
  });

  describe('Integration with Model and View', () => {
    test('properly coordinates between Model and View during combine operation', async () => {
      const file1 = new File(['%PDF-1.4'], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File(['%PDF-1.4'], 'doc2.pdf', { type: 'application/pdf' });
      controller.selectedFiles = [file1, file2];

      const mockCombinedPDF = new Uint8Array([5, 6, 7, 8]);
      const mockDefaultFilename = 'doc1_combinado_20231213T120000.pdf';
      
      mockPDFOperations.combinePDFs.mockResolvedValue(mockCombinedPDF);
      mockFileManager.generateDefaultFilename.mockReturnValue(mockDefaultFilename);

      await controller.handleCombine();

      // Verify all methods were called
      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockPDFOperations.combinePDFs).toHaveBeenCalled();
      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalled();
      expect(mockUIManager.showDownloadOptions).toHaveBeenCalled();
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('uses first file name for default filename generation', async () => {
      const file1 = new File(['%PDF-1.4'], 'document1.pdf', { type: 'application/pdf' });
      const file2 = new File(['%PDF-1.4'], 'document2.pdf', { type: 'application/pdf' });
      controller.selectedFiles = [file1, file2];

      const mockCombinedPDF = new Uint8Array([1, 2, 3, 4]);
      mockPDFOperations.combinePDFs.mockResolvedValue(mockCombinedPDF);
      mockFileManager.generateDefaultFilename.mockReturnValue('document1_combinado.pdf');

      await controller.handleCombine();

      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalledWith('combine', 'document1.pdf');
    });

    test('handles empty file list for filename generation', async () => {
      // This shouldn't happen in normal flow, but test defensive programming
      controller.selectedFiles = [];

      await controller.handleCombine();

      // Should show error before reaching filename generation
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('al menos 2 archivos')
      );
      expect(mockFileManager.generateDefaultFilename).not.toHaveBeenCalled();
    });
  });
});
