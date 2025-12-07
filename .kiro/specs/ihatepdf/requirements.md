# Documento de Requisitos - IHATEPDF

## Introducción

IHATEPDF es una aplicación web que permite a los usuarios manipular archivos PDF de manera sencilla y eficiente. La aplicación proporciona funcionalidades para combinar, dividir, comprimir, rotar documentos PDF, así como convertir imágenes JPG a formato PDF. El sistema está diseñado siguiendo una arquitectura MVC (Modelo-Vista-Controlador) y utiliza la biblioteca pdf-lib para las operaciones con PDF. La interfaz de usuario es minimalista y fácil de usar.

## Glosario

- **Sistema**: La aplicación web IHATEPDF
- **Usuario**: Persona que utiliza la aplicación para manipular archivos PDF
- **PDF**: Formato de documento portátil (Portable Document Format)
- **pdf-lib**: Biblioteca JavaScript para crear y modificar documentos PDF
- **Combinar**: Unir múltiples archivos PDF en un solo documento
- **Dividir**: Separar un archivo PDF en múltiples documentos
- **Comprimir**: Reducir el tamaño de archivo de un PDF
- **Rotar**: Cambiar la orientación de las páginas de un PDF
- **Conversión JPG a PDF**: Transformar imágenes en formato JPG a documentos PDF
- **Arquitectura MVC**: Patrón de diseño que separa Modelo (datos), Vista (interfaz) y Controlador (lógica)

## Requisitos

### Requisito 1

**Historia de Usuario:** Como usuario, quiero combinar múltiples archivos PDF en uno solo, para poder consolidar documentos relacionados en un único archivo.

#### Criterios de Aceptación

1. WHEN el Usuario selecciona dos o más archivos PDF, THEN el Sistema SHALL permitir la carga de todos los archivos seleccionados
2. WHEN el Usuario confirma la operación de combinar, THEN el Sistema SHALL generar un nuevo PDF que contenga todas las páginas de los archivos originales en el orden especificado
3. WHEN el proceso de combinación finaliza, THEN el Sistema SHALL proporcionar el archivo resultante para descarga
4. WHEN el Usuario reordena los archivos antes de combinar, THEN el Sistema SHALL reflejar el nuevo orden en el documento final
5. WHEN el Usuario intenta combinar sin seleccionar archivos, THEN el Sistema SHALL mostrar un mensaje de error y prevenir la operación

### Requisito 2

**Historia de Usuario:** Como usuario, quiero dividir un archivo PDF en múltiples documentos, para poder extraer secciones específicas o páginas individuales.

#### Criterios de Aceptación

1. WHEN el Usuario carga un archivo PDF, THEN el Sistema SHALL mostrar el número total de páginas del documento
2. WHEN el Usuario especifica rangos de páginas para dividir, THEN el Sistema SHALL validar que los rangos sean válidos y estén dentro del documento
3. WHEN el Usuario confirma la división, THEN el Sistema SHALL generar archivos PDF separados según los rangos especificados
4. WHEN la división se completa, THEN el Sistema SHALL proporcionar todos los archivos resultantes para descarga
5. WHEN el Usuario especifica rangos inválidos o superpuestos, THEN el Sistema SHALL mostrar un mensaje de error descriptivo

### Requisito 3

**Historia de Usuario:** Como usuario, quiero comprimir archivos PDF, para reducir su tamaño y facilitar su almacenamiento o envío.

#### Criterios de Aceptación

1. WHEN el Usuario carga un archivo PDF para comprimir, THEN el Sistema SHALL mostrar el tamaño original del archivo
2. WHEN el Usuario inicia la compresión, THEN el Sistema SHALL reducir el tamaño del archivo manteniendo la legibilidad del contenido
3. WHEN la compresión finaliza, THEN el Sistema SHALL mostrar el tamaño del archivo comprimido y el porcentaje de reducción
4. WHEN el archivo comprimido está listo, THEN el Sistema SHALL proporcionar el archivo para descarga
5. WHEN el archivo no puede ser comprimido significativamente, THEN el Sistema SHALL informar al Usuario que la compresión tiene un efecto mínimo

### Requisito 4

**Historia de Usuario:** Como usuario, quiero rotar las páginas de un PDF, para corregir la orientación de documentos escaneados o mal orientados.

#### Criterios de Aceptación

1. WHEN el Usuario carga un archivo PDF, THEN el Sistema SHALL permitir seleccionar páginas específicas o todas las páginas para rotar
2. WHEN el Usuario selecciona el ángulo de rotación, THEN el Sistema SHALL ofrecer opciones de 90, 180 y 270 grados
3. WHEN el Usuario confirma la rotación, THEN el Sistema SHALL aplicar la rotación a las páginas seleccionadas
4. WHEN la rotación se completa, THEN el Sistema SHALL proporcionar el archivo modificado para descarga
5. WHEN el Usuario no selecciona páginas para rotar, THEN el Sistema SHALL mostrar un mensaje de error

### Requisito 5

