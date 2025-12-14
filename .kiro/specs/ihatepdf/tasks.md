# Plan de Implementación - IHATEPDF

- [x] 1. Configurar estructura del proyecto y dependencias
  - Crear estructura de directorios siguiendo arquitectura MVC
  - Configurar package.json con pdf-lib y fast-check
  - Crear archivo HTML base con estructura semántica
  - Configurar herramientas de testing (Jest/Vitest)
  - _Requisitos: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Implementar capa de Modelo - Gestión de archivos
  - [x] 2.1 Crear clase FileManager
    - Implementar métodos de carga de archivos
    - Implementar validación de archivos PDF y JPG
    - Implementar métodos de descarga y creación de Blob URLs
    - _Requisitos: 1.1, 5.1, 5.5_
  
  - [x] 2.2 Escribir test de propiedad para validación de archivos
    - **Propiedad 14: Validación de archivos JPG**
    - **Valida: Requisitos 5.1**
  
  - [x] 2.3 Escribir tests unitarios para FileManager
    - Test de validación de PDF con archivos válidos e inválidos
    - Test de validación de JPG con archivos válidos e inválidos
    - Test de creación de Blob URLs
    - _Requisitos: 1.1, 5.1, 5.5_

- [x] 3. Implementar capa de Modelo - Wrapper de PDF
  - [x] 3.1 Crear clase PDFDocument
    - Implementar wrapper alrededor de pdf-lib
    - Implementar métodos load() y save()
    - Implementar getPageCount() y getFileSize()
    - _Requisitos: 2.1, 3.1, 10.1_
  
  - [x] 3.2 Escribir test de propiedad para extracción de metadatos
    - **Propiedad 5: Extracción correcta del conteo de páginas**
    - **Valida: Requisitos 2.1**
  
  - [x] 3.3 Escribir tests unitarios para PDFDocument
    - Test de carga de PDF válido
    - Test de obtención de conteo de páginas
    - Test de obtención de tamaño de archivo
    - _Requisitos: 2.1, 3.1_

- [x] 4. Implementar capa de Modelo - Operaciones con PDF
  - [x] 4.1 Crear clase PDFOperations con método combinePDFs
    - Implementar lógica para combinar múltiples PDFs
    - Preservar orden de archivos y páginas
    - _Requisitos: 1.2, 1.4_
  
  - [x] 4.2 Escribir test de propiedad para combinación - preservación de páginas
    - **Propiedad 1: Preservación del conteo de páginas al combinar**
    - **Valida: Requisitos 1.2**
  
  - [x] 4.3 Escribir test de propiedad para combinación - preservación de orden
    - **Propiedad 2: Preservación del orden al combinar**
    - **Valida: Requisitos 1.4**
  
  - [x] 4.4 Implementar método splitPDF
    - Implementar lógica para dividir PDF según rangos
    - Validar rangos de páginas
    - _Requisitos: 2.2, 2.3_
  
  - [x] 4.5 Escribir test de propiedad para división - preservación de páginas
    - **Propiedad 4: Preservación de páginas al dividir**
    - **Valida: Requisitos 2.3**
  
  - [x] 4.6 Escribir test de propiedad para división - validación de rangos
    - **Propiedad 6: Validación de rangos**
    - **Valida: Requisitos 2.2**
  
  - [x] 4.7 Implementar método compressPDF
    - Implementar lógica de compresión usando pdf-lib
    - Calcular porcentaje de reducción
    - _Requisitos: 3.2, 3.3_
  
  - [x] 4.8 Escribir test de propiedad para compresión - validez del resultado
    - **Propiedad 7: Validez del PDF comprimido**
    - **Valida: Requisitos 3.2**
  
  - [x] 4.9 Escribir test de propiedad para compresión - reducción de tamaño
    - **Propiedad 8: Reducción o mantenimiento del tamaño**
    - **Valida: Requisitos 3.2**
  
  - [x] 4.10 Escribir test de propiedad para compresión - cálculo de porcentaje
    - **Propiedad 9: Cálculo correcto del porcentaje de reducción**
    - **Valida: Requisitos 3.3**
  
  - [x] 4.11 Implementar método rotatePDF
    - Implementar lógica para rotar páginas específicas
    - Soportar ángulos de 90, 180 y 270 grados
    - _Requisitos: 4.1, 4.3_
  
  - [x] 4.12 Escribir test de propiedad para rotación - preservación de páginas
    - **Propiedad 10: Preservación del conteo de páginas al rotar**
    - **Valida: Requisitos 4.3**
  
  - [x] 4.13 Escribir test de propiedad para rotación - páginas seleccionadas
    - **Propiedad 11: Rotación aplicada solo a páginas seleccionadas**
    - **Valida: Requisitos 4.3**
  
  - [x] 4.14 Implementar método convertJPGToPDF
    - Implementar lógica para convertir imágenes JPG a PDF
    - Crear una página por imagen
    - Preservar orden de imágenes
    - _Requisitos: 5.2, 5.4_
  
  - [x] 4.15 Escribir test de propiedad para conversión - correspondencia de páginas
    - **Propiedad 12: Correspondencia entre imágenes y páginas**
    - **Valida: Requisitos 5.2**
  
  - [x] 4.16 Escribir test de propiedad para conversión - preservación de orden
    - **Propiedad 13: Preservación del orden de imágenes**
    - **Valida: Requisitos 5.4**

