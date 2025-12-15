/**
 * DownloadService.js - File Download Service
 * 
 * Handles downloading files generated client-side.
 * All operations are performed locally without uploading to external servers.
 */

export class DownloadService {
  constructor() {
    /** @type {string[]} */
    this.createdUrls = [];
  }
  
  /**
   * Download a Blob as a file
   * @param {Blob} blob - The blob to download
   * @param {string} filename - The filename for the download
   */
  downloadBlob(blob, filename) {
    if (!(blob instanceof Blob)) {
      throw new Error('DownloadService: Invalid blob provided');
    }
    
    if (!filename || typeof filename !== 'string') {
      throw new Error('DownloadService: Invalid filename provided');
    }
    
    const url = URL.createObjectURL(blob);
    this.createdUrls.push(url);
    
    this._triggerDownload(url, filename);
    
    // Revoke the URL after a short delay to allow download to start
    setTimeout(() => {
      this._revokeUrl(url);
    }, 1000);
  }
  
  /**
   * Download text content as a file
   * @param {string} text - The text content to download
   * @param {string} filename - The filename for the download
   * @param {string} mimeType - MIME type (default: 'text/plain')
   */
  downloadText(text, filename, mimeType = 'text/plain') {
    if (typeof text !== 'string') {
      throw new Error('DownloadService: Invalid text provided');
    }
    
    const blob = new Blob([text], { type: mimeType });
    this.downloadBlob(blob, filename);
  }
  
  /**
   * Download JSON data as a file
   * @param {object} data - The data to download as JSON
   * @param {string} filename - The filename for the download
   */
  downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    this.downloadText(jsonString, filename, 'application/json');
  }
  
  /**
   * Download an ArrayBuffer as a file
   * @param {ArrayBuffer} buffer - The buffer to download
   * @param {string} filename - The filename for the download
   * @param {string} mimeType - MIME type for the file
   */
  downloadArrayBuffer(buffer, filename, mimeType) {
    if (!(buffer instanceof ArrayBuffer)) {
      throw new Error('DownloadService: Invalid ArrayBuffer provided');
    }
    
    const blob = new Blob([buffer], { type: mimeType });
    this.downloadBlob(blob, filename);
  }
  
  /**
   * Create a download URL for a blob without triggering download
   * Useful for preview or delayed download
   * @param {Blob} blob - The blob to create URL for
   * @returns {string} - Object URL for the blob
   */
  createDownloadUrl(blob) {
    if (!(blob instanceof Blob)) {
      throw new Error('DownloadService: Invalid blob provided');
    }
    
    const url = URL.createObjectURL(blob);
    this.createdUrls.push(url);
    return url;
  }
  
  /**
   * Revoke a previously created download URL
   * @param {string} url - The URL to revoke
   */
  revokeDownloadUrl(url) {
    this._revokeUrl(url);
  }
  
  /**
   * Get suggested filename with extension based on MIME type
   * @param {string} baseName - Base filename without extension
   * @param {string} mimeType - MIME type of the file
   * @returns {string} - Filename with appropriate extension
   */
  getFilenameWithExtension(baseName, mimeType) {
    const extensionMap = {
      'audio/webm': '.webm',
      'audio/mp3': '.mp3',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'video/webm': '.webm',
      'video/mp4': '.mp4',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/json': '.json'
    };
    
    const extension = extensionMap[mimeType] || '';
    
    // Check if baseName already has the extension
    if (extension && baseName.toLowerCase().endsWith(extension)) {
      return baseName;
    }
    
    return baseName + extension;
  }
  
  /**
   * Trigger a download using an anchor element
   * @param {string} url - URL to download
   * @param {string} filename - Filename for the download
   * @private
   */
  _triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Revoke an object URL and remove from tracking
   * @param {string} url - URL to revoke
   * @private
   */
  _revokeUrl(url) {
    URL.revokeObjectURL(url);
    
    const index = this.createdUrls.indexOf(url);
    if (index > -1) {
      this.createdUrls.splice(index, 1);
    }
  }
  
  /**
   * Cleanup all created URLs
   * Should be called when leaving a page or destroying the service
   */
  cleanup() {
    this.createdUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.createdUrls = [];
  }
}