**Historia de Usuario:** Como usuario, quiero convertir imágenes JPG a formato PDF, para poder integrar imágenes en documentos PDF o crear PDFs a partir de fotos.

#### Criterios de Aceptación

1. WHEN el Usuario selecciona uno o más archivos JPG, THEN el Sistema SHALL validar que los archivos sean imágenes JPG válidas
2. WHEN el Usuario confirma la conversión, THEN el Sistema SHALL crear un documento PDF con cada imagen en una página separada
3. WHEN la conversión finaliza, THEN el Sistema SHALL proporcionar el archivo PDF resultante para descarga
4. WHEN el Usuario carga múltiples imágenes, THEN el Sistema SHALL mantener el orden de selección en el PDF resultante
5. WHEN el Usuario intenta cargar archivos que no son JPG, THEN el Sistema SHALL rechazar los archivos y mostrar un mensaje de error

### Requisito 6

**Historia de Usuario:** Como usuario, quiero una interfaz minimalista y clara, para poder realizar operaciones sin confusión y con una experiencia visual agradable.

#### Criterios de Aceptación

1. WHEN el Usuario accede a la aplicación, THEN el Sistema SHALL mostrar una interfaz limpia con las operaciones disponibles claramente identificadas
2. WHEN el Usuario navega entre diferentes operaciones, THEN el Sistema SHALL mantener una experiencia visual consistente
3. WHEN el Usuario realiza una operación, THEN el Sistema SHALL proporcionar retroalimentación visual del progreso
4. WHEN una operación se completa o falla, THEN el Sistema SHALL mostrar mensajes claros y concisos
5. WHILE el Usuario interactúa con la interfaz, THE Sistema SHALL responder de manera fluida sin elementos visuales innecesarios

### Requisito 7

**Historia de Usuario:** Como usuario, quiero que el procesamiento de archivos sea seguro, para proteger la privacidad de mis documentos.

#### Criterios de Aceptación

1. WHEN el Usuario carga archivos, THEN el Sistema SHALL procesar los archivos localmente en el navegador sin enviarlos a un servidor
2. WHEN una operación finaliza, THEN el Sistema SHALL eliminar los archivos temporales de la memoria
3. WHEN el Usuario cierra o recarga la página, THEN el Sistema SHALL limpiar todos los datos de archivos cargados
4. THE Sistema SHALL procesar archivos sin almacenar ningún contenido en servidores externos
5. WHEN el Usuario descarga un archivo procesado, THEN el Sistema SHALL eliminar el archivo de la memoria después de la descarga

### Requisito 8

**Historia de Usuario:** Como desarrollador, quiero que la aplicación siga una arquitectura MVC, para mantener el código organizado, mantenible y escalable.

#### Criterios de Aceptación

1. WHEN se implementa funcionalidad de manipulación de PDF, THEN el Sistema SHALL separar la lógica de datos en el Modelo
2. WHEN se implementa la interfaz de usuario, THEN el Sistema SHALL mantener toda la presentación en la Vista
3. WHEN se implementa la lógica de negocio, THEN el Sistema SHALL colocar el control de flujo en el Controlador
4. THE Sistema SHALL mantener separación clara entre Modelo, Vista y Controlador en toda la base de código
5. WHEN se modifica un componente, THEN el Sistema SHALL permitir cambios sin afectar los otros componentes de la arquitectura MVC

### Requisito 9

**Historia de Usuario:** Como usuario, quiero recibir retroalimentación sobre el estado de las operaciones, para saber cuándo mis archivos están siendo procesados y cuándo están listos.

#### Criterios de Aceptación

1. WHEN el Usuario inicia una operación, THEN el Sistema SHALL mostrar un indicador de progreso
2. WHILE una operación está en proceso, THE Sistema SHALL deshabilitar controles que puedan interferir con la operación actual
3. WHEN una operación se completa exitosamente, THEN el Sistema SHALL mostrar una notificación de éxito
4. WHEN una operación falla, THEN el Sistema SHALL mostrar un mensaje de error descriptivo con información sobre la causa
5. WHEN el Sistema procesa archivos grandes, THEN el Sistema SHALL proporcionar indicadores de progreso detallados

### Requisito 10

**Historia de Usuario:** Como usuario, quiero poder previsualizar los archivos antes de procesarlos, para verificar que he seleccionado los archivos correctos.

#### Criterios de Aceptación

1. WHEN el Usuario carga un archivo PDF, THEN el Sistema SHALL mostrar una miniatura o información básica del archivo
2. WHEN el Usuario carga múltiples archivos, THEN el Sistema SHALL mostrar una lista con todos los archivos cargados
3. WHEN el Usuario desea eliminar un archivo de la selección, THEN el Sistema SHALL permitir remover archivos individuales antes de procesar
4. WHEN el Usuario carga imágenes JPG, THEN el Sistema SHALL mostrar miniaturas de las imágenes
5. THE Sistema SHALL mostrar información relevante como nombre de archivo y tamaño para cada archivo cargado