- [x] 5. Checkpoint - Verificar que el Modelo funciona correctamente
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas

- [x] 6. Implementar capa de Vista - UIManager
  - [x] 6.1 Crear clase UIManager
    - Implementar métodos para mostrar/ocultar progreso
    - Implementar métodos para mostrar éxito/error
    - Implementar métodos para actualizar lista de archivos
    - Implementar métodos para habilitar/deshabilitar controles
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 10.2_
  
  - [x] 6.2 Escribir test de propiedad para deshabilitación de controles
    - **Propiedad 19: Deshabilitación de controles durante procesamiento**
    - **Valida: Requisitos 9.2**
  
  - [x] 6.3 Escribir test de propiedad para mensajes de error
    - **Propiedad 20: Mensajes de error para operaciones fallidas**
    - **Valida: Requisitos 9.4**
  
  - [x] 6.4 Escribir tests unitarios para UIManager
    - Test de mostrar/ocultar indicador de progreso
    - Test de mostrar notificaciones de éxito
    - Test de mostrar mensajes de error
    - Test de habilitar/deshabilitar controles
    - _Requisitos: 9.1, 9.2, 9.3, 9.4_

- [x] 7. Implementar componentes de Vista
  - [x] 7.1 Crear componente FileUploader
    - Implementar área de drag & drop
    - Implementar selector de archivos
    - Manejar eventos de carga
    - _Requisitos: 1.1, 5.1_
  
  - [x] 7.2 Crear componente FilePreview
    - Mostrar lista de archivos cargados
    - Mostrar metadatos (nombre, tamaño)
    - Implementar funcionalidad de reordenamiento
    - Implementar botón de eliminación
    - _Requisitos: 10.1, 10.2, 10.3, 10.5_
  
  - [x] 7.3 Escribir test de propiedad para gestión de lista
    - **Propiedad 17: Gestión de lista de archivos**
    - **Valida: Requisitos 10.3**
  
  - [x] 7.4 Escribir test de propiedad para visualización de archivos
    - **Propiedad 18: Visualización de todos los archivos cargados**
    - **Valida: Requisitos 10.2**
  
  - [x] 7.5 Crear componente ProgressIndicator
    - Implementar indicador de progreso animado
    - Mostrar mensajes de estado
    - _Requisitos: 9.1, 9.5_
  
  - [x] 7.4 Crear componente NotificationBanner
    - Implementar banner de notificaciones
    - Soportar tipos: éxito, error, info
    - Implementar auto-cierre
    - _Requisitos: 9.3, 9.4_

- [x] 8. Implementar capa de Controlador - PDFCombineController
  - [x] 8.1 Crear clase PDFCombineController
    - Implementar handleFileSelection
    - Implementar handleReorder
    - Implementar handleCombine con validación
    - Conectar con Modelo y Vista
    - _Requisitos: 1.1, 1.2, 1.4, 1.5_
  
  - [x] 8.2 Escribir test de propiedad para carga múltiple
    - **Propiedad 3: Carga de múltiples archivos**
    - **Valida: Requisitos 1.1**
  
  - [x] 8.3 Escribir tests unitarios para PDFCombineController
    - Test de manejo de selección de archivos
    - Test de reordenamiento
    - Test de validación de entrada vacía (edge case)
    - Test de integración con Modelo y Vista
    - _Requisitos: 1.1, 1.4, 1.5_

