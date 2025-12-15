# Requirements Document

## Introduction

Este documento define los requisitos para transformar IHATEPDF en un centro de herramientas multimedia completo. La aplicación pasará de ser exclusivamente una herramienta PDF a ofrecer múltiples categorías de herramientas: PDF, audio, video, imágenes y transcripción. La página principal mostrará un menú con tarjetas que redirigen a cada categoría de herramientas.

## Glossary

- **Centro Multimedia**: Página principal que agrupa todas las herramientas disponibles organizadas por categorías
- **Tarjeta de Herramienta**: Componente visual clickeable que representa una categoría de herramientas y redirige a su página específica
- **Grabador de Audio**: Herramienta que permite capturar audio desde el micrófono del dispositivo
- **Grabador de Pantalla**: Herramienta que permite capturar video de la pantalla del usuario
- **Extractor de Media**: Herramienta que permite extraer pistas de audio o video de archivos multimedia
- **Convertidor de Imágenes**: Herramienta que transforma imágenes entre diferentes formatos (PNG, JPG, WebP, etc.)
- **Removedor de Fondo**: Herramienta que elimina el fondo de imágenes dejando solo el sujeto principal
- **Transcriptor de Audio**: Herramienta que convierte audio a texto usando reconocimiento de voz
- **MediaRecorder API**: API del navegador para grabar audio y video
- **Web Audio API**: API del navegador para procesamiento de audio
- **Canvas API**: API del navegador para manipulación de imágenes
- **Web Speech API**: API del navegador para reconocimiento de voz

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a main page with tool categories displayed as cards, so that I can easily navigate to the specific tool I need.

#### Acceptance Criteria

1. WHEN a user visits the main page THEN the System SHALL display a grid of category cards including: PDF Tools, Audio Recording, Screen Recording, Media Extraction, Image Conversion, Background Removal, and Audio Transcription
2. WHEN a user clicks on the PDF Tools card THEN the System SHALL redirect to the existing IHATEPDF interface
3. WHEN a user clicks on any other category card THEN the System SHALL navigate to that category's dedicated tool page
4. WHEN the page loads THEN the System SHALL display each card with an icon, title, and brief description of the category

### Requirement 2

**User Story:** As a user, I want to record audio from my microphone, so that I can create audio files directly in the browser.

#### Acceptance Criteria

1. WHEN a user accesses the audio recording tool THEN the System SHALL request microphone permission from the browser
2. WHEN the user grants microphone permission and clicks the record button THEN the System SHALL start capturing audio from the microphone
3. WHILE recording is active THEN the System SHALL display a visual indicator showing recording status and elapsed time
4. WHEN the user clicks the stop button THEN the System SHALL stop recording and generate a downloadable audio file
5. WHEN recording completes THEN the System SHALL provide the audio file in WebM or MP3 format for download
6. IF microphone permission is denied THEN the System SHALL display a clear error message explaining the permission requirement

### Requirement 3

**User Story:** As a user, I want to record my screen, so that I can create screen captures and tutorials.

#### Acceptance Criteria

1. WHEN a user accesses the screen recording tool THEN the System SHALL request screen sharing permission from the browser
2. WHEN the user grants permission and selects a screen/window THEN the System SHALL start capturing the selected display
3. WHILE screen recording is active THEN the System SHALL display recording status and elapsed time
4. WHEN the user clicks the stop button THEN the System SHALL stop recording and generate a downloadable video file
5. WHEN recording completes THEN the System SHALL provide the video file in WebM format for download
6. IF screen sharing permission is denied THEN the System SHALL display a clear error message explaining the permission requirement
7. WHERE the user enables audio option THEN the System SHALL capture system audio along with the screen recording

### Requirement 4

**User Story:** As a user, I want to extract audio or video tracks from multimedia files, so that I can separate and use individual media components.

#### Acceptance Criteria

1. WHEN a user uploads a video file THEN the System SHALL analyze the file and display available tracks (audio and video)
2. WHEN the user selects to extract audio THEN the System SHALL process the video and generate a separate audio file
3. WHEN the user selects to extract video without audio THEN the System SHALL process the file and generate a video-only file
4. WHEN extraction completes THEN the System SHALL provide the extracted file for download
5. IF the uploaded file format is not supported THEN the System SHALL display an error message listing supported formats

### Requirement 5

**User Story:** As a user, I want to convert images between different formats, so that I can use images in the format I need.

#### Acceptance Criteria

1. WHEN a user uploads an image file THEN the System SHALL display the image preview and available output formats
2. WHEN the user selects a target format (PNG, JPG, WebP, GIF) THEN the System SHALL convert the image to the selected format
3. WHEN conversion completes THEN the System SHALL provide the converted image for download
4. WHEN converting to JPG format THEN the System SHALL allow the user to specify quality level (1-100)
5. IF the uploaded file is not a valid image THEN the System SHALL display an error message indicating invalid file type

### Requirement 6

**User Story:** As a user, I want to remove the background from images, so that I can isolate subjects for use in other projects.

#### Acceptance Criteria

1. WHEN a user uploads an image THEN the System SHALL display the original image preview
2. WHEN the user clicks the remove background button THEN the System SHALL process the image to detect and remove the background
3. WHEN background removal completes THEN the System SHALL display a preview of the result with transparent background
4. WHEN the user confirms the result THEN the System SHALL provide the processed image as PNG with transparency for download
5. WHILE background removal is processing THEN the System SHALL display a progress indicator
6. IF background removal fails THEN the System SHALL display an error message and allow the user to try again

### Requirement 7

**User Story:** As a user, I want to transcribe audio to text, so that I can get written versions of spoken content.

#### Acceptance Criteria

1. WHEN a user accesses the transcription tool THEN the System SHALL display options for live transcription or file upload
2. WHEN the user selects live transcription and grants microphone permission THEN the System SHALL start real-time speech-to-text conversion
3. WHEN the user uploads an audio file THEN the System SHALL process the file and generate text transcription
4. WHILE transcription is in progress THEN the System SHALL display the transcribed text in real-time or show processing status
5. WHEN transcription completes THEN the System SHALL allow the user to copy or download the text
6. WHEN performing transcription THEN the System SHALL use the browser's Web Speech API for speech recognition
7. IF the browser does not support speech recognition THEN the System SHALL display a message indicating browser incompatibility

### Requirement 8

**User Story:** As a user, I want all tools to process files locally in my browser, so that my data remains private and secure.

#### Acceptance Criteria

1. WHEN any file is processed THEN the System SHALL perform all operations client-side without uploading data to external servers
2. WHEN a tool completes processing THEN the System SHALL generate downloadable files directly in the browser
3. WHEN the user leaves the page THEN the System SHALL not retain any uploaded or processed files
