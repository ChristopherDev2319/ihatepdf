# Documento de Diseño - IHATEPDF

## Visión General

IHATEPDF es una aplicación web del lado del cliente que permite a los usuarios manipular archivos PDF directamente en su navegador sin necesidad de subir archivos a un servidor. La aplicación utiliza pdf-lib para todas las operaciones con PDF y sigue una arquitectura MVC para mantener el código organizado y mantenible.

### Características Principales

- Procesamiento completamente del lado del cliente (sin servidor)
- Interfaz minimalista y responsiva
- Operaciones: combinar, dividir, comprimir, rotar PDFs y convertir JPG a PDF
- Arquitectura MVC clara y mantenible
- Uso de pdf-lib para manipulación de PDF

## Arquitectura

### Patrón MVC

La aplicación sigue el patrón Modelo-Vista-Controlador:

```
┌─────────────────────────────────────────────────┐
│                    Vista                        │
│  (HTML/CSS - Interfaz de Usuario)              │
│  - Formularios de carga                         │
│  - Botones de acción                            │
│  - Áreas de previsualización                    │
│  - Notificaciones y feedback                    │
└────────────┬────────────────────────────────────┘
             │
             │ Eventos del usuario
             ▼
┌─────────────────────────────────────────────────┐
│                 Controlador                     │
│  (JavaScript - Lógica de Control)              │
│  - PDFCombineController                         │
│  - PDFSplitController                           │
│  - PDFCompressController                        │
│  - PDFRotateController                          │
│  - JPGToPDFController                           │
└────────────┬────────────────────────────────────┘
             │
             │ Llamadas a métodos
             ▼
┌─────────────────────────────────────────────────┐
│                   Modelo                        │
│  (JavaScript - Lógica de Negocio)              │
│  - PDFDocument (wrapper de pdf-lib)            │
│  - FileManager                                  │
│  - PDFOperations                                │
└─────────────────────────────────────────────────┘
```

### Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Biblioteca PDF**: pdf-lib (https://pdf-lib.js.org/)
- **Arquitectura**: MVC puro (sin frameworks)
- **Procesamiento**: 100% del lado del cliente usando Web APIs

## Componentes e Interfaces

### Modelo (Model)

#### PDFDocument
Wrapper alrededor de pdf-lib que proporciona una interfaz simplificada.

```javascript
class PDFDocument {
  constructor(arrayBuffer)
  async load(): Promise<PDFLib.PDFDocument>
  async save(): Promise<Uint8Array>
  getPageCount(): number
  getFileSize(): number
}
```

#### FileManager
Gestiona la carga y descarga de archivos.

```javascript
class FileManager {
  loadFiles(files: FileList): Promise<File[]>
  validatePDFFile(file: File): boolean
  validateJPGFile(file: File): boolean
  downloadFile(blob: Blob, filename: string): void
  downloadFileWithCustomLocation(blob: Blob, filename: string): Promise<void>
  generateDefaultFilename(operation: string, originalFilename?: string): string
  createBlobURL(data: Uint8Array, mimeType: string): string
}
```

#### PDFOperations
Contiene la lógica de negocio para todas las operaciones con PDF.

```javascript
class PDFOperations {
  async combinePDFs(pdfFiles: File[]): Promise<Uint8Array>
  async splitPDF(pdfFile: File, ranges: PageRange[]): Promise<Uint8Array[]>
  async compressPDF(pdfFile: File): Promise<Uint8Array>
  async rotatePDF(pdfFile: File, pages: number[], degrees: number): Promise<Uint8Array>
  async convertJPGToPDF(jpgFiles: File[]): Promise<Uint8Array>
}
```

### Vista (View)

#### UIManager
Gestiona la actualización de la interfaz de usuario.

```javascript
class UIManager {
  showProgress(message: string): void
  hideProgress(): void
  showSuccess(message: string): void
  showError(message: string): void
  updateFileList(files: File[]): void
  clearFileList(): void
  enableControls(): void
  disableControls(): void
  showDownloadOptions(defaultFilename: string): void
  hideDownloadOptions(): void
  getCustomFilename(): string
  isCustomLocationSelected(): boolean
}
```

