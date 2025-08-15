# Contributing to Universal Music Player

Thank you for your interest in contributing to Universal Music Player! This document provides comprehensive guidelines for contributing to our project.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community Guidelines](#community-guidelines)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** 2.30.0 or higher
- **Visual Studio Code** (recommended) with recommended extensions

### First Time Setup

1. **Fork the repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/universal-music-player.git
   cd universal-music-player
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/universalmusicplayer/universal-music-player.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development servers**
   ```bash
   # Start both web and mobile dev servers
   npm run dev
   
   # Or start individually
   npm run web:dev      # Web development server
   npm run mobile:dev   # Mobile development server
   npm run proxy        # API proxy server
   ```

## 🏗 Development Setup

### IDE Configuration

**VS Code Extensions (Recommended):**
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

**VS Code Settings:**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_NETEASE_API_PROXY=http://localhost:3000

# Development Settings
NODE_ENV=development
VITE_DEV_MODE=true
VITE_ENABLE_DEVTOOLS=true

# Analytics (optional for development)
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_SOCIAL_FEATURES=true
VITE_ENABLE_PWA_FEATURES=true
```

## 📁 Project Structure

```
universal-music-player/
├── packages/
│   ├── shared/                 # Shared components and utilities
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # Business logic services
│   │   │   ├── stores/         # Zustand state management
│   │   │   ├── types/          # TypeScript type definitions
│   │   │   └── utils/          # Utility functions
│   │   └── package.json
│   ├── web/                    # React web application
│   │   ├── src/
│   │   │   ├── components/     # Web-specific components
│   │   │   ├── pages/          # Route components
│   │   │   ├── hooks/          # Web-specific hooks
│   │   │   └── styles/         # CSS and styling
│   │   └── package.json
│   └── mobile/                 # React Native application
│       ├── src/
│       │   ├── components/     # Mobile-specific components
│       │   ├── screens/        # Screen components
│       │   └── navigation/     # Navigation setup
│       └── package.json
├── docs/                       # Documentation
├── scripts/                    # Build and utility scripts
├── .github/                    # GitHub workflows and templates
└── app-store/                  # App store assets
```

### File Naming Conventions

- **Components**: `PascalCase` (e.g., `MusicPlayer.tsx`)
- **Hooks**: `camelCase` starting with `use` (e.g., `usePlayer.ts`)
- **Utilities**: `camelCase` (e.g., `formatDuration.ts`)
- **Types**: `PascalCase` with descriptive names (e.g., `UserPreferences.ts`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `API_ENDPOINTS.ts`)

## 🔄 Development Workflow

### Branch Naming Convention

```bash
feature/add-playlist-sharing     # New features
fix/player-volume-bug           # Bug fixes
improvement/optimize-loading    # Performance improvements
docs/update-contributing       # Documentation updates
chore/update-dependencies      # Maintenance tasks
```

### Typical Development Flow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following our [coding standards](#coding-standards)
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run test           # Run all tests
   npm run test:watch     # Run tests in watch mode
   npm run lint           # Check code style
   npm run type-check     # TypeScript type checking
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add playlist sharing functionality"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR on GitHub
   ```

## 🎨 Coding Standards

### TypeScript Guidelines

**Interface vs Type**
```typescript
// Use interfaces for object shapes that might be extended
interface User {
  id: string;
  name: string;
  email: string;
}

interface PremiumUser extends User {
  subscriptionType: 'monthly' | 'yearly';
}

// Use types for unions, computed types, or when you need specific TS features
type Theme = 'light' | 'dark' | 'system';
type UserWithTheme = User & { theme: Theme };
```

**Strict Typing**
```typescript
// ✅ Good - Explicit types
const handlePlaySong = (song: Song, autoplay: boolean = false): void => {
  // Implementation
};

// ❌ Avoid - Any types
const handlePlaySong = (song: any, autoplay?: any) => {
  // Implementation
};

// ✅ Good - Proper error handling
type ApiResponse<T> = {
  data: T;
  error?: never;
} | {
  data?: never;
  error: string;
};
```

### React Component Guidelines

**Component Structure**
```typescript
// ✅ Good component structure
interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onPause: () => void;
  className?: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentSong,
  isPlaying,
  onPlay,
  onPause,
  className
}) => {
  // Hooks at the top
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Event handlers
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);
  
  // Effects
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.streamUrl;
    }
  }, [currentSong]);
  
  // Early returns
  if (!currentSong) {
    return <EmptyState message="No song selected" />;
  }
  
  // Render
  return (
    <div className={cn('music-player', className)}>
      {/* Component JSX */}
    </div>
  );
};
```

**Custom Hooks**
```typescript
// ✅ Good custom hook
export function usePlayer() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const play = useCallback((song?: Song) => {
    if (song && song.id !== currentSong?.id) {
      setCurrentSong(song);
    }
    setIsPlaying(true);
  }, [currentSong]);
  
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  return {
    currentSong,
    isPlaying,
    play,
    pause,
    audioRef
  };
}
```

### State Management (Zustand)

**Store Structure**
```typescript
// ✅ Good store structure
interface PlayerState {
  // State
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  volume: number;
  
  // Actions
  play: (song: Song) => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  addToQueue: (songs: Song[]) => void;
  
  // Computed values (selectors)
  hasNext: () => boolean;
  hasPrevious: () => boolean;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  currentSong: null,
  queue: [],
  isPlaying: false,
  volume: 1,
  
  // Actions
  play: (song) => set((state) => ({
    currentSong: song,
    isPlaying: true,
    queue: state.queue.includes(song) ? state.queue : [...state.queue, song]
  })),
  
  pause: () => set({ isPlaying: false }),
  
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  
  addToQueue: (songs) => set((state) => ({
    queue: [...state.queue, ...songs.filter(s => !state.queue.find(q => q.id === s.id))]
  })),
  
  // Computed values
  hasNext: () => {
    const { currentSong, queue } = get();
    if (!currentSong) return false;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    return currentIndex >= 0 && currentIndex < queue.length - 1;
  },
  
  hasPrevious: () => {
    const { currentSong, queue } = get();
    if (!currentSong) return false;
    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    return currentIndex > 0;
  }
}));
```

### Styling Guidelines

**Tailwind CSS Usage**
```typescript
// ✅ Good - Semantic class combinations
const buttonVariants = {
  primary: 'bg-red-500 hover:bg-red-600 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  outline: 'border border-gray-300 hover:border-gray-400 bg-transparent'
};

// ✅ Good - Using cn utility for conditional classes
const Button = ({ variant, disabled, className, ...props }) => (
  <button
    className={cn(
      'px-4 py-2 rounded-md font-medium transition-colors',
      buttonVariants[variant],
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
    disabled={disabled}
    {...props}
  />
);

// ✅ Good - Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**CSS Modules (when needed)**
```css
/* MusicPlayer.module.css */
.container {
  @apply relative flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg;
}

.glassEffect {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1);
}

