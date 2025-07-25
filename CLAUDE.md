# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NetEase Cloud Music-style web music player project. The repository currently contains only design documentation (`设计.md`) and no actual implementation code yet.

## Project Architecture (Planned)

Based on the design document, this will be a React-based music player with the following planned architecture:

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Zustand or Redux Toolkit
- **Audio**: Web Audio API + HTML5 Audio
- **Icons**: React Icons or Lucide React
- **Animation**: Framer Motion
- **Build Tool**: Vite

### Core Components (Planned)
- **Player Module**: Main audio playback engine with controls
- **Search Module**: Music search and discovery
- **Playlist Module**: Playlist management and organization
- **UI Components**: Reusable interface components

### Music API Integration (Planned)
The project plans to use third-party music APIs as alternatives to official NetEase API:
- QQ Music API
- Kugou Music API
- Migu Music API
- Local music file support

## Development Commands

Since no package.json exists yet, these commands will be available once the project is initialized:

### Initial Setup (When Created)
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Key Design Considerations

### Layout Structure
- Three-column layout: Sidebar + Main Content + Player Controls
- Responsive design for desktop, tablet, and mobile
- Bottom player control bar always visible

### Color Scheme
- Primary: #C62D42 (NetEase red)
- Background: #F5F5F7 (light gray)
- Dark mode: #181818 (dark gray)

### Performance Optimizations (Planned)
- React.lazy() for route-based code splitting
- Virtual scrolling for large music lists
- Audio preloading and caching strategies
- Service Worker for offline support

## Development Phases

### Phase 1 (MVP)
1. Basic project setup with Vite + React + TypeScript
2. Core audio player functionality
3. Basic UI components
4. Single music API integration
5. Essential player interface

### Phase 2 (Feature Expansion)
1. Search functionality
2. Playlist management
3. User favorites system
4. Responsive design implementation
5. Performance optimizations

### Phase 3 (Enhancement)
1. Lyrics display
2. Audio visualization
3. Theme switching
4. Offline caching
5. PWA support

## Important Notes

- This repository currently contains only design documentation
- No actual code implementation exists yet
- The project aims to create a legal music player using authorized third-party APIs
- Focus on modern web standards and responsive design
- Plan for cross-browser compatibility and mobile optimization

## Next Steps for Implementation

1. Initialize Vite + React + TypeScript project structure
2. Set up Tailwind CSS and basic styling
3. Implement core audio player functionality
4. Create basic UI layout components
5. Integrate first music API for testing