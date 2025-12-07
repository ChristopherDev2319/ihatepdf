import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { FileManager } from '../../js/models/FileManager.js';

describe('FileManager - Property-Based Tests', () => {
  const fileManager = new FileManager();

  // Feature: ihatepdf, Property 14: Validación de archivos JPG
  // Valida: Requisitos 5.1
  test('validates JPG files correctly for any valid JPG file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpeg`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.JPG`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.JPEG`)
          ),
          type: fc.constant('image/jpeg'),
          size: fc.integer({ min: 1, max: 10000000 })
        }),
        async (fileProps) => {
          // Create a mock File object
          const file = new File(['fake jpg content'], fileProps.name, { 
            type: fileProps.type 
          });
          
          // Property: Any file with .jpg/.jpeg extension and image/jpeg MIME type should be valid
          const isValid = fileManager.validateJPGFile(file);
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 14: Validación de archivos JPG (invalid files)
  // Valida: Requisitos 5.1
  test('rejects non-JPG files for any invalid file', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.png`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.txt`),
            fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.doc`)
          ),
          type: fc.oneof(
            fc.constant('application/pdf'),
            fc.constant('image/png'),
            fc.constant('text/plain'),
            fc.constant('application/msword')
          ),
          size: fc.integer({ min: 1, max: 10000000 })
        }),
        async (fileProps) => {
          // Create a mock File object with non-JPG properties
          const file = new File(['fake content'], fileProps.name, { 
            type: fileProps.type 
          });
          
          // Property: Any file without .jpg/.jpeg extension or without image/jpeg MIME type should be invalid
          const isValid = fileManager.validateJPGFile(file);
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
