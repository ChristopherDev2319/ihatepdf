import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { UIManager } from '../../js/views/UIManager.js';

describe('UIManager - Property-Based Tests', () => {
  let dom;
  let document;
  let uiManager;

  beforeEach(() => {
    // Crear un DOM simulado para las pruebas
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="progressIndicator" hidden>
            <p id="progressMessage">Procesando...</p>
          </div>
          <div id="notification" hidden>
            <p id="notificationMessage"></p>
          </div>
          <ul id="fileList"></ul>
          <button id="processBtn"></button>
          <button class="operation-btn" data-operation="combine"></button>
          <button class="operation-btn" data-operation="split"></button>
          <input id="fileInput" type="file">
          <div id="dropzone" tabindex="0"></div>
          <input id="pageRanges">
          <input id="pageSelection">
          <select id="rotationAngle"></select>
        </body>
      </html>
    `);
    
    global.document = dom.window.document;
    global.window = dom.window;
    
    uiManager = new UIManager();
  });

  afterEach(() => {
    if (uiManager.notificationTimeout) {
      clearTimeout(uiManager.notificationTimeout);
    }
  });

  // Feature: ihatepdf, Property 19: Deshabilitación de controles durante procesamiento
  // Valida: Requisitos 9.2
  describe('Property 19: Control disabling during processing', () => {
    test('for any operation in progress, all controls that can interfere should be disabled', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Estado inicial de los controles
          (initialState) => {
            // Configurar estado inicial
            if (initialState) {
              uiManager.enableControls();
            } else {
              uiManager.disableControls();
            }

            // Simular inicio de operación
            uiManager.disableControls();

            // Verificar que todos los controles estén deshabilitados
            expect(uiManager.processBtn.disabled).toBe(true);
            expect(uiManager.fileInput.disabled).toBe(true);
            
            // Verificar botones de operación
            uiManager.operationButtons.forEach(btn => {
              expect(btn.disabled).toBe(true);
            });

            // Verificar dropzone
            expect(uiManager.dropzone.classList.contains('file-upload__dropzone--disabled')).toBe(true);
            expect(uiManager.dropzone.getAttribute('tabindex')).toBe('-1');

            // Verificar controles específicos de operaciones
            if (uiManager.pageRanges) {
              expect(uiManager.pageRanges.disabled).toBe(true);
            }
            if (uiManager.pageSelection) {
              expect(uiManager.pageSelection.disabled).toBe(true);
            }
            if (uiManager.rotationAngle) {
              expect(uiManager.rotationAngle.disabled).toBe(true);
            }

            // Simular finalización de operación
            uiManager.enableControls();

            // Verificar que todos los controles estén habilitados
            expect(uiManager.processBtn.disabled).toBe(false);
            expect(uiManager.fileInput.disabled).toBe(false);
            
            uiManager.operationButtons.forEach(btn => {
              expect(btn.disabled).toBe(false);
            });

            expect(uiManager.dropzone.classList.contains('file-upload__dropzone--disabled')).toBe(false);
            expect(uiManager.dropzone.getAttribute('tabindex')).toBe('0');

            if (uiManager.pageRanges) {
              expect(uiManager.pageRanges.disabled).toBe(false);
            }
            if (uiManager.pageSelection) {
              expect(uiManager.pageSelection.disabled).toBe(false);
            }
            if (uiManager.rotationAngle) {
              expect(uiManager.rotationAngle.disabled).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('disabling controls is idempotent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Número de veces que se deshabilita
          (numDisables) => {
            // Habilitar controles primero
            uiManager.enableControls();

            // Deshabilitar múltiples veces
            for (let i = 0; i < numDisables; i++) {
              uiManager.disableControls();
            }

            // Verificar que el estado final es consistente
            expect(uiManager.processBtn.disabled).toBe(true);
            expect(uiManager.fileInput.disabled).toBe(true);
            
            uiManager.operationButtons.forEach(btn => {
              expect(btn.disabled).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('enabling controls is idempotent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Número de veces que se habilita
          (numEnables) => {
            // Deshabilitar controles primero
            uiManager.disableControls();

            // Habilitar múltiples veces
            for (let i = 0; i < numEnables; i++) {
              uiManager.enableControls();
            }

            // Verificar que el estado final es consistente
            expect(uiManager.processBtn.disabled).toBe(false);
            expect(uiManager.fileInput.disabled).toBe(false);
            
            uiManager.operationButtons.forEach(btn => {
              expect(btn.disabled).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: ihatepdf, Property 20: Mensajes de error para operaciones fallidas
  // Valida: Requisitos 9.4
  describe('Property 20: Error messages for failed operations', () => {
    test('for any failed operation, the system should display an error message containing information about the failure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }), // Mensaje de error
          (errorMessage) => {
            // Mostrar mensaje de error
            uiManager.showError(errorMessage);

            // Verificar que la notificación está visible
            expect(uiManager.notification.hidden).toBe(false);

            // Verificar que el mensaje se muestra correctamente
            expect(uiManager.notificationMessage.textContent).toBe(errorMessage);

            // Verificar que tiene la clase de error
            expect(uiManager.notification.classList.contains('notification--error')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('error messages should contain the provided error information', () => {
      fc.assert(
        fc.property(
          fc.record({
            operation: fc.constantFrom('combine', 'split', 'compress', 'rotate', 'convert'),
            reason: fc.constantFrom('invalid file', 'processing failed', 'out of memory', 'invalid range')
          }),
          ({ operation, reason }) => {
            const errorMessage = `Error en operación ${operation}: ${reason}`;
            
            uiManager.showError(errorMessage);

            // Verificar que el mensaje contiene información sobre la operación
            expect(uiManager.notificationMessage.textContent).toContain(operation);
            
            // Verificar que el mensaje contiene información sobre la causa
            expect(uiManager.notificationMessage.textContent).toContain(reason);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('error messages should be visible and not hidden immediately', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage) => {
            uiManager.showError(errorMessage, 10000); // 10 segundos

            // Verificar que está visible inmediatamente después de mostrar
            expect(uiManager.notification.hidden).toBe(false);
            expect(uiManager.notificationMessage.textContent).toBe(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('multiple error messages should replace previous ones', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
          (errorMessages) => {
            // Mostrar múltiples mensajes de error
            errorMessages.forEach(msg => {
              uiManager.showError(msg, 0); // Sin auto-cerrar
            });

            // Verificar que solo el último mensaje está visible
            const lastMessage = errorMessages[errorMessages.length - 1];
            expect(uiManager.notificationMessage.textContent).toBe(lastMessage);
            expect(uiManager.notification.hidden).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
