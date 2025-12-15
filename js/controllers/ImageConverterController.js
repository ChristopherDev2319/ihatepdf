/**
 * ImageConverterController.js - Image Conversion Controller
 * 
 * Handles converting images between different formats (PNG, JPG, WebP, GIF)
 * using the Canvas API. All processing is done client-side.
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

export class ImageConverterController {
  /**
   * @param {Object} downloadService - Service for downloading files
   */
  constructor(downloadService) {
    /** @type {Object} */
    this.downloadService = downloadService;
    
    /** @type {HTMLCanvasElement|null} */
    this.canvas = null;
    
    /** @type {CanvasRenderingContext2D|null} */
    this.ctx = null;
    
    /** @type {HTMLImageElement|null} */
    this.loadedImage = null;
    
    /** @type {File|null} */
    this.loadedFile = null;
    
    /** @type {Blob|null} */
    this.convertedBlob = null;
    
    /** @type {string|null} */
    this.convertedFormat = null;
    
    /** @type {boolean} */
    this.isProcessing = false;
    
    /** @type {Function|null} */
    this.onError = null;
    
    /** @type {Function|null} */
    this.onImageLoaded = null;
    
    /** @type {Function|null} */
    this.onConversionComplete = null;
    
    /** @type {string[]} */
    this.supportedFormats = ['png', 'jpg', 'webp', 'gif'];
    
    /** @type {string[]} */
    this.supportedInputTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/svg+xml'
    ];
    
    /** @type {string[]} */
    this.supportedExtensions = [
      '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'
    ];
    
    // Initialize canvas
    this._initCanvas();
  }

  /**
   * Initialize the canvas element
   * @private
   */
  _initCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }


  /**
   * Get list of available output formats
   * @returns {string[]}
   */
  getAvailableFormats() {
    return [...this.supportedFormats];
  }

  /**
   * Validate if a file is a valid image
   * @param {File} file - File to validate
   * @returns {boolean}
   */
  validateImage(file) {
    if (!file) {
      return false;
    }
    
    // Check MIME type
    if (file.type && this.supportedInputTypes.includes(file.type)) {
      return true;
    }
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    return this.supportedExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Get supported formats for display
   * @returns {string[]}
   */
  getSupportedInputFormats() {
    return this.supportedExtensions.map(ext => ext.toUpperCase().slice(1));
  }

  /**
   * Load an image file for conversion
   * @param {File} file - Image file to load
   * @returns {Promise<Object>} - Image info
   */
  async loadImage(file) {
    // Validate file
    if (!this.validateImage(file)) {
      const error = `Archivo no válido. Formatos soportados: ${this.getSupportedInputFormats().join(', ')}`;
      if (this.onError) {
        this.onError(error);
      }
      throw new Error(error);
    }

    this.loadedFile = file;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        
        this.loadedImage = img;
        
        // Set canvas dimensions to match image
        this.canvas.width = img.naturalWidth;
        this.canvas.height = img.naturalHeight;
        
        // Draw image to canvas
        this.ctx.drawImage(img, 0, 0);
        
        const imageInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          previewUrl: this.canvas.toDataURL('image/png')
        };
        
        if (this.onImageLoaded) {
          this.onImageLoaded(imageInfo);
        }
        
        resolve(imageInfo);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        const error = 'Error al cargar la imagen. El archivo puede estar corrupto.';
        if (this.onError) {
          this.onError(error);
        }
        reject(new Error(error));
      };

      img.src = url;
    });
  }

  /**
   * Convert the loaded image to a specified format
   * @param {string} format - Target format ('png', 'jpg', 'webp', 'gif')
   * @param {number} quality - Quality for JPG format (1-100), default 92
   * @returns {Promise<Blob>} - Converted image as Blob
   */
  async convertTo(format, quality = 92) {
    if (!this.loadedImage) {
      throw new Error('No hay imagen cargada');
    }

    const normalizedFormat = format.toLowerCase();
    
    if (!this.supportedFormats.includes(normalizedFormat)) {
      throw new Error(`Formato no soportado: ${format}`);
    }

    this.isProcessing = true;

    try {
      // Redraw image to canvas (in case it was modified)
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // For JPG, fill with white background (no transparency support)
      if (normalizedFormat === 'jpg') {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      
      this.ctx.drawImage(this.loadedImage, 0, 0);

      // Get MIME type and quality
      const mimeType = this._getMimeType(normalizedFormat);
      const qualityValue = normalizedFormat === 'jpg' ? quality / 100 : undefined;

      // Convert canvas to blob
      const blob = await this._canvasToBlob(mimeType, qualityValue);

      this.convertedBlob = blob;
      this.convertedFormat = normalizedFormat;
      this.isProcessing = false;

      if (this.onConversionComplete) {
        this.onConversionComplete(blob, normalizedFormat);
      }

      return blob;
    } catch (error) {
      this.isProcessing = false;
      if (this.onError) {
        this.onError(`Error al convertir imagen: ${error.message}`);
      }
      throw error;
    }
  }


  /**
   * Convert canvas to Blob
   * @param {string} mimeType - MIME type for output
   * @param {number|undefined} quality - Quality value (0-1) for lossy formats
   * @returns {Promise<Blob>}
   * @private
   */
  _canvasToBlob(mimeType, quality) {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al generar la imagen'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Get MIME type for a format
   * @param {string} format - Format name
   * @returns {string} - MIME type
   * @private
   */
  _getMimeType(format) {
    const mimeTypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    return mimeTypes[format] || 'image/png';
  }

  /**
   * Get file extension for a format
   * @param {string} format - Format name
   * @returns {string} - File extension with dot
   * @private
   */
  _getExtension(format) {
    const extensions = {
      'png': '.png',
      'jpg': '.jpg',
      'webp': '.webp',
      'gif': '.gif'
    };
    return extensions[format] || '.png';
  }

  /**
   * Remove extension from filename
   * @param {string} filename
   * @returns {string}
   * @private
   */
  _removeExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(0, lastDot) : filename;
  }

  /**
   * Download the converted image
   * @param {Blob} blob - Image blob (optional, uses convertedBlob if not provided)
   * @param {string} format - Format (optional, uses convertedFormat if not provided)
   */
  downloadConvertedImage(blob = null, format = null) {
    const imageBlob = blob || this.convertedBlob;
    const imageFormat = format || this.convertedFormat;
    
    if (!imageBlob) {
      throw new Error('No hay imagen convertida para descargar');
    }
    
    const baseName = this.loadedFile 
      ? this._removeExtension(this.loadedFile.name) 
      : 'imagen';
    const extension = this._getExtension(imageFormat);
    const filename = `${baseName}${extension}`;
    
    this.downloadService.downloadBlob(imageBlob, filename);
  }

  /**
   * Get preview URL for the converted image
   * @returns {string|null} - Data URL or null if no conversion done
   */
  getConvertedPreviewUrl() {
    if (!this.convertedBlob) {
      return null;
    }
    return URL.createObjectURL(this.convertedBlob);
  }

  /**
   * Get current state
   * @returns {Object}
   */
  getState() {
    return {
      isProcessing: this.isProcessing,
      hasImage: this.loadedImage !== null,
      hasConvertedImage: this.convertedBlob !== null,
      convertedFormat: this.convertedFormat,
      imageInfo: this.loadedImage ? {
        width: this.loadedImage.naturalWidth,
        height: this.loadedImage.naturalHeight
      } : null
    };
  }

  /**
   * Reset the controller state
   */
  reset() {
    this.loadedImage = null;
    this.loadedFile = null;
    this.convertedBlob = null;
    this.convertedFormat = null;
    this.isProcessing = false;
    
    // Clear canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Cleanup and destroy the controller
   */
  destroy() {
    this.reset();
    this.onError = null;
    this.onImageLoaded = null;
    this.onConversionComplete = null;
    this.canvas = null;
    this.ctx = null;
  }
}
