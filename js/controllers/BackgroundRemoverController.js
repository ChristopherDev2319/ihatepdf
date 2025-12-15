/**
 * BackgroundRemoverController.js - Background Removal Controller
 * 
 * Handles removing backgrounds from images using canvas manipulation.
 * Generates PNG output with alpha channel for transparency.
 * All processing is done client-side.
 * 
 * Requirements: 6.1, 6.2, 6.4
 */

export class BackgroundRemoverController {
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
    this.originalImage = null;
    
    /** @type {File|null} */
    this.loadedFile = null;
    
    /** @type {Blob|null} */
    this.processedBlob = null;
    
    /** @type {boolean} */
    this.isProcessing = false;
    
    /** @type {number} */
    this.progress = 0;
    
    /** @type {Function|null} */
    this.onError = null;
    
    /** @type {Function|null} */
    this.onImageLoaded = null;
    
    /** @type {Function|null} */
    this.onProcessingComplete = null;
    
    /** @type {Function|null} */
    this.onProgressUpdate = null;
    
    /** @type {string[]} */
    this.supportedInputTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/bmp'
    ];
    
    /** @type {string[]} */
    this.supportedExtensions = [
      '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'
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
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
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
   * Load an image file for processing
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
    this.processedBlob = null;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        
        this.originalImage = img;
        
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
   * Remove background from the loaded image
   * Uses color-based background detection algorithm
   * @param {Object} options - Processing options
   * @param {number} options.tolerance - Color tolerance (0-255), default 30
   * @param {string} options.backgroundColor - Expected background color, default 'auto'
   * @returns {Promise<Blob>} - Processed image as PNG Blob with alpha channel
   */
  async removeBackground(options = {}) {
    if (!this.originalImage) {
      throw new Error('No hay imagen cargada');
    }

    const tolerance = options.tolerance ?? 30;
    const backgroundColor = options.backgroundColor ?? 'auto';

    this.isProcessing = true;
    this.progress = 0;

    try {
      // Redraw original image to canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.originalImage, 0, 0);

      // Get image data
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      // Detect background color if auto
      const bgColor = backgroundColor === 'auto' 
        ? this._detectBackgroundColor(data, this.canvas.width, this.canvas.height)
        : this._parseColor(backgroundColor);

      this._updateProgress(10);

      // Process pixels to remove background
      await this._processPixels(data, bgColor, tolerance);

      this._updateProgress(90);

      // Put processed image data back
      this.ctx.putImageData(imageData, 0, 0);

      // Convert to PNG blob with alpha channel
      const blob = await this._canvasToBlob();

      this.processedBlob = blob;
      this.isProcessing = false;
      this.progress = 100;

      this._updateProgress(100);

      if (this.onProcessingComplete) {
        this.onProcessingComplete(blob);
      }

      return blob;
    } catch (error) {
      this.isProcessing = false;
      this.progress = 0;
      if (this.onError) {
        this.onError(`Error al procesar imagen: ${error.message}`);
      }
      throw error;
    }
  }


  /**
   * Detect the most likely background color from image edges
   * @param {Uint8ClampedArray} data - Image pixel data
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Object} - RGB color object {r, g, b}
   * @private
   */
  _detectBackgroundColor(data, width, height) {
    const colorCounts = new Map();
    const sampleSize = Math.min(50, Math.floor(width / 4), Math.floor(height / 4));
    
    // Sample pixels from all four edges
    const samplePixel = (x, y) => {
      const idx = (y * width + x) * 4;
      // Quantize colors to reduce noise (group similar colors)
      const r = Math.round(data[idx] / 10) * 10;
      const g = Math.round(data[idx + 1] / 10) * 10;
      const b = Math.round(data[idx + 2] / 10) * 10;
      const key = `${r},${g},${b}`;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    };

    // Sample top edge
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / sampleSize))) {
      samplePixel(x, 0);
      samplePixel(x, 1);
    }
    
    // Sample bottom edge
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / sampleSize))) {
      samplePixel(x, height - 1);
      samplePixel(x, height - 2);
    }
    
    // Sample left edge
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / sampleSize))) {
      samplePixel(0, y);
      samplePixel(1, y);
    }
    
    // Sample right edge
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / sampleSize))) {
      samplePixel(width - 1, y);
      samplePixel(width - 2, y);
    }

    // Find most common color
    let maxCount = 0;
    let bgColorKey = '255,255,255'; // Default to white
    
    for (const [key, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count;
        bgColorKey = key;
      }
    }

    const [r, g, b] = bgColorKey.split(',').map(Number);
    return { r, g, b };
  }

  /**
   * Parse a color string to RGB object
   * @param {string} color - Color string (hex or rgb)
   * @returns {Object} - RGB color object {r, g, b}
   * @private
   */
  _parseColor(color) {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    
    // Handle rgb() format
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
      };
    }
    
    // Default to white
    return { r: 255, g: 255, b: 255 };
  }

  /**
   * Process pixels to remove background color
   * @param {Uint8ClampedArray} data - Image pixel data
   * @param {Object} bgColor - Background color {r, g, b}
   * @param {number} tolerance - Color tolerance
   * @private
   */
  async _processPixels(data, bgColor, tolerance) {
    const totalPixels = data.length / 4;
    const chunkSize = 50000; // Process in chunks for progress updates
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color distance from background
      const distance = Math.sqrt(
        Math.pow(r - bgColor.r, 2) +
        Math.pow(g - bgColor.g, 2) +
        Math.pow(b - bgColor.b, 2)
      );
      
      // If color is close to background, make transparent
      if (distance <= tolerance) {
        data[i + 3] = 0; // Set alpha to 0 (fully transparent)
      } else if (distance <= tolerance * 2) {
        // Gradual transparency for edge pixels (anti-aliasing)
        const alpha = Math.min(255, Math.floor((distance - tolerance) / tolerance * 255));
        data[i + 3] = alpha;
      }
      
      // Update progress periodically
      if ((i / 4) % chunkSize === 0) {
        const pixelProgress = (i / 4) / totalPixels;
        this._updateProgress(10 + pixelProgress * 80);
        // Yield to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Update progress and notify listeners
   * @param {number} progress - Progress percentage (0-100)
   * @private
   */
  _updateProgress(progress) {
    this.progress = Math.round(progress);
    if (this.onProgressUpdate) {
      this.onProgressUpdate(this.progress);
    }
  }

  /**
   * Convert canvas to PNG Blob with alpha channel
   * @returns {Promise<Blob>}
   * @private
   */
  _canvasToBlob() {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al generar la imagen'));
          }
        },
        'image/png' // PNG format preserves alpha channel
      );
    });
  }


  /**
   * Get preview URL for the original image
   * @returns {string|null} - Data URL or null if no image loaded
   */
  getOriginalPreviewUrl() {
    if (!this.originalImage) {
      return null;
    }
    
    // Create a temporary canvas for the original preview
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.originalImage.naturalWidth;
    tempCanvas.height = this.originalImage.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.originalImage, 0, 0);
    
    return tempCanvas.toDataURL('image/png');
  }

  /**
   * Get preview URL for the processed image
   * @returns {string|null} - Object URL or null if no processing done
   */
  getProcessedPreviewUrl() {
    if (!this.processedBlob) {
      return null;
    }
    return URL.createObjectURL(this.processedBlob);
  }

  /**
   * Download the processed image
   * @param {Blob} blob - Image blob (optional, uses processedBlob if not provided)
   */
  downloadResult(blob = null) {
    const imageBlob = blob || this.processedBlob;
    
    if (!imageBlob) {
      throw new Error('No hay imagen procesada para descargar');
    }
    
    const baseName = this.loadedFile 
      ? this._removeExtension(this.loadedFile.name) 
      : 'imagen';
    const filename = `${baseName}_sin_fondo.png`;
    
    this.downloadService.downloadBlob(imageBlob, filename);
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
   * Get current state
   * @returns {Object}
   */
  getState() {
    return {
      isProcessing: this.isProcessing,
      progress: this.progress,
      hasImage: this.originalImage !== null,
      hasProcessedImage: this.processedBlob !== null,
      imageInfo: this.originalImage ? {
        width: this.originalImage.naturalWidth,
        height: this.originalImage.naturalHeight
      } : null
    };
  }

  /**
   * Reset the controller state
   */
  reset() {
    this.originalImage = null;
    this.loadedFile = null;
    this.processedBlob = null;
    this.isProcessing = false;
    this.progress = 0;
    
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
    this.onProcessingComplete = null;
    this.onProgressUpdate = null;
    this.canvas = null;
    this.ctx = null;
  }
}