#### Components
Componentes reutilizables de UI:
- FileUploader: Área de carga de archivos con drag & drop
- FilePreview: Muestra miniaturas y detalles de archivos
- ProgressIndicator: Indicador de progreso para operaciones
- NotificationBanner: Mensajes de éxito/error
- OperationSelector: Selector de operaciones disponibles
- DownloadOptions: Interfaz para personalizar nombre y ubicación de descarga

### Controlador (Controller)

Cada operación tiene su propio controlador:

#### PDFCombineController
```javascript
class PDFCombineController {
  constructor(model: PDFOperations, view: UIManager)
  handleFileSelection(files: FileList): void
  handleReorder(oldIndex: number, newIndex: number): void
  async handleCombine(): Promise<void>
}
```

#### PDFSplitController
```javascript
class PDFSplitController {
  constructor(model: PDFOperations, view: UIManager)
  handleFileSelection(file: File): void
  handleRangeInput(ranges: string): void
  async handleSplit(): Promise<void>
}
```

#### PDFCompressController
```javascript
class PDFCompressController {
  constructor(model: PDFOperations, view: UIManager)
  handleFileSelection(file: File): void
  async handleCompress(): Promise<void>
}
```

#### PDFRotateController
```javascript
class PDFRotateController {
  constructor(model: PDFOperations, view: UIManager)
  handleFileSelection(file: File): void
  handlePageSelection(pages: number[]): void
  handleRotationAngle(degrees: number): void
  async handleRotate(): Promise<void>
}
```

#### JPGToPDFController
```javascript
class JPGToPDFController {
  constructor(model: PDFOperations, view: UIManager)
  handleFileSelection(files: FileList): void
  handleReorder(oldIndex: number, newIndex: number): void
  async handleConvert(): Promise<void>
}
```

## Modelos de Datos

### File Metadata
```javascript
{
  file: File,
  name: string,
  size: number,
  type: string,
  preview: string | null,
  pageCount: number | null
}
```

### Page Range
```javascript
{
  start: number,
  end: number
}
```

### Operation Result
```javascript
{
  success: boolean,
  data: Uint8Array | null,
  error: string | null,
  originalSize: number | null,
  finalSize: number | null
}
```

### UI State
```javascript
{
  currentOperation: string,
  files: FileMetadata[],
  isProcessing: boolean,
  selectedPages: number[],
  rotationAngle: number,
  showDownloadOptions: boolean,
  customFilename: string,
  useCustomLocation: boolean
}
```

### Download Options
```javascript
{
  filename: string,
  useCustomLocation: boolean,
  defaultFilename: string
}
```


## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de corrección verificables por máquina.*

Después de analizar los criterios de aceptación, hemos identificado las siguientes propiedades que pueden ser verificadas mediante Property-Based Testing. Estas propiedades representan invariantes y comportamientos que deben mantenerse para cualquier entrada válida.

### Reflexión sobre Redundancia de Propiedades

Antes de definir las propiedades finales, se realizó un análisis para eliminar redundancias:

- Las propiedades sobre "proporcionar archivo para descarga" (1.3, 2.4, 3.4, 4.4, 5.3) son redundantes entre sí y pueden consolidarse en una propiedad general sobre validez de archivos de salida.
- Las propiedades sobre mostrar información de archivos (10.1, 10.5) pueden combinarse en una sola propiedad sobre extracción de metadatos.
- Las propiedades sobre limpieza de memoria (7.2, 7.5) pueden combinarse en una propiedad general sobre gestión de recursos.

### Propiedades de Combinación de PDFs

**Propiedad 1: Preservación del conteo de páginas al combinar**
*Para cualquier* conjunto de archivos PDF válidos, el número total de páginas en el PDF combinado debe ser igual a la suma de páginas de todos los PDFs individuales.
**Valida: Requisitos 1.2**

**Propiedad 2: Preservación del orden al combinar**
*Para cualquier* permutación de archivos PDF, el orden de las páginas en el PDF resultante debe reflejar el orden de entrada de los archivos.
**Valida: Requisitos 1.4**

**Propiedad 3: Carga de múltiples archivos**
*Para cualquier* número N de archivos PDF válidos (donde N ≥ 2), el sistema debe cargar exitosamente todos los N archivos.
**Valida: Requisitos 1.1**

### Propiedades de División de PDFs

