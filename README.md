# Angular PWA Application

A Progressive Web Application built with Angular 21, featuring offline support, installability, and optimized caching strategies.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [PWA Features](#pwa-features)
- [Service Worker Configuration](#service-worker-configuration)
- [Icon Management](#icon-management)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js (v18 or higher recommended)
- Yarn package manager (v1.22.22)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

Install project dependencies using Yarn:

```bash
yarn install
```

## Development

### Running the Development Server

Start the development server:

```bash
yarn start
```

The application will be available at `http://localhost:4200/`.

**Important:** The service worker is disabled in development mode to avoid caching issues during development. You'll see a message in the console indicating this.

### Development with Service Worker Testing

To test service worker functionality during development, you need to build and serve the production version:

```bash
# Build the production version
yarn build

# Serve the production build locally (requires a static server)
npx http-server dist/angular-pwa-app/browser -p 8080
```

Then navigate to `http://localhost:8080` to test PWA features.

## Building for Production

Build the application for production deployment:

```bash
yarn build
```

The build artifacts will be stored in the `dist/angular-pwa-app/browser/` directory. The production build includes:

- Optimized and minified code
- Service worker (`ngsw-worker.js`)
- Service worker configuration (`ngsw.json`)
- Web app manifest
- All required assets and icons

### Production Build Features

- Service worker is automatically enabled
- Assets are cached according to strategies defined in `ngsw-config.json`
- Application is installable on supported devices
- Offline functionality is enabled

## Testing

### Running Unit Tests

Execute the test suite using Vitest:

```bash
yarn test
```

### Testing PWA Features Locally

1. Build the production version:
   ```bash
   yarn build
   ```

2. Serve the production build over HTTPS (required for service workers):
   ```bash
   # Option 1: Using http-server with SSL
   npx http-server dist/angular-pwa-app/browser -p 8080 -S -C cert.pem -K key.pem
   
   # Option 2: Using local-web-server
   npx local-web-server --directory dist/angular-pwa-app/browser --https
   
   # Option 3: For localhost testing (HTTP works on localhost)
   npx http-server dist/angular-pwa-app/browser -p 8080
   ```

3. Open Chrome DevTools and navigate to the **Application** tab to inspect:
   - Service Worker status and lifecycle
   - Cache Storage contents
   - Manifest details
   - Offline functionality

### Running Lighthouse Audits

Verify PWA criteria using Lighthouse:

1. Open Chrome DevTools
2. Navigate to the **Lighthouse** tab
3. Select "Progressive Web App" category
4. Click "Generate report"

The application should score well on:
- Installability
- PWA optimized
- Service worker registration
- HTTPS usage
- Responsive design
- Fast and reliable performance

## PWA Features

### Offline Support

The application works offline after the first visit. The service worker caches:

- Application shell (HTML, CSS, JavaScript)
- Static assets (images, fonts)
- API responses (configurable)

### Installability

Users can install the application on their devices:

- **Desktop:** Look for the install icon in the browser address bar
- **Mobile:** Use the "Add to Home Screen" option in the browser menu

### Update Notifications

The PWA service includes automatic update detection. When a new version is available, users are notified and can reload to get the latest version.

### Push Notifications (Optional)

The foundation is in place to add push notifications. Implement the notification logic in the `PwaService`.

## Service Worker Configuration

The service worker is configured in `ngsw-config.json` with two main asset groups:

### App Shell (Prefetch Strategy)

Cached immediately on installation:
- `index.html`
- Application bundles (JS/CSS)
- `manifest.webmanifest`
- `favicon.ico`

```json
{
  "name": "app",
  "installMode": "prefetch",
  "updateMode": "prefetch"
}
```

### Assets (Lazy Strategy)

Cached on first access:
- Images (SVG, PNG, JPG, WebP, etc.)
- Fonts (OTF, TTF, WOFF, WOFF2)
- Other static assets

```json
{
  "name": "assets",
  "installMode": "lazy",
  "updateMode": "prefetch"
}
```

### Customizing Caching Strategies

Edit `ngsw-config.json` to modify caching behavior:

```json
{
  "dataGroups": [
    {
      "name": "api-cache",
      "urls": ["/api/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "strategy": "freshness"
      }
    }
  ]
}
```

Available strategies:
- **performance:** Cache-first, network fallback
- **freshness:** Network-first, cache fallback

## Icon Management

### Current Icon Set

The application includes icons in the following sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

All icons are located in `public/icons/` and configured in `public/manifest.webmanifest`.

### Generating New Icons

#### Option 1: Using PWA Asset Generator

Install and use the PWA Asset Generator:

```bash
# Install globally
npm install -g pwa-asset-generator

# Generate icons from a source image
pwa-asset-generator source-logo.png public/icons \
  --icon-only \
  --manifest public/manifest.webmanifest \
  --type png
```

#### Option 2: Manual Creation

1. Create a high-resolution source image (at least 512x512px)
2. Use an image editor to create the required sizes
3. Save icons to `public/icons/`
4. Update `public/manifest.webmanifest` with the new icon paths

#### Option 3: Online Tools

Use online PWA icon generators:
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- [App Icon Generator](https://www.appicon.co/)

### Icon Best Practices

- Use PNG format for best compatibility
- Include both `maskable` and `any` purpose icons
- Ensure icons have sufficient padding for maskable icons (safe zone)
- Test icons on different devices and platforms
- Use transparent backgrounds for flexibility

## Troubleshooting

### Service Worker Not Registering

**Problem:** Service worker doesn't register or shows errors.

**Solutions:**
1. Ensure you're running the production build:
   ```bash
   yarn build
   npx http-server dist/angular-pwa-app/browser -p 8080
   ```

2. Check that you're accessing via HTTPS or localhost

3. Clear browser cache and service worker:
   - Open DevTools → Application → Service Workers
   - Click "Unregister" for any existing service workers
   - Clear cache storage
   - Reload the page

4. Verify `ngsw-worker.js` is accessible:
   ```
   http://localhost:8080/ngsw-worker.js
   ```

### Application Not Installing

**Problem:** Install prompt doesn't appear.

**Solutions:**
1. Verify manifest is valid:
   - Open DevTools → Application → Manifest
   - Check for errors or warnings

2. Ensure all PWA criteria are met:
   - HTTPS (or localhost)
   - Valid manifest with required fields
   - Service worker registered
   - At least one icon (192x192 or larger)

3. Run Lighthouse audit to identify issues

4. Check browser console for manifest errors

### Caching Issues

**Problem:** Old content is served after deployment.

**Solutions:**
1. Update the service worker by changing `ngsw-config.json`

2. Force update in code:
   ```typescript
   this.swUpdate.checkForUpdate().then(() => {
     window.location.reload();
   });
   ```

3. Clear service worker cache:
   - DevTools → Application → Cache Storage
   - Delete all caches
   - Unregister service worker
   - Reload

### Development Mode Service Worker

**Problem:** Service worker interfering with development.

**Solution:** Service worker is automatically disabled in development mode. If you need to test it:

1. Build production version: `yarn build`
2. Serve locally: `npx http-server dist/angular-pwa-app/browser -p 8080`
3. Test at `http://localhost:8080`

### Icons Not Displaying

**Problem:** App icons don't show in install prompt or home screen.

**Solutions:**
1. Verify icon files exist in `public/icons/`

2. Check manifest configuration:
   ```bash
   # Icons should be accessible at:
   http://localhost:8080/icons/icon-192x192.png
   ```

3. Ensure icon paths in manifest are correct (relative to manifest location)

4. Clear browser cache and reinstall

5. Validate icon sizes match manifest declarations

### Offline Mode Not Working

**Problem:** Application doesn't work offline.

**Solutions:**
1. Verify service worker is active:
   - DevTools → Application → Service Workers
   - Status should be "activated and running"

2. Check cache storage:
   - DevTools → Application → Cache Storage
   - Verify assets are cached

3. Test offline mode:
   - DevTools → Network tab
   - Enable "Offline" checkbox
   - Reload page

4. Review `ngsw-config.json` caching rules

### Update Detection Not Working

**Problem:** Users don't see update notifications.

**Solutions:**
1. Verify `PwaService` is properly injected in `app.config.ts`

2. Check service worker update interval (default: 6 hours)

3. Force check for updates:
   ```typescript
   this.swUpdate.checkForUpdate();
   ```

4. Monitor update events in console

### Build Errors

**Problem:** Production build fails.

**Solutions:**
1. Clear build cache:
   ```bash
   rm -rf .angular/cache
   yarn build
   ```

2. Verify all dependencies are installed:
   ```bash
   yarn install
   ```

3. Check TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

4. Ensure `@angular/service-worker` is installed:
   ```bash
   yarn add @angular/service-worker
   ```

## Additional Resources

- [Angular Service Worker Documentation](https://angular.dev/ecosystem/service-workers)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Lighthouse PWA Audits](https://developer.chrome.com/docs/lighthouse/pwa/)

## Project Structure

```
angular-pwa-app/
├── public/
│   ├── icons/              # PWA icons
│   ├── favicon.ico
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── components/     # UI components
│   │   └── services/       # Application services (including PwaService)
│   ├── environments/       # Environment configurations
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── ngsw-config.json        # Service worker configuration
├── package.json
└── README.md
```

## License

This project is private and not licensed for public use.
