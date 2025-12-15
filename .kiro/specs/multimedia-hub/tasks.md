# Implementation Plan

## Phase 1: Core Infrastructure

- [x] 1. Set up routing and navigation system
  - [x] 1.1 Create Router class in `js/router/Router.js`
    - Implement route registration, navigation, and history management
    - Handle hash-based routing for SPA navigation
    - _Requirements: 1.2, 1.3_
  - [ ]* 1.2 Write property test for card navigation
    - **Property 1: Card navigation consistency**
    - **Validates: Requirements 1.3**
  - [x] 1.3 Create shared services structure
    - Create `js/services/PermissionService.js` for browser permission handling
    - Create `js/services/DownloadService.js` for file downloads
    - _Requirements: 8.1, 8.2_

- [x] 2. Create Hub Page with category cards
  - [x] 2.1 Create HubPage component in `js/views/HubPage.js`
    - Implement card grid layout with all 7 categories
    - Add click handlers for navigation
    - _Requirements: 1.1, 1.4_
  - [ ]* 2.2 Write property test for card content
    - **Property 2: Card content completeness**
    - **Validates: Requirements 1.4**
  - [x] 2.3 Update `index.html` to support hub layout
    - Add hub container and card grid structure
    - Add CSS for card styling
    - _Requirements: 1.1_
  - [x] 2.4 Integrate PDF tools redirect
    - Configure PDF card to load existing IHATEPDF interface
    - _Requirements: 1.2_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Audio Recording Tool

- [x] 4. Implement Audio Recorder
  - [x] 4.1 Create AudioRecorderController in `js/controllers/AudioRecorderController.js`
    - Implement microphone permission request
    - Implement start/stop recording with MediaRecorder API
    - Track elapsed time during recording
    - Generate downloadable audio file (WebM format)
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [ ]* 4.2 Write property test for recording status
    - **Property 3: Recording status display consistency**
    - **Validates: Requirements 2.3, 3.3**
  - [ ]* 4.3 Write property test for audio output format
    - **Property 4: Media output format validity**
    - **Validates: Requirements 2.5, 3.5**
  - [x] 4.4 Create AudioRecorderView in `js/views/AudioRecorderView.js`
    - Create UI with record/stop buttons
    - Display recording status and elapsed time
    - Handle permission denied error display
    - _Requirements: 2.3, 2.6_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Screen Recording Tool

- [x] 6. Implement Screen Recorder
  - [x] 6.1 Create ScreenRecorderController in `js/controllers/ScreenRecorderController.js`
    - Implement screen sharing permission request
    - Support optional system audio capture
    - Implement start/stop recording
    - Generate downloadable video file (WebM format)
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.7_
  - [x] 6.2 Create ScreenRecorderView in `js/views/ScreenRecorderView.js`
    - Create UI with screen selection and audio toggle
    - Display recording status and elapsed time
    - Handle permission denied error display
    - _Requirements: 3.3, 3.6_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Media Extraction Tool

- [x] 8. Implement Media Extractor
  - [x] 8.1 Set up FFmpeg.wasm integration
    - Add FFmpeg.wasm dependency
    - Create lazy loading mechanism for FFmpeg
    - _Requirements: 4.1_
  - [x] 8.2 Create MediaExtractorController in `js/controllers/MediaExtractorController.js`
    - Implement file analysis to detect tracks
    - Implement audio extraction from video
    - Implement video-only extraction (remove audio)
    - Handle unsupported format errors
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [ ]* 8.3 Write property test for track detection
    - **Property 5: Video track detection accuracy**
    - **Validates: Requirements 4.1**
  - [ ]* 8.4 Write property test for extraction output
    - **Property 6: Extraction output availability**
    - **Validates: Requirements 4.4**
  - [x] 8.5 Create MediaExtractorView in `js/views/MediaExtractorView.js`
    - Create UI for file upload and track display
    - Add extraction options (audio/video)
    - Display progress during extraction
    - _Requirements: 4.1, 4.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Image Conversion Tool

- [ ] 10. Implement Image Converter
  - [ ] 10.1 Create ImageConverterController in `js/controllers/ImageConverterController.js`
    - Implement image loading and validation
    - Implement conversion to PNG, JPG, WebP, GIF using Canvas API
    - Support quality setting for JPG format
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  - [ ]* 10.2 Write property test for image conversion
    - **Property 7: Image format conversion validity**
    - **Validates: Requirements 5.2**
  - [ ] 10.3 Create ImageConverterView in `js/views/ImageConverterView.js`
    - Create UI for image upload and preview
    - Add format selection dropdown
    - Add quality slider for JPG
    - Display download button after conversion
    - _Requirements: 5.1, 5.3, 5.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Background Removal Tool

- [ ] 12. Implement Background Remover
  - [ ] 12.1 Create BackgroundRemoverController in `js/controllers/BackgroundRemoverController.js`
    - Implement image loading
    - Implement background removal algorithm (using canvas manipulation or ML model)
    - Generate PNG output with alpha channel
    - _Requirements: 6.1, 6.2, 6.4_
  - [ ]* 12.2 Write property test for transparency preservation
    - **Property 8: Background removal transparency preservation**
    - **Validates: Requirements 6.4**
  - [ ]* 12.3 Write property test for progress indicator
    - **Property 9: Processing progress indicator visibility**
    - **Validates: Requirements 6.5**
  - [ ] 12.4 Create BackgroundRemoverView in `js/views/BackgroundRemoverView.js`
    - Create UI for image upload
    - Display original and processed image previews
    - Show progress indicator during processing
    - Add download button for result
    - _Requirements: 6.1, 6.3, 6.5, 6.6_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Audio Transcription Tool

- [ ] 14. Implement Audio Transcriber
  - [ ] 14.1 Create AudioTranscriberController in `js/controllers/AudioTranscriberController.js`
    - Check browser support for Web Speech API
    - Implement live transcription from microphone
    - Implement file-based transcription (play audio and capture)
    - Provide copy and download functionality for transcript
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7_
  - [ ]* 14.2 Write property test for transcription output
    - **Property 10: Transcription output availability**
    - **Validates: Requirements 7.5**
  - [ ] 14.3 Create AudioTranscriberView in `js/views/AudioTranscriberView.js`
    - Create UI with live/file transcription options
    - Display real-time transcript text
    - Add copy and download buttons
    - Show browser compatibility warning if needed
    - _Requirements: 7.1, 7.4, 7.5, 7.7_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Final Integration

- [ ] 16. Client-side processing verification
  - [ ]* 16.1 Write property test for client-side guarantee
    - **Property 11: Client-side processing guarantee**
    - **Validates: Requirements 8.1, 8.2**
  - [ ] 16.2 Update app.js to integrate all tools with router
    - Wire up all controllers with router
    - Ensure proper cleanup when navigating between tools
    - _Requirements: 8.3_

- [ ] 17. Update styles and responsive design
  - [ ] 17.1 Add CSS for hub page and cards
    - Style card grid for desktop and mobile
    - Add hover effects and transitions
    - _Requirements: 1.1, 1.4_
  - [ ] 17.2 Add CSS for each tool page
    - Consistent styling across all tools
    - Responsive layouts for all screen sizes
    - _Requirements: All_

- [ ] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