.visualizer {
  /* Complex animations that are hard to do with Tailwind */
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## 🧪 Testing Guidelines

### Test Structure

**Unit Tests**
```typescript
// ✅ Good test structure
describe('usePlayer hook', () => {
  beforeEach(() => {
    // Setup
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  describe('when playing a song', () => {
    it('should update current song and set isPlaying to true', () => {
      const { result } = renderHook(() => usePlayer());
      const testSong = createMockSong();
      
      act(() => {
        result.current.play(testSong);
      });
      
      expect(result.current.currentSong).toBe(testSong);
      expect(result.current.isPlaying).toBe(true);
    });
    
    it('should add song to queue if not already present', () => {
      const { result } = renderHook(() => usePlayer());
      const testSong = createMockSong();
      
      act(() => {
        result.current.play(testSong);
      });
      
      expect(result.current.queue).toContain(testSong);
    });
  });
  
  describe('when pausing', () => {
    it('should set isPlaying to false without changing current song', () => {
      const { result } = renderHook(() => usePlayer());
      const testSong = createMockSong();
      
      act(() => {
        result.current.play(testSong);
        result.current.pause();
      });
      
      expect(result.current.currentSong).toBe(testSong);
      expect(result.current.isPlaying).toBe(false);
    });
  });
});
```

**Component Tests**
```typescript
// ✅ Good component test
describe('MusicPlayer Component', () => {
  const defaultProps = {
    currentSong: createMockSong(),
    isPlaying: false,
    onPlay: jest.fn(),
    onPause: jest.fn()
  };
  
  it('should render song information', () => {
    render(<MusicPlayer {...defaultProps} />);
    
    expect(screen.getByText(defaultProps.currentSong.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.currentSong.artist)).toBeInTheDocument();
  });
  
  it('should call onPlay when play button is clicked', () => {
    const onPlay = jest.fn();
    render(<MusicPlayer {...defaultProps} onPlay={onPlay} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    expect(onPlay).toHaveBeenCalledWith(defaultProps.currentSong);
  });
  
  it('should show pause button when playing', () => {
    render(<MusicPlayer {...defaultProps} isPlaying={true} />);
    
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument();
  });
});
```

**Integration Tests**
```typescript
// ✅ Good integration test
describe('Music Search Integration', () => {
  beforeEach(() => {
    setupMockAPI();
  });
  
  it('should search for songs and display results', async () => {
    const mockSongs = [createMockSong(), createMockSong()];
    mockAPI.get('/api/music/search').reply(200, { data: { songs: mockSongs } });
    
    render(<SearchPage />);
    
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.submit(searchInput);
    
    await waitFor(() => {
      mockSongs.forEach(song => {
        expect(screen.getByText(song.title)).toBeInTheDocument();
      });
    });
  });
});
```

### Test Utilities

Create helper functions for common test scenarios:

```typescript
// test-utils.tsx
export function createMockSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-123',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 240,
    streamUrl: 'https://example.com/song.mp3',
    coverUrl: 'https://example.com/cover.jpg',
    ...overrides
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    premium: false,
    ...overrides
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: {
    initialState?: Partial<AppState>;
    route?: string;
  } = {}
) {
  const { initialState = {}, route = '/' } = options;
  
  return render(
    <BrowserRouter initialEntries={[route]}>
      <QueryClient client={createTestQueryClient()}>
        <ThemeProvider>
          <TestStateProvider initialState={initialState}>
            {ui}
          </TestStateProvider>
        </ThemeProvider>
      </QueryClient>
    </BrowserRouter>
  );
}
```

## 📝 Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples
```bash
feat(player): add volume control with keyboard shortcuts

feat: add playlist sharing functionality
fix: resolve memory leak in audio visualizer
docs: update API documentation for search endpoint
style: fix linting issues in MusicPlayer component
refactor: extract playlist logic into custom hook
perf: optimize search results rendering
test: add unit tests for usePlayer hook
chore: update dependencies to latest versions
```

### Commit Body Guidelines
```bash
feat(player): add volume control with keyboard shortcuts

Add keyboard shortcuts for volume control:
- Arrow up/down for volume adjustment
- M key for mute toggle
- Volume persists in localStorage

Closes #123
```

## 🔄 Pull Request Process

### Before Creating a PR

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   npm run build
   ```

3. **Update documentation** if needed

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)
- [ ] Mobile testing (if applicable)

## Screenshots/Videos
Include screenshots or videos demonstrating the changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one approved review from a maintainer
3. **Testing**: Manual testing by reviewers when needed
4. **Documentation**: Ensure documentation is updated

### After PR Approval

```bash
# Squash and merge is preferred
git checkout main
git pull upstream main
git branch -d feature/your-feature-name
```

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** and FAQ
3. **Try the latest version** to see if the issue is already fixed

### Issue Templates

**Bug Report**
```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**
- OS: [e.g. iOS, Android, Windows, macOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
- Device: [e.g. iPhone 14, Desktop]

**Additional Context**
Add any other context about the problem here.
```

**Feature Request**
```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional Context**
Add any other context or screenshots about the feature request here.

**Priority**
- [ ] Low
- [ ] Medium  
- [ ] High
- [ ] Critical
```

## 🤝 Community Guidelines

### Code of Conduct

We are committed to fostering a welcoming and inclusive community. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussions
- **Discord**: Real-time chat and collaboration
- **Twitter**: Updates and announcements

### Getting Help

1. **Check the documentation** first
2. **Search existing issues** and discussions
3. **Ask in Discord** for real-time help
4. **Create an issue** if you find a bug
5. **Start a discussion** for general questions

### Recognition

We recognize and appreciate all contributions, including:

- Code contributions
- Bug reports
- Documentation improvements
- Design feedback
- Community support
- Translations
- Testing and QA

Contributors are recognized in our [CONTRIBUTORS.md](CONTRIBUTORS.md) file and on our website.

## 📚 Resources

### Learning Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Native Documentation](https://reactnative.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)

### Tools and Extensions
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)

### Project-Specific Resources
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [API Documentation](docs/api/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Design System](docs/design-system/README.md)

---

Thank you for contributing to Universal Music Player! Together, we're building the future of music streaming. 🎵