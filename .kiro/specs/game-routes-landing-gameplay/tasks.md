# Implementation Plan: Game Routes - Landing and Gameplay

## Overview

This implementation establishes the foundational routing structure for the Angular PWA game application. The approach follows Angular's standalone component architecture, creating two primary routes (landing page and gameplay) with proper navigation, accessibility, and error handling through wildcard redirects.

## Tasks

- [ ] 1. Create route configuration and setup
  - [x] 1.1 Create app.routes.ts with route definitions
    - Define landing page route at root path with title
    - Define gameplay route at '/game' path with title
    - Add wildcard route that redirects to root
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 1.2 Update app.config.ts to use the routes
    - Import and configure routes using provideRouter
    - Ensure router is properly integrated with application config
    - _Requirements: 3.1, 3.2_

- [ ] 2. Implement Landing Page Component
  - [x] 2.1 Create landing-page.component.ts
    - Create standalone component with proper imports
    - Add template with heading and navigation
    - Include routerLink to '/game' for "New Game" link
    - Add component-scoped SCSS for styling
    - Ensure keyboard navigation and accessibility
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3_
  
  - [x] 2.2 Write unit tests for landing page component
    - Test component renders correctly
    - Test "New Game" link is present and navigable
    - Test keyboard navigation works
    - Test accessibility attributes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Implement Gameplay Component
  - [x] 3.1 Create gameplay.component.ts
    - Create standalone component with proper imports
    - Add template with placeholder content
    - Add component-scoped SCSS for styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 3.2 Write unit tests for gameplay component
    - Test component renders correctly
    - Test placeholder content is displayed
    - Test component is accessible via direct URL
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Checkpoint - Verify basic routing works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement route configuration tests
  - [x] 5.1 Write unit tests for route configuration
    - Test landing page route is configured at root
    - Test gameplay route is configured at '/game'
    - Test wildcard route redirects to root
    - Test route titles are set correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 5.2 Write property test for wildcard redirect
    - **Property 1: Wildcard Route Redirect**
    - **Validates: Requirements 3.3**
    - Generate random invalid route paths
    - Verify all navigate to landing page
    - Use fast-check with minimum 100 iterations

- [ ] 6. Integration and final verification
  - [x] 6.1 Update app.component.ts to include router outlet
    - Ensure router-outlet is present in app component template
    - Verify app component is properly configured
    - _Requirements: 3.1, 3.2_
  
  - [x] 6.2 Write integration tests for navigation flow
    - Test navigation from landing page to gameplay
    - Test browser history is maintained
    - Test direct URL navigation works
    - _Requirements: 1.3, 2.4, 3.4_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Components use Angular standalone architecture (no NgModule needed)
- Styling follows patterns established in PWA demo component
- Property test uses fast-check library with 100+ iterations
- All components include accessibility considerations
