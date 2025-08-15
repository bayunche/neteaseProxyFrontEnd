# Universal Music Player - Deployment Guide

## 📋 Overview

This comprehensive deployment guide covers all aspects of deploying the Universal Music Player across multiple platforms including web (PWA), mobile (React Native), and potential desktop applications.

## 🏗 Architecture Overview

```
Universal Music Player
├── packages/
│   ├── shared/           # Shared components and utilities
│   ├── web/             # React web application (PWA)
│   └── mobile/          # React Native application
├── app-store/           # App store assets and metadata
├── docs/               # Documentation
└── deployment/         # Deployment configurations
```

### Technology Stack

**Frontend Framework**
- React 19 with TypeScript 5.8+
- React Native with Expo 51
- Zustand for state management
- Tailwind CSS + CSS Modules for styling

**Build Tools**
- Vite for web bundling
- Expo CLI for mobile builds
- ESBuild for fast compilation
- PostCSS for CSS processing

**Backend Integration**
- NetEase Music API integration
- RESTful API architecture
- WebSocket for real-time features
- Service Worker for offline functionality

## 🌐 Web Deployment (PWA)

### Prerequisites

```bash
# Node.js 18+ required
node --version  # v18.0.0+
npm --version   # 9.0.0+

# Install dependencies
npm install
```

### Build Configuration

**Environment Variables**
```bash
# .env.production
NODE_ENV=production
VITE_API_BASE_URL=https://api.universalmusicplayer.com
VITE_CDN_URL=https://cdn.universalmusicplayer.com
VITE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
```

**Build Commands**
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Build with analysis
npm run build:analyze
```

### Hosting Options

#### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**vercel.json**
```json
{
  "name": "universal-music-player",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "npm run build",
        "outputDirectory": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**netlify.toml**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Option 3: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize and deploy
firebase login
firebase init hosting
firebase deploy
```

### Performance Optimization

**Bundle Analysis**
```bash
# Analyze bundle size
npm run build:analyze

# Check for unused dependencies
npm run deps:check

# Lighthouse audit
npm run audit:lighthouse
```

**Optimization Checklist**
- [ ] Code splitting implemented
- [ ] Tree shaking configured
- [ ] Assets compressed (Brotli/Gzip)
- [ ] Images optimized (WebP, AVIF)
- [ ] Fonts preloaded
- [ ] Critical CSS inlined
- [ ] Service Worker caching strategy optimized

## 📱 Mobile Deployment (React Native)

### Prerequisites

```bash
# Expo CLI
npm install -g @expo/cli

# EAS CLI for builds
npm install -g @expo/eas-cli

# Login to Expo
expo login
```

### Development Setup

```bash
# Start development server
npm run mobile:start

# Run on iOS simulator
npm run mobile:ios

# Run on Android emulator
npm run mobile:android
```

### Production Builds

#### iOS Build (App Store)

```bash
# Configure EAS
eas build:configure

# Create iOS build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**eas.json Configuration**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.universalmusicplayer.app"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "production"
      }
    }
  }
}
```

#### Android Build (Google Play)

```bash
# Create Android build
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

### Code Signing

**iOS Code Signing**
- Apple Developer Account required ($99/year)
- Distribution certificate
- Provisioning profile
- App Store Connect configuration

**Android Code Signing**
- Google Play Console account ($25 one-time)
- Upload keystore generated by Google Play
- App signing by Google Play enabled

## 🔧 CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml**
```yaml
name: Deploy Universal Music Player

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  build-web:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web app
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_ANALYTICS_ID: ${{ secrets.ANALYTICS_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  build-mobile:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS app
        run: eas build --platform ios --profile production --non-interactive
      
      - name: Build Android app
        run: eas build --platform android --profile production --non-interactive
```

## 🗄 Database and Backend

### Backend Services Setup

**API Server Deployment**
```bash
# If using separate Node.js API
cd api/
npm install
npm run build
npm start
```

**Database Configuration**
```bash
# MongoDB setup (if using)
# Set environment variables
MONGODB_URI=mongodb://localhost:27017/musicplayer
REDIS_URL=redis://localhost:6379

# PostgreSQL setup (alternative)
DATABASE_URL=postgresql://user:password@localhost:5432/musicplayer
```

### Environment Variables

**Production Environment**
```bash
# API Configuration
API_BASE_URL=https://api.universalmusicplayer.com
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379

# Third-party Services
NETEASE_API_KEY=your_netease_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key

# CDN and Storage
CDN_URL=https://cdn.universalmusicplayer.com
AWS_S3_BUCKET=your-s3-bucket
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Analytics and Monitoring
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
SENTRY_DSN=your_sentry_dsn
```

## 📊 Monitoring and Analytics

### Performance Monitoring

**Web Vitals Tracking**
```javascript
// webVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

**Error Tracking**
```bash
# Install Sentry
npm install @sentry/react @sentry/tracing

# Initialize in app
Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [
    new BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

### Analytics Setup

**Google Analytics 4**
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔒 Security Configuration

### SSL/TLS Setup

**Let's Encrypt (Free SSL)**
```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot --nginx -d universalmusicplayer.com
```

**Security Headers**
```nginx
# nginx.conf
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;";
```

### API Security

**Rate Limiting**
```javascript
// Express rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🧪 Testing Strategy

### Automated Testing

**Unit Tests**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**E2E Testing**
```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npm run test:e2e

# Run tests in different browsers
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:safari
```

### Manual Testing Checklist

**Pre-deployment Testing**
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness (iOS Safari, Chrome Mobile)
- [ ] PWA installation flow
- [ ] Offline functionality
- [ ] Performance benchmarks
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Security vulnerability scanning

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Analytics and monitoring configured
- [ ] Error tracking setup
- [ ] Backup strategy implemented
- [ ] SSL certificates configured
- [ ] CDN setup and tested
- [ ] Domain and DNS configured

### Launch Day
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Monitor user feedback
- [ ] Prepare rollback plan if needed

### Post-Launch
- [ ] Monitor analytics and user behavior
- [ ] Track performance metrics
- [ ] Respond to user feedback
- [ ] Plan next iteration improvements
- [ ] Document lessons learned

## 📞 Support and Maintenance

### Monitoring Alerts

**Key Metrics to Monitor**
- Error rate < 0.1%
- Response time < 200ms (p95)
- Uptime > 99.9%
- Mobile crash rate < 0.5%

**Alert Channels**
- Slack notifications for critical issues
- Email alerts for performance degradation
- SMS for service outages

### Update Strategy

**Regular Updates**
- Security patches: Weekly
- Bug fixes: Bi-weekly
- Feature releases: Monthly
- Major versions: Quarterly

**Emergency Hotfixes**
- Critical security issues: Same day
- Major functionality breaking: Within 24 hours
- Performance degradation: Within 48 hours

## 🔗 Resources and Documentation

### External Resources
- [React Documentation](https://react.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Internal Documentation
- [API Documentation](./api.md)
- [Component Library](./components.md)
- [Architecture Guide](./architecture.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Security Guidelines](./security.md)