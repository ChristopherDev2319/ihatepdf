import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { FilePreview } from '../../js/views/components/FilePreview.js';
import { JSDOM } from 'jsdom';

describe('FilePreview - Property-Based Tests', () => {
  let dom;
  let document;
  let container;

  beforeEach(() => {
    // Set up a DOM environment for testing
    dom = new JSDOM('<!DOCTYPE html><div id="test-container"></div>');
    global.document = dom.window.document;
    global.window = dom.window;
    container = global.document.getElementById('test-container');
  });

  afterEach(() => {
    if (container) {
      container.innerHTML = '';
    }
  });

  // Feature: ihatepdf, Property 17: Gestión de lista de archivos
  // Valida: Requisitos 10.3
  test('removing a file from a list with N elements results in N-1 elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of file-like objects with at least 1 file
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
            size: fc.integer({ min: 1, max: 10000000 }),
            type: fc.constant('application/pdf')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate a valid index to remove
        async (fileProps) => {
          // Create File objects
          const files = fileProps.map(props => 
            new dom.window.File(['content'], props.name, { type: props.type })
          );
          
          const filePreview = new FilePreview('test-container');
          filePreview.setFiles(files);
          
          const initialCount = filePreview.files.length;
          expect(initialCount).toBe(files.length);
          
          // Remove a file at a random valid index
          const indexToRemove = Math.floor(Math.random() * initialCount);
          filePreview.removeFile(indexToRemove);
          
          // Property: Removing one file should result in N-1 files
          const finalCount = filePreview.files.length;
          expect(finalCount).toBe(initialCount - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 17: Gestión de lista de archivos (edge case - empty list)
  // Valida: Requisitos 10.3
  test('removing from empty list maintains empty state', async () => {
    const filePreview = new FilePreview('test-container');
    filePreview.setFiles([]);
    
    expect(filePreview.files.length).toBe(0);
    
    // Try to remove from empty list
    filePreview.removeFile(0);
    
    // Property: Removing from empty list should keep it empty
    expect(filePreview.files.length).toBe(0);
  });

  // Feature: ihatepdf, Property 17: Gestión de lista de archivos (invalid index)
  // Valida: Requisitos 10.3
  test('removing with invalid index does not change list size', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
            size: fc.integer({ min: 1, max: 10000000 }),
            type: fc.constant('application/pdf')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (fileProps) => {
          const files = fileProps.map(props => 
            new dom.window.File(['content'], props.name, { type: props.type })
          );
          
          const filePreview = new FilePreview('test-container');
          filePreview.setFiles(files);
          
          const initialCount = filePreview.files.length;
          
          // Try to remove with invalid indices
          filePreview.removeFile(-1);
          expect(filePreview.files.length).toBe(initialCount);
          
          filePreview.removeFile(initialCount);
          expect(filePreview.files.length).toBe(initialCount);
          
          filePreview.removeFile(initialCount + 100);
          expect(filePreview.files.length).toBe(initialCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 18: Visualización de todos los archivos cargados
  // Valida: Requisitos 10.2
  test('file list displays exactly N elements for N loaded files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
            size: fc.integer({ min: 1, max: 10000000 }),
            type: fc.constant('application/pdf')
          }),
          { minLength: 0, maxLength: 15 }
        ),
        async (fileProps) => {
          const files = fileProps.map(props => 
            new dom.window.File(['content'], props.name, { type: props.type })
          );
          
          const filePreview = new FilePreview('test-container');
          filePreview.setFiles(files);
          
          // Property: The internal files array should contain exactly N elements
          expect(filePreview.files.length).toBe(files.length);
          
          // Property: The rendered DOM should show exactly N file items
          const renderedItems = container.querySelectorAll('.file-preview__item');
          expect(renderedItems.length).toBe(files.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: ihatepdf, Property 18: Visualización de todos los archivos cargados (metadata)
  // Valida: Requisitos 10.2
  test('each displayed file shows its name and size', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.pdf`),
            size: fc.integer({ min: 1, max: 10000000 }),
            type: fc.constant('application/pdf')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (fileProps) => {
          const files = fileProps.map(props => 
            new dom.window.File(['content'], props.name, { type: props.type })
          );
          
          const filePreview = new FilePreview('test-container');
          filePreview.setFiles(files);
          
          // Property: Each file's name and size should be stored correctly
          files.forEach((file, index) => {
            const fileData = filePreview.files[index];
            expect(fileData.name).toBe(file.name);
            expect(fileData.size).toBe(file.size);
            
            // Check that the name appears in the rendered HTML (accounting for HTML escaping)
            const containerHTML = container.innerHTML;
            const escapedName = escapeHtml(file.name);
            expect(containerHTML).toContain(escapedName);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Helper function to escape HTML (matches the component's escapeHtml method)
function escapeHtml(text) {
  const div = global.document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
