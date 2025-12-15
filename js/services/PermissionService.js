/**
 * PermissionService.js - Browser Permission Handling Service
 * 
 * Handles requesting and managing browser permissions for
 * microphone, screen sharing, and other media access.
 */

export class PermissionService {
  constructor() {
    /** @type {Map<string, PermissionState>} */
    this.permissionCache = new Map();
  }
  
  /**
   * Request microphone permission from the browser
   * @returns {Promise<MediaStream>} - MediaStream from microphone
   * @throws {Error} - If permission is denied or unavailable
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      this.permissionCache.set('microphone', 'granted');
      return stream;
    } catch (error) {
      this.permissionCache.set('microphone', 'denied');
      this.handlePermissionDenied('microphone', error);
      throw error;
    }
  }
  
  /**
   * Request screen sharing permission from the browser
   * @param {boolean} includeAudio - Whether to include system audio
   * @returns {Promise<MediaStream>} - MediaStream from screen capture
   * @throws {Error} - If permission is denied or unavailable
   */
  async requestScreenPermission(includeAudio = false) {
    try {
      const displayMediaOptions = {
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: includeAudio
      };
      
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      this.permissionCache.set('screen', 'granted');
      return stream;
    } catch (error) {
      this.permissionCache.set('screen', 'denied');
      this.handlePermissionDenied('screen', error);
      throw error;
    }
  }
  
  /**
   * Check if a permission is available (not necessarily granted)
   * @param {string} type - Permission type ('microphone', 'screen', 'camera')
   * @returns {Promise<boolean>} - True if the API is available
   */
  async isPermissionAvailable(type) {
    switch (type) {
      case 'microphone':
      case 'camera':
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      case 'screen':
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
      default:
        return false;
    }
  }
  
  /**
   * Query the current permission state
   * @param {string} type - Permission type ('microphone', 'camera')
   * @returns {Promise<PermissionState|null>} - Permission state or null if not queryable
   */
  async queryPermissionState(type) {
    // Check cache first
    if (this.permissionCache.has(type)) {
      return this.permissionCache.get(type);
    }
    
    // Try to query permission state (not all browsers support this)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionName = this._getPermissionName(type);
        if (permissionName) {
          const result = await navigator.permissions.query({ name: permissionName });
          return result.state;
        }
      } catch {
        // Permission query not supported for this type
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Handle permission denied errors
   * @param {string} type - Permission type
   * @param {Error} error - The error that occurred
   * @returns {string} - User-friendly error message
   */
  handlePermissionDenied(type, error) {
    const messages = {
      microphone: 'Para grabar audio, necesitas permitir el acceso al micrófono en tu navegador.',
      screen: 'Para grabar la pantalla, necesitas permitir compartir pantalla.',
      camera: 'Para usar la cámara, necesitas permitir el acceso a la cámara en tu navegador.'
    };
    
    const message = messages[type] || `Permiso denegado para ${type}.`;
    
    // Log the actual error for debugging
    console.error(`Permission denied for ${type}:`, error);
    
    return message;
  }
  
  /**
   * Stop all tracks in a media stream
   * @param {MediaStream} stream - The stream to stop
   */
  stopStream(stream) {
    if (stream && stream.getTracks) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
  
  /**
   * Get the permission name for the Permissions API
   * @param {string} type - Internal permission type
   * @returns {string|null} - Permissions API name or null
   * @private
   */
  _getPermissionName(type) {
    const nameMap = {
      microphone: 'microphone',
      camera: 'camera'
      // Note: 'screen' is not queryable via Permissions API
    };
    
    return nameMap[type] || null;
  }
  
  /**
   * Clear the permission cache
   */
  clearCache() {
    this.permissionCache.clear();
  }
}