- [x] 9. Implementar capa de Controlador - PDFSplitController
  - [x] 9.1 Crear clase PDFSplitController
    - Implementar handleFileSelection
    - Implementar handleRangeInput con validación
    - Implementar handleSplit
    - Conectar con Modelo y Vista
    - _Requisitos: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 9.2 Escribir tests unitarios para PDFSplitController
    - Test de manejo de selección de archivo
    - Test de parsing de rangos
    - Test de validación de rangos inválidos (edge case)
    - Test de validación de rangos superpuestos (edge case)
    - _Requisitos: 2.2, 2.5_

- [x] 10. Implementar capa de Controlador - PDFCompressController
  - [x] 10.1 Crear clase PDFCompressController
    - Implementar handleFileSelection
    - Implementar handleCompress
    - Mostrar tamaños y porcentaje de reducción
    - Conectar con Modelo y Vista
    - _Requisitos: 3.1, 3.2, 3.3_
  
  - [x] 10.2 Escribir tests unitarios para PDFCompressController
    - Test de manejo de selección de archivo
    - Test de cálculo de porcentaje de reducción
    - Test de integración con Modelo y Vista
    - _Requisitos: 3.1, 3.3_

- [x] 11. Implementar capa de Controlador - PDFRotateController
  - [x] 11.1 Crear clase PDFRotateController
    - Implementar handleFileSelection
    - Implementar handlePageSelection con validación
    - Implementar handleRotationAngle
    - Implementar handleRotate
    - Conectar con Modelo y Vista
    - _Requisitos: 4.1, 4.3, 4.5_
  
  - [x] 11.2 Escribir tests unitarios para PDFRotateController
    - Test de manejo de selección de archivo
    - Test de selección de páginas
    - Test de validación de selección vacía (edge case)
    - Test de integración con Modelo y Vista
    - _Requisitos: 4.1, 4.5_

- [x] 12. Implementar capa de Controlador - JPGToPDFController
  - [x] 12.1 Crear clase JPGToPDFController
    - Implementar handleFileSelection con validación
    - Implementar handleReorder
    - Implementar handleConvert
    - Conectar con Modelo y Vista
    - _Requisitos: 5.1, 5.2, 5.4, 5.5_
  
  - [x] 12.2 Escribir tests unitarios para JPGToPDFController
    - Test de manejo de selección de archivos
    - Test de validación de archivos no-JPG (edge case)
    - Test de reordenamiento
    - Test de integración con Modelo y Vista
    - _Requisitos: 5.1, 5.5_

- [x] 13. Checkpoint - Verificar que MVC está integrado correctamente
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas

- [x] 14. Implementar manejo de errores
  - [x] 14.1 Crear clase ErrorHandler
    - Implementar clasificación de errores
    - Implementar generación de mensajes descriptivos
    - Implementar métodos de utilidad para tipos de error
    - _Requisitos: 1.5, 2.5, 4.5, 5.5, 9.4_
  
  - [x] 14.2 Escribir tests unitarios para ErrorHandler
    - Test de clasificación de errores de validación
    - Test de clasificación de errores de procesamiento
    - Test de generación de mensajes apropiados
    - _Requisitos: 9.4_

- [x] 15. Implementar gestión de recursos y memoria
  - [x] 15.1 Agregar limpieza de memoria en PDFOperations
    - Implementar liberación de ArrayBuffers después de operaciones
    - Implementar limpieza de URLs temporales
    - _Requisitos: 7.2, 7.5_
  
  - [x] 15.2 Escribir test de propiedad para limpieza de memoria
    - **Propiedad 21: Limpieza de memoria después de operaciones**
    - **Valida: Requisitos 7.2, 7.5**
  
  - [x] 15.3 Escribir tests unitarios para gestión de recursos
    - Test de liberación de memoria después de operación exitosa
    - Test de liberación de memoria después de operación fallida
    - _Requisitos: 7.2, 7.5_

