import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PDFCompressController } from '../../../js/controllers/PDFCompressController.js';
import { PDFOperations } from '../../../js/models/PDFOperations.js';
import { FileManager } from '../../../js/models/FileManager.js';
import { UIManager } from '../../../js/views/UIManager.js';

describe('PDFCompressController - Unit Tests', () => {
  let controller;
  let mockPDFOperations;
  let mockFileManager;
  let mockUIManager;

  beforeEach(() => {
    // Create mock instances
    mockPDFOperations = {
      compressPDF: vi.fn()
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

    controller = new PDFCompressController(mockPDFOperations, mockFileManager, mockUIManager);
  });

  describe('handleFileSelection', () => {
    test('loads and validates PDF file successfully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      mockFileManager.validatePDFFile.mockReturnValue(true);

      await controller.handleFileSelection(mockFile);

      expect(mockFileManager.validatePDFFile).toHaveBeenCalledWith(mockFile);
      expect(controller.selectedFile).toBe(mockFile);
      expect(controller.originalSize).toBe(mockFile.size);
      expect(mockUIManager.updateFileList).toHaveBeenCalled();
    });

    test('handles FileList input by selecting first file', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      const mockFileList = Object.assign([mockFile], { 
        item: (index) => mockFile,
        length: 1 
      });
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
        'No se seleccionó ningún archivo'
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

  describe('handleCompress', () => {
    test('validates empty file selection', async () => {
      controller.selectedFile = null;

      await controller.handleCompress();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        'Debes seleccionar un archivo PDF para comprimir'
      );
      expect(mockPDFOperations.compressPDF).not.toHaveBeenCalled();
    });

    test('compresses PDF successfully and shows download options', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.originalSize = 1000;

      const mockResult = {
        data: new Uint8Array([1, 2, 3, 4]),
        originalSize: 1000,
        compressedSize: 800,
        reductionPercentage: 20.0
      };
      const mockDefaultFilename = 'test_comprimido_20231213T120000.pdf';
      
      mockPDFOperations.compressPDF.mockResolvedValue(mockResult);
      mockFileManager.generateDefaultFilename.mockReturnValue(mockDefaultFilename);

      await controller.handleCompress();

      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalledWith('Comprimiendo PDF...');
      expect(mockPDFOperations.compressPDF).toHaveBeenCalledWith(mockFile);
      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalledWith('compress', 'test.pdf');
      expect(mockUIManager.showDownloadOptions).toHaveBeenCalledWith(
        expect.any(Blob),
        mockDefaultFilename
      );
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('20.00%')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
      expect(controller.selectedFile).toBeNull();
    });

    test('displays original and compressed sizes in success message', async () => {
      const mockFile = new File(['%PDF-1.4'], 'large.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;

      const mockResult = {
        data: new Uint8Array([1, 2, 3]),
        originalSize: 2048000, // ~2 MB
        compressedSize: 1024000, // ~1 MB
        reductionPercentage: 50.0
      };
      mockPDFOperations.compressPDF.mockResolvedValue(mockResult);

      await controller.handleCompress();

      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/Tamaño original:.*Tamaño comprimido:.*Reducción:.*50\.00%/)
      );
    });

    test('handles compression errors gracefully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;

      mockPDFOperations.compressPDF.mockRejectedValue(new Error('Compression failed'));

      await controller.handleCompress();

      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Compression failed')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('ensures controls are re-enabled even on error', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;

      mockPDFOperations.compressPDF.mockRejectedValue(new Error('Test error'));

      await controller.handleCompress();

      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('generates correct default filename using FileManager', async () => {
      const mockFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;

      const mockResult = {
        data: new Uint8Array([1, 2, 3]),
        originalSize: 1000,
        compressedSize: 800,
        reductionPercentage: 20.0
      };
      const mockDefaultFilename = 'document_comprimido_20231213T120000.pdf';
      
      mockPDFOperations.compressPDF.mockResolvedValue(mockResult);
      mockFileManager.generateDefaultFilename.mockReturnValue(mockDefaultFilename);

      await controller.handleCompress();

      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalledWith('compress', 'document.pdf');
      expect(mockUIManager.showDownloadOptions).toHaveBeenCalledWith(
        expect.any(Blob),
        mockDefaultFilename
      );
    });
  });

  describe('Integration with Model and View', () => {
    test('properly coordinates between Model and View during compress operation', async () => {
      const mockFile = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;

      const mockResult = {
        data: new Uint8Array([5, 6, 7, 8]),
        originalSize: 5000,
        compressedSize: 4000,
        reductionPercentage: 20.0
      };
      const mockDefaultFilename = 'doc_comprimido_20231213T120000.pdf';
      
      mockPDFOperations.compressPDF.mockResolvedValue(mockResult);
      mockFileManager.generateDefaultFilename.mockReturnValue(mockDefaultFilename);

      await controller.handleCompress();

      // Verify all methods were called in proper sequence
      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalled();
      expect(mockPDFOperations.compressPDF).toHaveBeenCalled();
      expect(mockFileManager.generateDefaultFilename).toHaveBeenCalled();
      expect(mockUIManager.showDownloadOptions).toHaveBeenCalled();
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalled();
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('clears file list after successful compression', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;

      const mockResult = {
        data: new Uint8Array([1, 2, 3]),
        originalSize: 1000,
        compressedSize: 900,
        reductionPercentage: 10.0
      };
      mockPDFOperations.compressPDF.mockResolvedValue(mockResult);
      mockFileManager.generateDefaultFilename.mockReturnValue('test_comprimido.pdf');

      await controller.handleCompress();

      expect(mockUIManager.clearFileList).toHaveBeenCalled();
      expect(controller.selectedFile).toBeNull();
    });
  });
});
