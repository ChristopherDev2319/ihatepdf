/**
 * HubPage.js - Main hub page component for Multimedia Hub
 * 
 * Displays a grid of category cards that navigate to different tools.
 * Requirements: 1.1, 1.4
 */

export class HubPage {
  /**
   * @param {import('../router/Router.js').Router} router - Router instance for navigation
   */
  constructor(router) {
    this.router = router;
    
    /** @type {Array<{id: string, title: string, icon: string, description: string, path: string}>} */
    this.categories = [
      { 
        id: 'pdf', 
        title: 'Herramientas PDF', 
        icon: '📄', 
        description: 'Combina, divide, comprime y más', 
        path: '/pdf' 
      },
      { 
        id: 'audio-record', 
        title: 'Grabar Audio', 
        icon: '🎤', 
        description: 'Graba audio desde tu micrófono', 
        path: '/audio-record' 
      },
      { 
        id: 'screen-record', 
        title: 'Grabar Pantalla', 
        icon: '🖥️', 
        description: 'Captura tu pantalla en video', 
        path: '/screen-record' 
      },
      { 
        id: 'media-extract', 
        title: 'Extraer Media', 
        icon: '🎬', 
        description: 'Extrae audio o video de archivos', 
        path: '/media-extract' 
      },
      { 
        id: 'image-convert', 
        title: 'Convertir Imágenes', 
        icon: '🖼️', 
        description: 'Convierte entre PNG, JPG, WebP', 
        path: '/image-convert' 
      },
      { 
        id: 'bg-remove', 
        title: 'Quitar Fondo', 
        icon: '✂️', 
        description: 'Elimina el fondo de imágenes', 
        path: '/bg-remove' 
      },
      { 
        id: 'transcribe', 
        title: 'Audio a Texto', 
        icon: '📝', 
        description: 'Transcribe audio a texto', 
        path: '/transcribe' 
      }
    ];
    
    /** @type {HTMLElement|null} */
    this.element = null;
  }
  
  /**
   * Render the hub page HTML
   * @returns {string} HTML string for the hub page
   */
  render() {
    const cardsHtml = this.categories.map(category => this.renderCard(category)).join('');
    
    return `
      <div class="hub-page">
        <header class="hub-header">
          <h1 class="hub-header__title">Centro Multimedia</h1>
          <p class="hub-header__subtitle">Herramientas de procesamiento local para tus archivos</p>
        </header>
        
        <section class="hub-grid" aria-label="Categorías de herramientas">
          ${cardsHtml}
        </section>
        
        <footer class="hub-footer">
          <p class="hub-footer__text">
            Todos los archivos se procesan localmente en tu navegador. 
            No se envían datos a ningún servidor.
          </p>
        </footer>
      </div>
    `;
  }
  
  /**
   * Render a single category card
   * @param {{id: string, title: string, icon: string, description: string, path: string}} category
   * @returns {string} HTML string for the card
   */
  renderCard(category) {
    return `
      <article 
        class="hub-card" 
        data-category-id="${category.id}"
        data-path="${category.path}"
        role="button"
        tabindex="0"
        aria-label="${category.title}: ${category.description}">
        <div class="hub-card__icon" aria-hidden="true">${category.icon}</div>
        <h2 class="hub-card__title">${category.title}</h2>
        <p class="hub-card__description">${category.description}</p>
      </article>
    `;
  }
  
  /**
   * Mount the component and attach event listeners
   * @param {HTMLElement} container - Container element
   */
  mount(container) {
    this.element = container;
    
    // Attach click handlers to cards
    const cards = container.querySelectorAll('.hub-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => this.handleCardClick(e));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleCardClick(e);
        }
      });
    });
  }
  
  /**
   * Handle card click event
   * @param {Event} event - Click or keyboard event
   */
  handleCardClick(event) {
    const card = event.currentTarget;
    const categoryId = card.getAttribute('data-category-id');
    const path = card.getAttribute('data-path');
    
    if (path && this.router) {
      this.router.navigate(path);
    }
  }
  
  /**
   * Get a category by its ID
   * @param {string} id - Category ID
   * @returns {{id: string, title: string, icon: string, description: string, path: string}|undefined}
   */
  getCategoryById(id) {
    return this.categories.find(cat => cat.id === id);
  }
  
  /**
   * Get all categories
   * @returns {Array<{id: string, title: string, icon: string, description: string, path: string}>}
   */
  getCategories() {
    return [...this.categories];
  }
  
  /**
   * Cleanup when component is destroyed
   */
  destroy() {
    this.element = null;
  }
}
