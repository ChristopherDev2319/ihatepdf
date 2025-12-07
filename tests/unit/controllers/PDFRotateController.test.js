import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PDFRotateController } from '../../../js/controllers/PDFRotateController.js';
import { PDFOperations } from '../../../js/models/PDFOperations.js';
import { FileManager } from '../../../js/models/FileManager.js';
import { UIManager } from '../../../js/views/UIManager.js';

describe('PDFRotateController - Unit Tests', () => {
  let controller;
  let mockPDFOperations;
  let mockFileManager;
  let mockUIManager;

  beforeEach(() => {
    // Create mock instances
    mockPDFOperations = {
      rotatePDF: vi.fn()
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

    controller = new PDFRotateController(mockPDFOperations, mockFileManager, mockUIManager);
  });

  describe('handleFileSelection', () => {
    test('loads and validates PDF file successfully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      mockFileManager.validatePDFFile.mockReturnValue(true);

      // Mock pdf-lib
      const mockPDFDoc = {
        getPageCount: vi.fn().mockReturnValue(5)
      };
      
      vi.doMock('pdf-lib', () => ({
        PDFDocument: {
          load: vi.fn().mockResolvedValue(mockPDFDoc)
        }
      }));

      // Mock arrayBuffer
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      await controller.handleFileSelection(mockFile);

      expect(mockFileManager.validatePDFFile).toHaveBeenCalledWith(mockFile);
      expect(controller.selectedFile).toBe(mockFile);
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
      mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

      await controller.handleFileSelection(mockFileList);

      expect(controller.selectedFile).toBe(mockFile);
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
  });

  describe('handlePageSelection', () => {
    beforeEach(() => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.totalPages = 10;
    });

    test('accepts valid page selection as array', () => {
      const result = controller.handlePageSelection([1, 3, 5]);

      expect(result).toBe(true);
      expect(controller.selectedPages).toEqual([1, 3, 5]);
    });

    test('accepts valid page selection as string', () => {
      const result = controller.handlePageSelection('1,3,5');

      expect(result).toBe(true);
      expect(controller.selectedPages).toEqual([1, 3, 5]);
    });

    test('parses page ranges correctly', () => {
      const result = controller.handlePageSelection('1-3,7-9');

      expect(result).toBe(true);
      expect(controller.selectedPages).toEqual([1, 2, 3, 7, 8, 9]);
    });

    test('parses mixed ranges and individual pages', () => {
      const result = controller.handlePageSelection('1,3-5,10');

      expect(result).toBe(true);
      expect(controller.selectedPages).toEqual([1, 3, 4, 5, 10]);
    });

    test('validates empty page selection (edge case)', () => {
      const result = controller.handlePageSelection([]);

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        'Debes seleccionar al menos una página para rotar'
      );
    });

    test('validates pages out of range', () => {
      const result = controller.handlePageSelection([1, 15]);

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('fuera de rango')
      );
    });

    test('validates pages below minimum', () => {
      const result = controller.handlePageSelection([0, 5]);

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('fuera de rango')
      );
    });

    test('requires file to be selected first', () => {
      controller.selectedFile = null;

      const result = controller.handlePageSelection([1, 2, 3]);

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        'Primero debes seleccionar un archivo PDF'
      );
    });
  });

  describe('handleRotationAngle', () => {
    test('accepts valid rotation angle 90', () => {
      const result = controller.handleRotationAngle(90);

      expect(result).toBe(true);
      expect(controller.rotationAngle).toBe(90);
    });

    test('accepts valid rotation angle 180', () => {
      const result = controller.handleRotationAngle(180);

      expect(result).toBe(true);
      expect(controller.rotationAngle).toBe(180);
    });

    test('accepts valid rotation angle 270', () => {
      const result = controller.handleRotationAngle(270);

      expect(result).toBe(true);
      expect(controller.rotationAngle).toBe(270);
    });

    test('rejects invalid rotation angle', () => {
      const result = controller.handleRotationAngle(45);

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Ángulo de rotación inválido')
      );
    });

    test('rejects negative rotation angle', () => {
      const result = controller.handleRotationAngle(-90);

      expect(result).toBe(false);
      expect(mockUIManager.showError).toHaveBeenCalled();
    });
  });

  describe('handleRotate', () => {
    test('validates empty file selection (edge case)', async () => {
      controller.selectedFile = null;

      await controller.handleRotate();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        'Debes seleccionar un archivo PDF para rotar'
      );
      expect(mockPDFOperations.rotatePDF).not.toHaveBeenCalled();
    });

    test('validates empty page selection (edge case)', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [];

      await controller.handleRotate();

      expect(mockUIManager.showError).toHaveBeenCalledWith(
        'Debes seleccionar al menos una página para rotar'
      );
      expect(mockPDFOperations.rotatePDF).not.toHaveBeenCalled();
    });

    test('rotates PDF successfully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1, 3, 5];
      controller.rotationAngle = 90;

      const mockRotatedPDF = new Uint8Array([1, 2, 3, 4]);
      mockPDFOperations.rotatePDF.mockResolvedValue(mockRotatedPDF);

      await controller.handleRotate();

      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalledWith('Rotando páginas...');
      expect(mockPDFOperations.rotatePDF).toHaveBeenCalledWith(mockFile, [1, 3, 5], 90);
      expect(mockFileManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        expect.stringContaining('rotadas')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
      expect(controller.selectedFile).toBeNull();
      expect(controller.selectedPages).toEqual([]);
    });

    test('displays correct success message for single page', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [2];
      controller.rotationAngle = 180;

      mockPDFOperations.rotatePDF.mockResolvedValue(new Uint8Array([1, 2, 3]));

      await controller.handleRotate();

      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        '1 página rotada 180° exitosamente'
      );
    });

    test('displays correct success message for multiple pages', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1, 2, 3];
      controller.rotationAngle = 270;

      mockPDFOperations.rotatePDF.mockResolvedValue(new Uint8Array([1, 2, 3]));

      await controller.handleRotate();

      expect(mockUIManager.showSuccess).toHaveBeenCalledWith(
        '3 páginas rotadas 270° exitosamente'
      );
    });

    test('handles rotation errors gracefully', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1, 2];

      mockPDFOperations.rotatePDF.mockRejectedValue(new Error('Rotation failed'));

      await controller.handleRotate();

      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith(
        expect.stringContaining('Rotation failed')
      );
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('ensures controls are re-enabled even on error', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1];

      mockPDFOperations.rotatePDF.mockRejectedValue(new Error('Test error'));

      await controller.handleRotate();

      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('generates correct rotated filename', async () => {
      const mockFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1];

      mockPDFOperations.rotatePDF.mockResolvedValue(new Uint8Array([1, 2, 3]));

      await controller.handleRotate();

      expect(mockFileManager.downloadFile).toHaveBeenCalledWith(
        expect.any(Blob),
        'document_rotated.pdf'
      );
    });
  });

  describe('Integration with Model and View', () => {
    test('properly coordinates between Model and View during rotate operation', async () => {
      const mockFile = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1, 2, 3];
      controller.rotationAngle = 90;

      mockPDFOperations.rotatePDF.mockResolvedValue(new Uint8Array([5, 6, 7, 8]));

      await controller.handleRotate();

      // Verify all methods were called in proper sequence
      expect(mockUIManager.disableControls).toHaveBeenCalled();
      expect(mockUIManager.showProgress).toHaveBeenCalled();
      expect(mockPDFOperations.rotatePDF).toHaveBeenCalled();
      expect(mockFileManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.hideProgress).toHaveBeenCalled();
      expect(mockUIManager.showSuccess).toHaveBeenCalled();
      expect(mockUIManager.enableControls).toHaveBeenCalled();
    });

    test('clears file list after successful rotation', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1];

      mockPDFOperations.rotatePDF.mockResolvedValue(new Uint8Array([1, 2, 3]));

      await controller.handleRotate();

      expect(mockUIManager.clearFileList).toHaveBeenCalled();
      expect(controller.selectedFile).toBeNull();
      expect(controller.selectedPages).toEqual([]);
    });

    test('resets rotation angle to default after operation', async () => {
      const mockFile = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      controller.selectedFile = mockFile;
      controller.selectedPages = [1];
      controller.rotationAngle = 270;

      mockPDFOperations.rotatePDF.mockResolvedValue(new Uint8Array([1, 2, 3]));

      await controller.handleRotate();

      expect(controller.rotationAngle).toBe(90);
    });
  });
});