**Propiedad 4: Preservación de páginas al dividir**
*Para cualquier* archivo PDF y conjunto de rangos de páginas válidos no superpuestos, la suma de páginas en todos los PDFs resultantes debe ser igual al número total de páginas especificadas en los rangos.
**Valida: Requisitos 2.3**

**Propiedad 5: Extracción correcta del conteo de páginas**
*Para cualquier* archivo PDF válido, el sistema debe extraer y reportar correctamente el número total de páginas del documento.
**Valida: Requisitos 2.1**

**Propiedad 6: Validación de rangos**
*Para cualquier* archivo PDF con N páginas, el sistema debe rechazar rangos que contengan números de página menores a 1 o mayores a N.
**Valida: Requisitos 2.2**

### Propiedades de Compresión de PDFs

**Propiedad 7: Validez del PDF comprimido**
*Para cualquier* archivo PDF válido, el resultado de la compresión debe ser un PDF válido que pueda ser abierto y leído.
**Valida: Requisitos 3.2**

**Propiedad 8: Reducción o mantenimiento del tamaño**
*Para cualquier* archivo PDF, el tamaño del archivo comprimido debe ser menor o igual al tamaño del archivo original.
**Valida: Requisitos 3.2**

**Propiedad 9: Cálculo correcto del porcentaje de reducción**
*Para cualquier* operación de compresión, el porcentaje de reducción calculado debe ser igual a ((tamaño_original - tamaño_comprimido) / tamaño_original) × 100.
**Valida: Requisitos 3.3**

### Propiedades de Rotación de PDFs

**Propiedad 10: Preservación del conteo de páginas al rotar**
*Para cualquier* archivo PDF y conjunto de páginas seleccionadas para rotar, el número de páginas en el PDF resultante debe ser igual al número de páginas del PDF original.
**Valida: Requisitos 4.3**

**Propiedad 11: Rotación aplicada solo a páginas seleccionadas**
*Para cualquier* archivo PDF, conjunto de páginas seleccionadas S, y ángulo de rotación, solo las páginas en S deben tener su orientación modificada en el PDF resultante.
**Valida: Requisitos 4.3**

### Propiedades de Conversión JPG a PDF

**Propiedad 12: Correspondencia entre imágenes y páginas**
*Para cualquier* conjunto de N imágenes JPG válidas, el PDF resultante debe contener exactamente N páginas.
**Valida: Requisitos 5.2**

**Propiedad 13: Preservación del orden de imágenes**
*Para cualquier* secuencia ordenada de imágenes JPG, el orden de las páginas en el PDF resultante debe coincidir con el orden de entrada de las imágenes.
**Valida: Requisitos 5.4**

**Propiedad 14: Validación de archivos JPG**
*Para cualquier* conjunto de archivos donde al menos uno no es un JPG válido, el sistema debe rechazar los archivos inválidos.
**Valida: Requisitos 5.1**

### Propiedades de Gestión de Archivos

**Propiedad 15: Validez de archivos de salida**
*Para cualquier* operación exitosa (combinar, dividir, comprimir, rotar, convertir), todos los archivos resultantes deben ser PDFs válidos que puedan ser descargados y abiertos.
**Valida: Requisitos 1.3, 2.4, 3.4, 4.4, 5.3**

**Propiedad 16: Extracción de metadatos**
*Para cualquier* archivo cargado (PDF o JPG), el sistema debe extraer correctamente el nombre del archivo y su tamaño en bytes.
**Valida: Requisitos 10.1, 10.5**

**Propiedad 17: Gestión de lista de archivos**
*Para cualquier* lista de archivos cargados con N elementos, remover un archivo debe resultar en una lista con N-1 elementos.
**Valida: Requisitos 10.3**

**Propiedad 18: Visualización de todos los archivos cargados**
*Para cualquier* conjunto de N archivos cargados, la lista de archivos mostrada debe contener exactamente N elementos.
**Valida: Requisitos 10.2**

### Propiedades de Estado de UI

**Propiedad 19: Deshabilitación de controles durante procesamiento**
*Para cualquier* operación en progreso, todos los controles que puedan interferir con la operación deben estar deshabilitados hasta que la operación complete o falle.
**Valida: Requisitos 9.2**

**Propiedad 20: Mensajes de error para operaciones fallidas**
*Para cualquier* operación que falle, el sistema debe mostrar un mensaje de error que contenga información sobre la causa del fallo.
**Valida: Requisitos 9.4**

