import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PDFCombineController } from '../../js/controllers/PDFCombineController.js';
import { PDFOperations } from '../../js/models/PDFOperations.js';
import { FileManager } from '../../js/models/FileManager.js';
import { UIManager } from '../../js/views/UIManager.js';

describe('PDFCombineController - Property-Based Tests', () => {
  let controller;
  let pdfOperations;
  let fileManager;
  let uiManager;

  beforeEach(() => {
    pdfOperations = new PDFOperations();
    fileManager = new FileManager();
    uiManager = new UIManager();
    controller = new PDFCombineController(pdfOperations, fileManager, uiManager);
  });

  // Feature: ihatepdf, Property 3: Carga de múltiples archivos
  // Valida: Requisitos 1.1
  test('loads all N PDF files successfully for any N >= 2', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }),
        async (numFiles) => {
          // Create a fresh controller for each test iteration
          const testController = new PDFCombineController(
            new PDFOperations(),
            new FileManager(),
            new UIManager()
          );
          
          // Generate N valid PDF files
          const files = [];
          for (let i = 0; i < numFiles; i++) {
            const file = new File(
              ['%PDF-1.4\n%fake pdf content'],
              `test${i}.pdf`,
              { type: 'application/pdf' }
            );
            files.push(file);
          }

          // Create a FileList-like object
          const fileList = {
            length: files.length,
            item: (index) => files[index],
            [Symbol.iterator]: function* () {
              for (let i = 0; i < this.length; i++) {
                yield this.item(i);
              }
            }
          };
          
          // Add array-like indexing
          files.forEach((file, index) => {
            fileList[index] = file;
          });

          // Handle file selection
          await testController.handleFileSelection(fileList);

          // Property: All N files should be loaded successfully
          expect(testController.selectedFiles.length).toBe(numFiles);
          
          // Verify all files are present
          for (let i = 0; i < numFiles; i++) {
            expect(testController.selectedFiles[i].name).toBe(`test${i}.pdf`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