- [x] 16. Implementar interfaz HTML
  - [x] 16.1 Crear estructura HTML principal
    - Crear header con título IHATEPDF
    - Crear selector de operaciones (botones)
    - Crear área de carga de archivos
    - Crear área de lista de archivos
    - Crear botón de procesamiento
    - Crear área de notificaciones
    - _Requisitos: 6.1, 6.2_
  
  - [x] 16.2 Agregar elementos específicos por operación
    - Agregar controles para división (input de rangos)
    - Agregar controles para rotación (selector de páginas y ángulo)
    - Agregar indicadores de progreso
    - _Requisitos: 2.2, 4.1, 4.2, 9.1_

- [x] 17. Implementar estilos CSS
  - [x] 17.1 Crear estilos base (main.css)
    - Implementar reset y variables CSS
    - Implementar tipografía (fuente Inter)
    - Implementar paleta de colores
    - Implementar layout principal
    - _Requisitos: 6.1, 6.2, 6.5_
  
  - [x] 17.2 Crear estilos de componentes (components.css)
    - Estilizar botones de operaciones
    - Estilizar área de drag & drop
    - Estilizar lista de archivos
    - Estilizar indicadores de progreso
    - Estilizar notificaciones
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 17.3 Crear estilos responsivos (responsive.css)
    - Implementar media queries para tablets
    - Implementar media queries para móviles
    - Asegurar usabilidad en pantallas pequeñas
    - _Requisitos: 6.1, 6.2_

- [x] 18. Implementar archivo principal de aplicación
  - [x] 18.1 Crear app.js
    - Inicializar todos los componentes MVC
    - Configurar event listeners
    - Implementar navegación entre operaciones
    - Conectar controladores con vistas
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 18.2 Escribir tests de integración para flujos completos
    - Test de flujo completo de combinación
    - Test de flujo completo de división
    - Test de flujo completo de compresión
    - Test de flujo completo de rotación
    - Test de flujo completo de conversión JPG→PDF
    - _Requisitos: 1.1-1.5, 2.1-2.5, 3.1-3.4, 4.1-4.4, 5.1-5.5_

- [x] 19. Implementar generadores para property-based testing
  - [x] 19.1 Crear arbitraries.js
    - Implementar arbitraryPDFFile()
    - Implementar arbitraryJPGFile()
    - Implementar arbitraryPageRange(maxPages)
    - Implementar arbitraryPageSelection(maxPages)
    - Implementar arbitraryRotationAngle()
    - _Requisitos: Todos los requisitos de testing_
  
  - [x] 19.2 Escribir tests para validar generadores
    - Test de que arbitraryPDFFile genera PDFs válidos
    - Test de que arbitraryJPGFile genera JPGs válidos
    - Test de que arbitraryPageRange genera rangos válidos
    - _Requisitos: Testing_

- [x] 20. Escribir test de propiedad para validez de archivos de salida
  - [x] 20.1 Implementar test de propiedad general
    - **Propiedad 15: Validez de archivos de salida**
    - **Valida: Requisitos 1.3, 2.4, 3.4, 4.4, 5.3**
  
  - [x] 20.2 Implementar test de propiedad para extracción de metadatos
    - **Propiedad 16: Extracción de metadatos**
    - **Valida: Requisitos 10.1, 10.5**

- [x] 21. Implementar funcionalidad de personalización de descarga
  - [x] 21.1 Actualizar FileManager con métodos de descarga personalizada
    - Implementar generateDefaultFilename() para generar nombres basados en operación
    - Implementar downloadFileWithCustomLocation() usando File System Access API
    - Agregar fallback para navegadores sin soporte de File System Access API
    - _Requisitos: 11.2, 11.4, 11.5_
  
  - [x] 21.2 Escribir test de propiedad para generación de nombres por defecto
    - **Propiedad 22: Generación de nombres por defecto**
    - **Valida: Requisitos 11.2**
  
  - [x] 21.3 Escribir test de propiedad para uso de ruta personalizada
    - **Propiedad 23: Uso de ruta personalizada**
    - **Valida: Requisitos 11.5**
  
  - [x] 21.4 Escribir tests unitarios para FileManager actualizado
    - Test de generación de nombres por defecto para cada operación
    - Test de detección de soporte de File System Access API
    - Test de fallback a descarga normal cuando no hay soporte
    - _Requisitos: 11.2, 11.4, 11.5_