### Propiedades de Gestión de Recursos

**Propiedad 21: Limpieza de memoria después de operaciones**
*Para cualquier* operación completada (exitosa o fallida), todos los datos temporales de archivos deben ser liberados de la memoria.
**Valida: Requisitos 7.2, 7.5**

### Propiedades de Personalización de Descarga

**Propiedad 22: Generación de nombres por defecto**
*Para cualquier* operación de procesamiento completada sin nombre personalizado, el sistema debe generar un nombre de archivo por defecto que incluya el tipo de operación realizada.
**Valida: Requisitos 11.2**

**Propiedad 23: Uso de ruta personalizada**
*Para cualquier* operación donde el usuario especifica una ruta personalizada, el sistema debe usar esa ruta en lugar del comportamiento de descarga por defecto.
**Valida: Requisitos 11.5**

## Manejo de Errores

### Estrategia General

La aplicación implementa un manejo de errores robusto en tres niveles:

1. **Validación de Entrada**: Antes de procesar
   - Validar tipos de archivo
   - Validar tamaños de archivo
   - Validar rangos y parámetros

2. **Manejo de Operaciones**: Durante el procesamiento
   - Try-catch en todas las operaciones asíncronas
   - Validación de resultados intermedios
   - Rollback en caso de fallo

3. **Feedback al Usuario**: Después del procesamiento
   - Mensajes de error descriptivos
   - Sugerencias de solución
   - Limpieza de estado

### Tipos de Errores

#### Errores de Validación
- Archivo no es PDF válido
- Archivo no es JPG válido
- Tamaño de archivo excede límite
- Rangos de páginas inválidos
- Selección vacía

#### Errores de Procesamiento
- Error al cargar PDF con pdf-lib
- Error al combinar PDFs
- Error al dividir PDF
- Error al comprimir PDF
- Error al rotar páginas
- Error al convertir JPG a PDF

#### Errores de Sistema
- Memoria insuficiente
- Navegador no soportado
- API no disponible

### Implementación

```javascript
class ErrorHandler {
  static handle(error: Error, context: string): ErrorResult {
    // Clasificar error
    // Generar mensaje apropiado
    // Registrar para debugging
    // Retornar resultado estructurado
  }
  
  static isValidationError(error: Error): boolean
  static isProcessingError(error: Error): boolean
  static isSystemError(error: Error): boolean
}
```

## Estrategia de Testing

### Enfoque Dual de Testing

La aplicación utiliza dos enfoques complementarios de testing:

1. **Tests Unitarios**: Verifican ejemplos específicos, casos edge y condiciones de error
2. **Tests Basados en Propiedades (PBT)**: Verifican propiedades universales que deben mantenerse para todas las entradas

Juntos proporcionan cobertura completa: los tests unitarios detectan bugs concretos, los tests de propiedades verifican corrección general.

### Property-Based Testing

