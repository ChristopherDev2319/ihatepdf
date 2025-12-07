import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from '../../../js/utils/ErrorHandler.js';

describe('ErrorHandler - Unit Tests', () => {
  beforeEach(() => {
    // Clear console.error mock before each test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('classifyError', () => {
    describe('Validation Errors', () => {
      test('classifies "at least two required" as validation error', () => {
        const error = new Error('At least two PDF files are required to combine');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      });

      test('classifies "invalid file" as validation error', () => {
        const error = new Error('Invalid file format: must be PDF');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      });

      test('classifies "not valid" as validation error', () => {
        const error = new Error('File is not valid');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      });

      test('classifies "invalid range" as validation error', () => {
        const error = new Error('Invalid range: start page 10 is out of bounds (1-5)');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      });

      test('classifies "invalid page" as validation error', () => {
        const error = new Error('Invalid page number: 100 (must be between 1 and 50)');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      });

      test('classifies "must be" as validation error', () => {
        const error = new Error('Rotation angle must be 90, 180, or 270 degrees');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      });

      test('classifies "no files provided" as validation error', () => {
        const error = new Error('No files provided');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      });
    });

    describe('Processing Errors', () => {
      test('classifies "failed to load" as processing error', () => {
        const error = new Error('Failed to load PDF document');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.PROCESSING);
      });

      test('classifies "failed to parse" as processing error', () => {
        const error = new Error('Failed to parse PDF structure');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.PROCESSING);
      });

      test('classifies "corrupt" as processing error', () => {
        const error = new Error('PDF file is corrupt');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.PROCESSING);
      });

      test('classifies "damaged" as processing error', () => {
        const error = new Error('File appears to be damaged');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.PROCESSING);
      });

      test('classifies "unable to" as processing error', () => {
        const error = new Error('Unable to process the PDF');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.PROCESSING);
      });

      test('classifies "could not" as processing error', () => {
        const error = new Error('Could not save the document');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.PROCESSING);
      });
    });

    describe('System Errors', () => {
      test('classifies "out of memory" as system error', () => {
        const error = new Error('Out of memory');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.SYSTEM);
      });

      test('classifies "quota exceeded" as system error', () => {
        const error = new Error('Quota exceeded');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.SYSTEM);
      });

      test('classifies "not supported" as system error', () => {
        const error = new Error('Operation not supported');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.SYSTEM);
      });

      test('classifies QuotaExceededError by name', () => {
        const error = new Error('Storage limit reached');
        error.name = 'QuotaExceededError';
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.SYSTEM);
      });

      test('classifies NotSupportedError by name', () => {
        const error = new Error('Feature not available');
        error.name = 'NotSupportedError';
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.SYSTEM);
      });
    });

    describe('Unknown Errors', () => {
      test('classifies unrecognized error as unknown', () => {
        const error = new Error('Something weird happened');
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.UNKNOWN);
      });

      test('classifies null as unknown', () => {
        expect(ErrorHandler.classifyError(null)).toBe(ErrorHandler.ErrorTypes.UNKNOWN);
      });

      test('classifies undefined as unknown', () => {
        expect(ErrorHandler.classifyError(undefined)).toBe(ErrorHandler.ErrorTypes.UNKNOWN);
      });

      test('classifies error without message as unknown', () => {
        const error = new Error();
        error.message = '';
        expect(ErrorHandler.classifyError(error)).toBe(ErrorHandler.ErrorTypes.UNKNOWN);
      });
    });
  });

  describe('isValidationError', () => {
    test('returns true for validation error patterns', () => {
      expect(ErrorHandler.isValidationError(new Error('At least 2 files required'))).toBe(true);
      expect(ErrorHandler.isValidationError(new Error('Invalid file format'))).toBe(true);
      expect(ErrorHandler.isValidationError(new Error('File is not valid'))).toBe(true);
      expect(ErrorHandler.isValidationError(new Error('Must be PDF'))).toBe(true);
      expect(ErrorHandler.isValidationError(new Error('Invalid range'))).toBe(true);
    });

    test('returns false for non-validation errors', () => {
      expect(ErrorHandler.isValidationError(new Error('Failed to load'))).toBe(false);
      expect(ErrorHandler.isValidationError(new Error('Out of memory'))).toBe(false);
      expect(ErrorHandler.isValidationError(null)).toBe(false);
    });
  });

  describe('isProcessingError', () => {
    test('returns true for processing error patterns', () => {
      expect(ErrorHandler.isProcessingError(new Error('Failed to load PDF'))).toBe(true);
      expect(ErrorHandler.isProcessingError(new Error('Failed to parse document'))).toBe(true);
      expect(ErrorHandler.isProcessingError(new Error('File is corrupt'))).toBe(true);
      expect(ErrorHandler.isProcessingError(new Error('Document is damaged'))).toBe(true);
      expect(ErrorHandler.isProcessingError(new Error('Unable to process'))).toBe(true);
      expect(ErrorHandler.isProcessingError(new Error('Could not save'))).toBe(true);
    });

    test('returns false for non-processing errors', () => {
      expect(ErrorHandler.isProcessingError(new Error('Invalid file'))).toBe(false);
      expect(ErrorHandler.isProcessingError(new Error('Out of memory'))).toBe(false);
      expect(ErrorHandler.isProcessingError(null)).toBe(false);
    });
  });

  describe('isSystemError', () => {
    test('returns true for system error patterns', () => {
      expect(ErrorHandler.isSystemError(new Error('Out of memory'))).toBe(true);
      expect(ErrorHandler.isSystemError(new Error('Quota exceeded'))).toBe(true);
      expect(ErrorHandler.isSystemError(new Error('Not supported'))).toBe(true);
      expect(ErrorHandler.isSystemError(new Error('Browser does not support this'))).toBe(true);
    });

    test('returns true for system error types by name', () => {
      const quotaError = new Error('Storage full');
      quotaError.name = 'QuotaExceededError';
      expect(ErrorHandler.isSystemError(quotaError)).toBe(true);

      const notSupportedError = new Error('Feature unavailable');
      notSupportedError.name = 'NotSupportedError';
      expect(ErrorHandler.isSystemError(notSupportedError)).toBe(true);
    });

    test('returns false for non-system errors', () => {
      expect(ErrorHandler.isSystemError(new Error('Invalid file'))).toBe(false);
      expect(ErrorHandler.isSystemError(new Error('Failed to load'))).toBe(false);
      expect(ErrorHandler.isSystemError(null)).toBe(false);
    });
  });

  describe('generateMessage', () => {
    describe('Validation Messages', () => {
      test('generates message for "at least 2 required"', () => {
        const error = new Error('At least two PDF files are required to combine');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.VALIDATION, 'combine');
        expect(message).toBe('Debes seleccionar al menos 2 archivos PDF para combinar.');
      });

      test('generates message for "at least one required" in split context', () => {
        const error = new Error('At least one page range is required');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.VALIDATION, 'split');
        expect(message).toContain('rango de páginas');
      });

      test('generates message for "at least one required" in rotate context', () => {
        const error = new Error('At least one page must be selected for rotation');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.VALIDATION, 'rotate');
        expect(message).toContain('página para rotar');
      });

      test('generates message for invalid range', () => {
        const error = new Error('Invalid range: start page 10 is out of bounds');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.VALIDATION, 'split');
        expect(message).toContain('Rango de páginas inválido');
        expect(message).toContain('Invalid range');
      });

      test('generates message for invalid page', () => {
        const error = new Error('Invalid page number: 100');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.VALIDATION, 'rotate');
        expect(message).toContain('Número de página inválido');
      });

      test('generates message for rotation angle validation', () => {
        const error = new Error('Rotation angle must be 90, 180, or 270 degrees');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.VALIDATION, 'rotate');
        expect(message).toBe('El ángulo de rotación debe ser 90, 180 o 270 grados.');
      });
    });

    describe('Processing Messages', () => {
      test('generates message for corrupt file', () => {
        const error = new Error('PDF file is corrupt');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.PROCESSING, 'combine');
        expect(message).toContain('corrupto o dañado');
      });

      test('generates message for failed to load', () => {
        const error = new Error('Failed to load PDF document');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.PROCESSING, 'split');
        expect(message).toContain('No se pudo cargar');
      });

      test('generates message for failed to save', () => {
        const error = new Error('Failed to save the document');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.PROCESSING, 'compress');
        expect(message).toContain('No se pudo guardar');
      });

      test('generates generic processing message with operation context', () => {
        const error = new Error('Processing failed');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.PROCESSING, 'combine');
        expect(message).toContain('combinar los PDFs');
      });
    });

    describe('System Messages', () => {
      test('generates message for out of memory', () => {
        const error = new Error('Out of memory');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.SYSTEM, 'compress');
        expect(message).toContain('Memoria insuficiente');
      });

      test('generates message for quota exceeded', () => {
        const error = new Error('Quota exceeded');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.SYSTEM, 'split');
        expect(message).toContain('límite de almacenamiento');
      });

      test('generates message for not supported', () => {
        const error = new Error('Operation not supported');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.SYSTEM, 'rotate');
        expect(message).toContain('navegador no soporta');
      });
    });

    describe('Unknown Messages', () => {
      test('generates generic message for unknown errors', () => {
        const error = new Error('Something unexpected');
        const message = ErrorHandler.generateMessage(error, ErrorHandler.ErrorTypes.UNKNOWN, 'combine');
        expect(message).toContain('error inesperado');
        expect(message).toContain('Something unexpected');
      });
    });
  });

  describe('handle', () => {
    test('returns structured error result with all fields', () => {
      const error = new Error('Invalid file format');
      const result = ErrorHandler.handle(error, 'combine');

      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('originalError');
      expect(result.originalError).toBe(error);
    });

    test('classifies and generates appropriate message for validation error', () => {
      const error = new Error('At least two PDF files are required');
      const result = ErrorHandler.handle(error, 'combine');

      expect(result.type).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      expect(result.message).toContain('al menos 2 archivos');
    });

    test('classifies and generates appropriate message for processing error', () => {
      const error = new Error('Failed to load PDF');
      const result = ErrorHandler.handle(error, 'split');

      expect(result.type).toBe(ErrorHandler.ErrorTypes.PROCESSING);
      expect(result.message).toContain('No se pudo cargar');
    });

    test('classifies and generates appropriate message for system error', () => {
      const error = new Error('Out of memory');
      const result = ErrorHandler.handle(error, 'compress');

      expect(result.type).toBe(ErrorHandler.ErrorTypes.SYSTEM);
      expect(result.message).toContain('Memoria insuficiente');
    });

    test('logs error to console', () => {
      const error = new Error('Test error');
      ErrorHandler.handle(error, 'test-context');

      expect(console.error).toHaveBeenCalled();
    });

    test('handles error without context', () => {
      const error = new Error('Invalid file');
      const result = ErrorHandler.handle(error);

      expect(result.type).toBe(ErrorHandler.ErrorTypes.VALIDATION);
      expect(result.message).toBeTruthy();
    });
  });
});