- [x] 22. Implementar componente DownloadOptions
  - [x] 22.1 Crear componente DownloadOptions
    - Implementar campo de entrada para nombre personalizado
    - Implementar checkbox para "Elegir ruta"
    - Implementar botón de descarga
    - Conectar con FileManager para descargas
    - _Requisitos: 11.1, 11.3, 11.4_
  
  - [x] 22.2 Actualizar UIManager para opciones de descarga
    - Implementar showDownloadOptions() y hideDownloadOptions()
    - Implementar getCustomFilename() e isCustomLocationSelected()
    - Integrar componente DownloadOptions en la interfaz
    - _Requisitos: 11.1_
  
  - [x] 22.3 Escribir tests unitarios para DownloadOptions
    - Test de mostrar/ocultar opciones de descarga
    - Test de obtener nombre personalizado
    - Test de detectar selección de ubicación personalizada
    - _Requisitos: 11.1_

- [x] 23. Actualizar controladores para usar opciones de descarga
  - [x] 23.1 Actualizar PDFCombineController
    - Mostrar opciones de descarga después de procesamiento exitoso
    - Usar nombre personalizado y ubicación si se especifica
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 23.2 Actualizar PDFSplitController
    - Mostrar opciones de descarga para archivos múltiples
    - Generar nombres por defecto para cada archivo dividido
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 23.3 Actualizar PDFCompressController
    - Mostrar opciones de descarga después de compresión
    - Usar nombre por defecto que indique compresión
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 23.4 Actualizar PDFRotateController
    - Mostrar opciones de descarga después de rotación
    - Usar nombre por defecto que indique rotación
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 23.5 Actualizar JPGToPDFController
    - Mostrar opciones de descarga después de conversión
    - Usar nombre por defecto que indique conversión
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 23.6 Escribir tests unitarios para controladores actualizados
    - Test de mostrar opciones de descarga en cada controlador
    - Test de uso de nombres personalizados
    - Test de integración con FileManager actualizado
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 24. Actualizar interfaz HTML y CSS
  - [x] 24.1 Agregar elementos HTML para opciones de descarga
    - Agregar campo de entrada para nombre personalizado
    - Agregar checkbox para "Elegir ruta"
    - Agregar botón de descarga
    - Ocultar por defecto, mostrar después de procesamiento
    - _Requisitos: 11.1, 11.3, 11.4_
  
  - [x] 24.2 Actualizar estilos CSS para opciones de descarga
    - Estilizar campo de entrada de nombre
    - Estilizar checkbox y etiqueta
    - Estilizar botón de descarga
    - Agregar animaciones de mostrar/ocultar
    - _Requisitos: 11.1_

- [x] 25. Escribir tests de integración para flujo completo de descarga
  - [x] 25.1 Test de flujo con nombre por defecto
    - Test de procesamiento → mostrar opciones → descargar con nombre por defecto
    - _Requisitos: 11.1, 11.2, 11.3_
  
  - [x] 25.2 Test de flujo con nombre personalizado
    - Test de procesamiento → personalizar nombre → descargar
    - _Requisitos: 11.1, 11.3_
  
  - [x] 25.3 Test de flujo con ubicación personalizada
    - Test de procesamiento → elegir ruta → descargar en ubicación personalizada
    - _Requisitos: 11.1, 11.4, 11.5_

- [x] 26. Checkpoint - Verificar funcionalidad de descarga personalizada
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas

- [ ] 27. Implementar características de accesibilidad
  - [ ] 27.1 Agregar soporte de teclado
    - Implementar navegación por teclado en todos los controles
    - Implementar atajos de teclado para operaciones comunes
    - Asegurar orden de tabulación lógico
    - _Requisitos: 6.1, 6.2_
  
  - [ ] 27.2 Agregar ARIA labels y roles
    - Agregar labels descriptivos a todos los controles
    - Agregar roles ARIA apropiados
    - Implementar live regions para notificaciones
    - _Requisitos: 6.1, 9.3, 9.4_
  
  - [ ] 27.3 Implementar gestión de foco
    - Gestionar foco durante operaciones
    - Retornar foco a elementos apropiados después de acciones
    - _Requisitos: 6.1, 9.1_

- [ ] 28. Checkpoint final - Verificar que todo funciona
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas
