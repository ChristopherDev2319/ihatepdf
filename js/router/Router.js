/**
 * Router.js - Hash-based SPA Router for Multimedia Hub
 * 
 * Handles route registration, navigation, and history management
 * using hash-based routing for single-page application navigation.
 */

export class Router {
  constructor() {
    /** @type {Map<string, {component: Function, instance: any}>} */
    this.routes = new Map();
    
    /** @type {string|null} */
    this.currentRoute = null;
    
    /** @type {any} */
    this.currentInstance = null;
    
    /** @type {HTMLElement|null} */
    this.container = null;
    
    /** @type {Function|null} */
    this.notFoundHandler = null;
    
    // Bind the hash change handler
    this._onHashChange = this._onHashChange.bind(this);
  }
  
  /**
   * Initialize the router with a container element
   * @param {HTMLElement|string} container - Container element or selector
   * @returns {Router} - Returns this for chaining
   */
  init(container) {
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
    } else {
      this.container = container;
    }
    
    if (!this.container) {
      throw new Error('Router: Container element not found');
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', this._onHashChange);
    
    // Handle initial route
    this._onHashChange();
    
    return this;
  }
  
  /**
   * Register a route with its component
   * @param {string} path - Route path (e.g., '/pdf', '/audio-record')
   * @param {Function} component - Component class or factory function
   * @returns {Router} - Returns this for chaining
   */
  register(path, component) {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw new Error(`Router: Invalid path "${path}". Paths must start with /`);
    }
    
    if (typeof component !== 'function') {
      throw new Error('Router: Component must be a function or class');
    }
    
    this.routes.set(path, { component, instance: null });
    return this;
  }
  
  /**
   * Set a handler for 404 (not found) routes
   * @param {Function} handler - Handler function for not found routes
   * @returns {Router} - Returns this for chaining
   */
  setNotFoundHandler(handler) {
    this.notFoundHandler = handler;
    return this;
  }
  
  /**
   * Navigate to a specific path
   * @param {string} path - Path to navigate to
   */
  navigate(path) {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Update the hash (this will trigger hashchange event)
    window.location.hash = path;
  }
  
  /**
   * Get the current route path
   * @returns {string} - Current route path
   */
  getCurrentRoute() {
    return this.currentRoute || '/';
  }
  
  /**
   * Get the current component instance
   * @returns {any} - Current component instance
   */
  getCurrentInstance() {
    return this.currentInstance;
  }
  
  /**
   * Check if a route is registered
   * @param {string} path - Path to check
   * @returns {boolean} - True if route exists
   */
  hasRoute(path) {
    return this.routes.has(path);
  }
  
  /**
   * Get all registered routes
   * @returns {string[]} - Array of registered paths
   */
  getRoutes() {
    return Array.from(this.routes.keys());
  }
  
  /**
   * Handle hash change events
   * @private
   */
  _onHashChange() {
    const hash = window.location.hash.slice(1) || '/';
    const path = hash.startsWith('/') ? hash : '/' + hash;
    
    this._loadRoute(path);
  }
  
  /**
   * Load a route and render its component
   * @param {string} path - Path to load
   * @private
   */
  _loadRoute(path) {
    // Cleanup current instance if it has a destroy method
    if (this.currentInstance && typeof this.currentInstance.destroy === 'function') {
      this.currentInstance.destroy();
    }
    
    const route = this.routes.get(path);
    
    if (!route) {
      this.currentRoute = path;
      this.currentInstance = null;
      
      if (this.notFoundHandler) {
        this.notFoundHandler(path, this.container);
      } else {
        this._renderNotFound(path);
      }
      return;
    }
    
    this.currentRoute = path;
    
    try {
      // Create new instance of the component
      const instance = new route.component(this);
      this.currentInstance = instance;
      route.instance = instance;
      
      // Render the component if it has a render method
      if (typeof instance.render === 'function') {
        const content = instance.render();
        if (content) {
          if (typeof content === 'string') {
            this.container.innerHTML = content;
          } else if (content instanceof HTMLElement) {
            this.container.innerHTML = '';
            this.container.appendChild(content);
          }
        }
      }
      
      // Call mount lifecycle hook if available
      if (typeof instance.mount === 'function') {
        instance.mount(this.container);
      }
    } catch (error) {
      console.error(`Router: Error loading route "${path}":`, error);
      this._renderError(path, error);
    }
  }
  
  /**
   * Render a 404 not found page
   * @param {string} path - The path that was not found
   * @private
   */
  _renderNotFound(path) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="router-error">
          <h2>Página no encontrada</h2>
          <p>La ruta "${path}" no existe.</p>
          <a href="#/" class="btn btn--primary">Volver al inicio</a>
        </div>
      `;
    }
  }
  
  /**
   * Render an error page
   * @param {string} path - The path that caused the error
   * @param {Error} error - The error that occurred
   * @private
   */
  _renderError(path, error) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="router-error">
          <h2>Error al cargar la página</h2>
          <p>Ocurrió un error al cargar "${path}".</p>
          <p class="error-message">${error.message}</p>
          <a href="#/" class="btn btn--primary">Volver al inicio</a>
        </div>
      `;
    }
  }
  
  /**
   * Destroy the router and cleanup
   */
  destroy() {
    window.removeEventListener('hashchange', this._onHashChange);
    
    // Cleanup current instance
    if (this.currentInstance && typeof this.currentInstance.destroy === 'function') {
      this.currentInstance.destroy();
    }
    
    this.routes.clear();
    this.currentRoute = null;
    this.currentInstance = null;
    this.container = null;
  }
}