**Biblioteca**: fast-check (https://github.com/dubzzz/fast-check)

**Configuración**:
- Cada test de propiedad debe ejecutar un mínimo de 100 iteraciones
- Cada test debe estar etiquetado con un comentario que referencie explícitamente la propiedad de corrección del documento de diseño
- Formato de etiqueta: `// Feature: ihatepdf, Property {número}: {texto de la propiedad}`

**Generadores Personalizados**:
- `arbitraryPDFFile()`: Genera archivos PDF válidos con contenido aleatorio
- `arbitraryJPGFile()`: Genera archivos JPG válidos
- `arbitraryPageRange(maxPages)`: Genera rangos de páginas válidos
- `arbitraryPageSelection(maxPages)`: Genera selecciones de páginas
- `arbitraryRotationAngle()`: Genera ángulos de rotación válidos (90, 180, 270)

**Ejemplo de Test de Propiedad**:
```javascript
// Feature: ihatepdf, Property 1: Preservación del conteo de páginas al combinar
test('combining PDFs preserves total page count', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(arbitraryPDFFile(), { minLength: 2, maxLength: 5 }),
      async (pdfFiles) => {
        const totalPages = pdfFiles.reduce((sum, pdf) => sum + pdf.pageCount, 0);
        const combined = await pdfOperations.combinePDFs(pdfFiles);
        const resultDoc = await PDFDocument.load(combined);
        expect(resultDoc.getPageCount()).toBe(totalPages);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: ihatepdf, Property 22: Generación de nombres por defecto
test('generates default filename based on operation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.constant('combine'),
        fc.constant('split'),
        fc.constant('compress'),
        fc.constant('rotate'),
        fc.constant('convert')
      ),
      fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      (operation, originalFilename) => {
        const defaultName = fileManager.generateDefaultFilename(operation, originalFilename);
        expect(defaultName).toContain(operation);
        expect(defaultName).toMatch(/\.pdf$/);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Tests Unitarios

**Framework**: Jest o Vitest

**Áreas de Cobertura**:
- Validación de entrada con archivos específicos
- Casos edge (archivos vacíos, PDFs de 1 página, etc.)
- Manejo de errores con entradas inválidas
- Integración entre componentes MVC
- Funcionalidad de UI (mostrar/ocultar elementos, actualizar estado)

**Ejemplo de Test Unitario**:
```javascript
describe('FileManager', () => {
  test('validates PDF files correctly', () => {
    const validPDF = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
    const invalidFile = new File(['not a pdf'], 'test.txt', { type: 'text/plain' });
    
    expect(fileManager.validatePDFFile(validPDF)).toBe(true);
    expect(fileManager.validatePDFFile(invalidFile)).toBe(false);
  });
  
  test('rejects empty file selection for combine', () => {
    expect(() => {
      pdfOperations.combinePDFs([]);
    }).toThrow('At least two PDF files are required');
  });
});
```

### Tests de Integración

Verifican el flujo completo de operaciones:
- Cargar archivo → Procesar → Descargar
- Interacción entre Controlador, Modelo y Vista
- Actualización correcta del estado de UI

### Cobertura de Testing

Objetivo de cobertura:
- Líneas: >80%
- Funciones: >85%
- Ramas: >75%
- Propiedades de corrección: 100% (todas las 23 propiedades deben tener tests)

## Consideraciones de Implementación

### Rendimiento

1. **Procesamiento Asíncrono**: Usar Web Workers para operaciones pesadas
2. **Streaming**: Procesar archivos grandes en chunks cuando sea posible
3. **Lazy Loading**: Cargar pdf-lib solo cuando se necesite
4. **Debouncing**: En operaciones de UI como reordenamiento

### Seguridad

1. **Validación Estricta**: Validar todos los archivos antes de procesar
2. **Límites de Tamaño**: Establecer límites razonables para archivos
3. **Sanitización**: Limpiar nombres de archivo antes de descargar
4. **CSP**: Implementar Content Security Policy apropiada

### Accesibilidad

1. **Keyboard Navigation**: Todas las operaciones accesibles por teclado
2. **ARIA Labels**: Etiquetas apropiadas para lectores de pantalla
3. **Focus Management**: Gestión clara del foco durante operaciones
4. **Mensajes de Estado**: Anuncios para lectores de pantalla

### Compatibilidad

**Navegadores Soportados**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**APIs Requeridas**:
- File API
- Blob API
- ArrayBuffer
- URL.createObjectURL
- File System Access API (para ubicación personalizada, con fallback a descarga normal)

### Estructura de Archivos

```
ihatepdf/
├── index.html
├── css/
│   ├── main.css
│   ├── components.css
│   └── responsive.css
├── js/
│   ├── models/
│   │   ├── PDFDocument.js
│   │   ├── FileManager.js
│   │   └── PDFOperations.js
│   ├── views/
│   │   ├── UIManager.js
│   │   └── components/
│   │       ├── FileUploader.js
│   │       ├── FilePreview.js
│   │       ├── ProgressIndicator.js
│   │       └── NotificationBanner.js
│   ├── controllers/
│   │   ├── PDFCombineController.js
│   │   ├── PDFSplitController.js
│   │   ├── PDFCompressController.js
│   │   ├── PDFRotateController.js
│   │   └── JPGToPDFController.js
│   ├── utils/
│   │   ├── ErrorHandler.js
│   │   └── validators.js
│   └── app.js
├── tests/
│   ├── unit/
│   │   ├── models/
│   │   ├── views/
│   │   └── controllers/
│   ├── properties/
│   │   ├── combine.properties.test.js
│   │   ├── split.properties.test.js
│   │   ├── compress.properties.test.js
│   │   ├── rotate.properties.test.js
│   │   ├── convert.properties.test.js
│   │   └── generators/
│   │       └── arbitraries.js
│   └── integration/
│       └── workflows.test.js
└── package.json
```

## Diseño de Interfaz

### Principios de Diseño Minimalista

1. **Simplicidad**: Una operación visible a la vez
2. **Claridad**: Etiquetas claras y acciones obvias
3. **Espacio en Blanco**: Uso generoso de espacio para respirar
4. **Tipografía**: Fuente sans-serif limpia y legible
5. **Color**: Paleta limitada con énfasis en funcionalidad

### Layout Principal

```
┌─────────────────────────────────────────────┐
│              IHATEPDF                       │
│                                             │
│  [Combinar] [Dividir] [Comprimir]          │
│  [Rotar] [JPG→PDF]                         │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │   Arrastra archivos aquí             │ │
│  │   o haz clic para seleccionar        │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Archivos seleccionados:                   │
│  ┌───────────────────────────────────────┐ │
│  │ □ documento1.pdf (2.3 MB) [×]        │ │
│  │ □ documento2.pdf (1.8 MB) [×]        │ │
│  └───────────────────────────────────────┘ │
│                                             │
│           [Procesar]                        │
│                                             │
│  Opciones de descarga: (aparece después)   │
│  ┌───────────────────────────────────────┐ │
│  │ Nombre: [documento_combinado.pdf]    │ │
│  │ □ Elegir ruta personalizada          │ │
│  │           [Descargar]                 │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Paleta de Colores

- **Fondo**: #FFFFFF (blanco)
- **Texto Principal**: #2C3E50 (gris oscuro)
- **Texto Secundario**: #7F8C8D (gris medio)
- **Acento**: #3498DB (azul)
- **Éxito**: #27AE60 (verde)
- **Error**: #E74C3C (rojo)
- **Bordes**: #ECF0F1 (gris claro)

### Tipografía

- **Fuente Principal**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Tamaños**:
  - Título: 32px
  - Subtítulo: 20px
  - Cuerpo: 16px
  - Pequeño: 14px

### Animaciones

- Transiciones suaves (200-300ms)
- Fade in/out para notificaciones
- Indicadores de progreso animados
- Hover states sutiles

## Flujo de Usuario

### Flujo de Combinación

1. Usuario selecciona "Combinar"
2. Usuario arrastra/selecciona múltiples PDFs
3. Sistema muestra lista de archivos con opción de reordenar
4. Usuario hace clic en "Procesar"
5. Sistema muestra progreso
6. Sistema muestra opciones de descarga con nombre por defecto
7. Usuario puede personalizar nombre del archivo (opcional)
8. Usuario puede elegir "Elegir ruta" para ubicación personalizada (opcional)
9. Usuario hace clic en "Descargar"
10. Sistema descarga el PDF combinado

### Flujo de División

1. Usuario selecciona "Dividir"
2. Usuario carga un PDF
3. Sistema muestra número de páginas
4. Usuario especifica rangos (ej: "1-3, 5-7, 10")
5. Usuario hace clic en "Procesar"
6. Sistema genera múltiples PDFs
7. Sistema ofrece descarga de todos los archivos

### Flujo de Compresión

1. Usuario selecciona "Comprimir"
2. Usuario carga un PDF
3. Sistema muestra tamaño original
4. Usuario hace clic en "Procesar"
5. Sistema comprime el archivo
6. Sistema muestra tamaño final y % de reducción
7. Sistema ofrece descarga del PDF comprimido

### Flujo de Rotación

1. Usuario selecciona "Rotar"
2. Usuario carga un PDF
3. Sistema muestra páginas disponibles
4. Usuario selecciona páginas y ángulo (90°, 180°, 270°)
5. Usuario hace clic en "Procesar"
6. Sistema rota las páginas seleccionadas
7. Sistema ofrece descarga del PDF rotado

### Flujo de Conversión JPG→PDF

1. Usuario selecciona "JPG→PDF"
2. Usuario arrastra/selecciona imágenes JPG
3. Sistema muestra miniaturas con opción de reordenar
4. Usuario hace clic en "Procesar"
5. Sistema crea PDF con una imagen por página
6. Sistema ofrece descarga del PDF
