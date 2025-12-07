import { describe, test, expect, beforeEach, vi } from 'vitest';
import { JPGToPDFController } from '../../../js/controllers/JPGToPDFController.js';
import { PDFOperations } from '../../../js/models/PDFOperations.js';
import { FileManager } from '../../../js/models/FileManager.js';
import { UIManager } from '../../../js/views/UIManager.js';

describe('JPGToPDFController - Unit Tests', () => {
  let controller;
  let mockPDFOperations;
  let mockFileManager;
  let mockUIManager;

  beforeEach(() => {
    // Create mock instances
    mockPDFOperations = {
      convertJPGToPDF: vi.fn()
    };

    mockFileManager = {
      loadFiles: vi.fn(),
      validateJPGFile: vi.fn(),
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

    controller = new JPGToPDFController(mockPDFOperations, mockFileManager, mockUIManager);
  });

  describe('handleFileSelection', () => {
    test('loads and validates JPG files successfully', async () => {
      const mockFile1 = new File(['fake-jpg-data'], 'image1.jpg', { type: 'image/jpeg' });
      const mockFile2 = new File(['fake-jpg-data'], 'image2.jpeg', { type: 'image/jpeg' });
      const mockFileList = [mockFile1, mockFile2];

      mockFileManager.loadFiles.mockResolvedValue([mockFile1, mockFile2]);
      mockFileManager.validateJPGFile.mockReturnValue(true);

      await controller.handleFileSelection(mockFileList);

      expect(mockFileManager.loadFiles).toHaveBeenCalledWith(mockFileList);
      expect(mockFileManager.validateJPGFile).toHaveBeenCalledTimes(2);
      expect(controller.selectedFiles).toHaveLength(2);
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('filters out invalid JPG files and shows error (edge case)', async () => {
      const validJPG = new File(['fake-jpg-data'], 'valid.jpg', { type: 'image/jpeg' });
      const invalidFile = new File(['not a jpg'], 'invalid.txt', { type: 'text/plain' });
      
      mockFileManager.loadFiles.mockResolvedValue([validJPG, invalidFile]);
      mockFileManager.validateJPGFile.mockImplementation((file) => file.name === 'valid.jpg');

      await controller.handleFileSelection([validJPG, invalidFile]);

      expect(controller.selectedFiles).toHaveLength(1);
      expect(controller.selectedFiles[0].name).toBe('valid.jpg');
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('invalid.txt')
      );
    });

    test('rejects PDF files when expecting JPG (edge case)', async () => {
      const pdfFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      
      mockFileManager.loadFiles.mockResolvedValue([pdfFile]);
      mockFileManager.validateJPGFile.mockReturnValue(false);

      await controller.handleFileSelection([pdfFile]);

      expect(controller.selectedFiles).toHaveLength(0);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('document.pdf')
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
        new File(['1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'image2.jpg', { type: 'image/jpeg' }),
        new File(['3'], 'image3.jpg', { type: 'image/jpeg' })
      ];
    });

    test('reorders files correctly', () => {
      controller.handleReorder(0, 2);

      expect(controller.selectedFiles[0].name).toBe('image2.jpg');
      expect(controller.selectedFiles[1].name).toBe('image3.jpg');
      expect(controller.selectedFiles[2].name).toBe('image1.jpg');
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('handles reordering from end to beginning', () => {
      controller.handleReorder(2, 0);

      expect(controller.selectedFiles[0].name).toBe('image3.jpg');
      expect(controller.selectedFiles[1].name).toBe('image1.jpg');
      expect(controller.selectedFiles[2].name).toBe('image2.jpg');
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
        new File(['1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'image2.jpg', { type: 'image/jpeg' })
      ];
    });

    test('removes file at specified index', () => {
      controller.handleRemoveFile(0);

      expect(controller.selectedFiles).toHaveLength(1);
      expect(controller.selectedFiles[0].name).toBe('image2.jpg');
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('ignores invalid indices', () => {
      controller.handleRemoveFile(-1);
      expect(controller.selectedFiles).toHaveLength(2);

      controller.handleRemoveFile(10);
      expect(controller.selectedFiles).toHaveLength(2);
    });
  });

  describe('handleConvert', () => {
    test('validates empty file selection (edge case)', async () => {
      controller.selectedFiles = [];

      await controller.handleConvert();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('al menos 1 archivo JPG')
      );
      expect(mockPDFOperations.convertJPGToPDF).not.toHaveBeenCalled();
    });

    test('converts single JPG file successfully', async () => {
      const file1 = new File(['fake-jpg-data'], 'image.jpg', { type: 'image/jpeg' });
      controller.selectedFiles = [file1];

      const mockPDFData = new Uint8Array([1, 2, 3, 4]);
      mockPDFOperations.convertJPGToPDF.mockResolvedValue(mockPDFData);

      await controller.handleConvert();

      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalledWith('Convirtiendo JPG a PDF...');
      expect(mockPDFOperations.convertJPGToPDF).toHaveBeenCalledWith([file1]);
      expect(mockFileManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith('JPG convertido a PDF exitosamente');
      expect(mockUIManager.enableControls).toHaveBeenCalled();
      expect(controller.selectedFiles).toHaveLength(0);
    });

    test('converts multiple JPG files successfully', async () => {
      const file1 = new File(['fake-jpg-data'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['fake-jpg-data'], 'image2.jpg', { type: 'image/jpeg' });
      controller.selectedFiles = [file1, file2];

      const mockPDFData = new Uint8Array([1, 2, 3, 4]);
      mockPDFOperations.convertJPGToPDF.mockResolvedValue(mockPDFData);

      await controller.handleConvert();

      expect(mockPDFOperations.convertJPGToPDF).toHaveBeenCalledWith([file1, file2]);
      expect(mockFileManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalled();
    });

    test('handles conversion errors gracefully', async () => {
      controller.selectedFiles = [
        new File(['fake-jpg-data'], 'image.jpg', { type: 'image/jpeg' })
      ];

      mockPDFOperations.convertJPGToPDF.mockRejectedValue(new Error('Conversion failed'));

      await controller.handleConvert();

      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Conversion failed')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('ensures controls are re-enabled even on error', async () => {
      controller.selectedFiles = [
        new File(['fake-jpg-data'], 'image.jpg', { type: 'image/jpeg' })
      ];

      mockPDFOperations.convertJPGToPDF.mockRejectedValue(new Error('Test error'));

      await controller.handleConvert();

      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });
  });

  describe('Integration with Model and View', () => {
    test('properly coordinates between Model and View during convert operation', async () => {
      const file1 = new File(['fake-jpg-data'], 'photo1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['fake-jpg-data'], 'photo2.jpg', { type: 'image/jpeg' });
      controller.selectedFiles = [file1, file2];

      const mockPDFData = new Uint8Array([5, 6, 7, 8]);
      mockPDFOperations.convertJPGToPDF.mockResolvedValue(mockPDFData);

      await controller.handleConvert();

      // Verify all methods were called in proper sequence
      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalled();
      expect(mockPDFOperations.convertJPGToPDF).toHaveBeenCalled();
      expect(mockFileManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalled();
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('updates file list view after file selection', async () => {
      const mockFile = new File(['fake-jpg-data'], 'test.jpg', { type: 'image/jpeg' });
      
      mockFileManager.loadFiles.mockResolvedValue([mockFile]);
      mockFileManager.validateJPGFile.mockReturnValue(true);

      await controller.handleFileSelection([mockFile]);

      expect(mockUIManager.updateFileList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            file: mockFile,
            name: 'test.jpg',
            size: mockFile.size
          })
        ])
      );
    });
  });
});
