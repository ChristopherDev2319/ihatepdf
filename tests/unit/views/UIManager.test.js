import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { UIManager } from '../../../js/views/UIManager.js';

describe('UIManager - Unit Tests', () => {
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

  describe('Progress Indicator', () => {
    test('showProgress should display progress indicator with default message', () => {
      uiManager.showProgress();

      expect(uiManager.progressIndicator.hidden).toBe(false);
      expect(uiManager.progressMessage.textContent).toBe('Procesando...');
    });

    test('showProgress should display progress indicator with custom message', () => {
      const customMessage = 'Combinando PDFs...';
      uiManager.showProgress(customMessage);

      expect(uiManager.progressIndicator.hidden).toBe(false);
      expect(uiManager.progressMessage.textContent).toBe(customMessage);
    });

    test('hideProgress should hide progress indicator', () => {
      uiManager.showProgress();
      uiManager.hideProgress();

      expect(uiManager.progressIndicator.hidden).toBe(true);
    });
  });

  describe('Success Notifications', () => {
    test('showSuccess should display success notification', () => {
      const message = 'PDF combinado exitosamente';
      uiManager.showSuccess(message, 0); // Sin auto-cerrar para testing

      expect(uiManager.notification.hidden).toBe(false);
      expect(uiManager.notificationMessage.textContent).toBe(message);
      expect(uiManager.notification.classList.contains('notification--success')).toBe(true);
    });

    test('showSuccess should auto-close after specified duration', async () => {
      const message = 'Operación exitosa';
      uiManager.showSuccess(message, 100); // 100ms

      expect(uiManager.notification.hidden).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(uiManager.notification.hidden).toBe(true);
    });
  });

  describe('Error Messages', () => {
    test('showError should display error notification', () => {
      const message = 'Error al procesar archivo';
      uiManager.showError(message, 0); // Sin auto-cerrar para testing

      expect(uiManager.notification.hidden).toBe(false);
      expect(uiManager.notificationMessage.textContent).toBe(message);
      expect(uiManager.notification.classList.contains('notification--error')).toBe(true);
    });

    test('showError should auto-close after specified duration', async () => {
      const message = 'Error de validación';
      uiManager.showError(message, 100); // 100ms

      expect(uiManager.notification.hidden).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(uiManager.notification.hidden).toBe(true);
    });

    test('hideNotification should hide notification immediately', () => {
      uiManager.showError('Error', 5000);
      expect(uiManager.notification.hidden).toBe(false);

      uiManager.hideNotification();
      expect(uiManager.notification.hidden).toBe(true);
    });
  });

  describe('File List Management', () => {
    test('updateFileList should display files with correct information', () => {
      const files = [
        { name: 'document1.pdf', size: 2400000, pageCount: 5 },
        { name: 'document2.pdf', size: 1800000, pageCount: 3 }
      ];

      uiManager.updateFileList(files);

      const items = uiManager.fileList.querySelectorAll('.file-preview__item');
      expect(items.length).toBe(2);
      
      // Verificar primer archivo
      expect(items[0].textContent).toContain('document1.pdf');
      expect(items[0].textContent).toContain('2.29 MB');
      expect(items[0].textContent).toContain('5 páginas');
      
      // Verificar segundo archivo
      expect(items[1].textContent).toContain('document2.pdf');
      expect(items[1].textContent).toContain('1.72 MB');
      expect(items[1].textContent).toContain('3 páginas');
    });

    test('updateFileList should handle files without page count', () => {
      const files = [
        { name: 'image.jpg', size: 500000 }
      ];

      uiManager.updateFileList(files);

      const items = uiManager.fileList.querySelectorAll('.file-preview__item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('image.jpg');
      expect(items[0].textContent).toContain('488.28 KB');
      expect(items[0].textContent).not.toContain('páginas');
    });

    test('updateFileList should show empty message when no files', () => {
      uiManager.updateFileList([]);

      expect(uiManager.fileList.innerHTML).toContain('No hay archivos seleccionados');
    });

    test('clearFileList should remove all files', () => {
      const files = [
        { name: 'document1.pdf', size: 2400000, pageCount: 5 }
      ];

      uiManager.updateFileList(files);
      expect(uiManager.fileList.querySelectorAll('.file-preview__item').length).toBe(1);

      uiManager.clearFileList();
      expect(uiManager.fileList.innerHTML).toContain('No hay archivos seleccionados');
    });

    test('updateFileList should escape HTML in file names', () => {
      const files = [
        { name: '<script>alert("xss")</script>.pdf', size: 1000 }
      ];

      uiManager.updateFileList(files);

      const items = uiManager.fileList.querySelectorAll('.file-preview__item');
      const nameSpan = items[0].querySelector('.file-preview__name');
      
      // Verificar que el HTML está escapado en el span del nombre
      expect(nameSpan.innerHTML).toContain('&lt;script&gt;');
      expect(nameSpan.innerHTML).not.toContain('<script>alert');
      
      // Verificar que el texto se muestra correctamente
      expect(nameSpan.textContent).toBe('<script>alert("xss")</script>.pdf');
    });
  });

  describe('Control State Management', () => {
    test('disableControls should disable all interactive elements', () => {
      uiManager.enableControls(); // Asegurar que están habilitados primero
      uiManager.disableControls();

      expect(uiManager.processBtn.disabled).toBe(true);
      expect(uiManager.fileInput.disabled).toBe(true);
      expect(uiManager.pageRanges.disabled).toBe(true);
      expect(uiManager.pageSelection.disabled).toBe(true);
      expect(uiManager.rotationAngle.disabled).toBe(true);
      
      uiManager.operationButtons.forEach(btn => {
        expect(btn.disabled).toBe(true);
      });

      expect(uiManager.dropzone.classList.contains('file-upload__dropzone--disabled')).toBe(true);
      expect(uiManager.dropzone.getAttribute('tabindex')).toBe('-1');
    });

    test('enableControls should enable all interactive elements', () => {
      uiManager.disableControls(); // Asegurar que están deshabilitados primero
      uiManager.enableControls();

      expect(uiManager.processBtn.disabled).toBe(false);
      expect(uiManager.fileInput.disabled).toBe(false);
      expect(uiManager.pageRanges.disabled).toBe(false);
      expect(uiManager.pageSelection.disabled).toBe(false);
      expect(uiManager.rotationAngle.disabled).toBe(false);
      
      uiManager.operationButtons.forEach(btn => {
        expect(btn.disabled).toBe(false);
      });

      expect(uiManager.dropzone.classList.contains('file-upload__dropzone--disabled')).toBe(false);
      expect(uiManager.dropzone.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Helper Methods', () => {
    test('_formatFileSize should format bytes correctly', () => {
      expect(uiManager._formatFileSize(0)).toBe('0 Bytes');
      expect(uiManager._formatFileSize(1024)).toBe('1 KB');
      expect(uiManager._formatFileSize(1048576)).toBe('1 MB');
      expect(uiManager._formatFileSize(2500000)).toBe('2.38 MB');
      expect(uiManager._formatFileSize(1073741824)).toBe('1 GB');
    });

    test('_escapeHtml should escape HTML special characters', () => {
      expect(uiManager._escapeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(uiManager._escapeHtml('Normal text')).toBe('Normal text');
      expect(uiManager._escapeHtml('<div>Test</div>')).toBe('&lt;div&gt;Test&lt;/div&gt;');
    });
  });
});
