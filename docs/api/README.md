# Universal Music Player - API Documentation

## 📋 Overview

This document provides comprehensive documentation for the Universal Music Player API, including endpoints, authentication, data models, and integration guidelines.

## 🔐 Authentication

### JWT Token Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Login Process

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://example.com/avatar.jpg",
      "premium": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_string",
    "expiresIn": 3600
  }
}
```

### Token Refresh

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_string"
}
```

## 🎵 Music API Endpoints

### Search Music

```http
GET /api/music/search?q={query}&type={type}&limit={limit}&offset={offset}
```

**Parameters:**
- `q` (string, required): Search query
- `type` (string, optional): `song`, `artist`, `album`, `playlist` (default: `song`)
- `limit` (number, optional): Results per page (default: 20, max: 100)
- `offset` (number, optional): Page offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "songs": [
      {
        "id": "song_123",
        "title": "Song Title",
        "artist": {
          "id": "artist_456",
          "name": "Artist Name",
          "avatar": "https://example.com/artist.jpg"
        },
        "album": {
          "id": "album_789",
          "title": "Album Title",
          "cover": "https://example.com/cover.jpg",
          "year": 2023
        },
        "duration": 240,
        "streamUrl": "https://stream.example.com/song.mp3",
        "previewUrl": "https://preview.example.com/song.mp3",
        "isExplicit": false,
        "genre": ["Pop", "Rock"],
        "playCount": 1000000,
        "likeCount": 50000
      }
    ],
    "total": 1500,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Song Details

```http
GET /api/music/songs/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "song_123",
    "title": "Song Title",
    "artist": {
      "id": "artist_456",
      "name": "Artist Name",
      "avatar": "https://example.com/artist.jpg",
      "bio": "Artist biography...",
      "followers": 100000
    },
    "album": {
      "id": "album_789",
      "title": "Album Title",
      "cover": "https://example.com/cover.jpg",
      "year": 2023,
      "trackCount": 12
    },
    "duration": 240,
    "streamUrl": "https://stream.example.com/song.mp3",
    "previewUrl": "https://preview.example.com/song.mp3",
    "lyrics": {
      "synced": true,
      "content": [
        {
          "time": 0,
          "text": "First line of lyrics"
        },
        {
          "time": 5000,
          "text": "Second line of lyrics"
        }
      ]
    },
    "isExplicit": false,
    "genre": ["Pop", "Rock"],
    "playCount": 1000000,
    "likeCount": 50000,
    "isLiked": false,
    "similarSongs": ["song_124", "song_125"]
  }
}
```

### Get Artist Details

```http
GET /api/music/artists/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "artist_456",
    "name": "Artist Name",
    "avatar": "https://example.com/artist.jpg",
    "banner": "https://example.com/banner.jpg",
    "bio": "Artist biography and information...",
    "genres": ["Pop", "Rock", "Alternative"],
    "followers": 1000000,
    "monthlyListeners": 5000000,
    "verified": true,
    "socialLinks": {
      "instagram": "https://instagram.com/artist",
      "twitter": "https://twitter.com/artist",
      "facebook": "https://facebook.com/artist"
    },
    "topSongs": [
      {
        "id": "song_123",
        "title": "Popular Song",
        "playCount": 10000000,
        "streamUrl": "https://stream.example.com/song.mp3"
      }
    ],
    "albums": [
      {
        "id": "album_789",
        "title": "Latest Album",
        "cover": "https://example.com/cover.jpg",
        "year": 2023,
        "type": "album"
      }
    ],
    "isFollowed": false
  }
}
```

### Get Album Details

```http
GET /api/music/albums/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "album_789",
    "title": "Album Title",
    "cover": "https://example.com/cover.jpg",
    "artist": {
      "id": "artist_456",
      "name": "Artist Name"
    },
    "year": 2023,
    "genre": ["Pop", "Rock"],
    "duration": 2880,
    "trackCount": 12,
    "type": "album",
    "label": "Record Label",
    "isExplicit": false,
    "tracks": [
      {
        "id": "song_123",
        "title": "Track Title",
        "trackNumber": 1,
        "duration": 240,
        "isExplicit": false,
        "streamUrl": "https://stream.example.com/song.mp3"
      }
    ],
    "playCount": 5000000,
    "isLiked": false
  }
}
```

## 📋 Playlist API

### Get User Playlists

```http
GET /api/playlists?limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playlists": [
      {
        "id": "playlist_123",
        "name": "My Favorite Songs",
        "description": "A collection of my favorite tracks",
        "cover": "https://example.com/playlist-cover.jpg",
        "isPublic": true,
        "isOwned": true,
        "songCount": 25,
        "totalDuration": 6000,
        "createdAt": "2023-01-15T10:30:00Z",
        "updatedAt": "2023-12-01T15:45:00Z",
        "tags": ["favorites", "pop", "rock"],
        "playCount": 150,
        "likeCount": 10,
        "isLiked": false
      }
    ],
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

### Create Playlist

```http
POST /api/playlists
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "New Playlist",
  "description": "My new playlist description",
  "isPublic": true,
  "tags": ["new", "music"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "playlist_456",
    "name": "New Playlist",
    "description": "My new playlist description",
    "cover": null,
    "isPublic": true,
    "isOwned": true,
    "songCount": 0,
    "totalDuration": 0,
    "createdAt": "2023-12-01T10:30:00Z",
    "updatedAt": "2023-12-01T10:30:00Z",
    "tags": ["new", "music"],
    "playCount": 0,
    "likeCount": 0,
    "isLiked": false
  }
}
```

### Add Song to Playlist

```http
POST /api/playlists/{id}/songs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "songIds": ["song_123", "song_124"],
  "position": 0
}
```

### Remove Song from Playlist

```http
DELETE /api/playlists/{id}/songs
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "songIds": ["song_123"]
}
```

### Update Playlist

```http
PUT /api/playlists/{id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Playlist Name",
  "description": "Updated description",
  "isPublic": false,
  "tags": ["updated", "private"]
}
```

## 🤖 AI Recommendations API

### Get Personalized Recommendations

```http
GET /api/ai/recommendations?type={type}&limit={limit}&seed={seed}
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `type` (string): `daily`, `weekly`, `discover`, `mood` (default: `daily`)
- `limit` (number): Number of recommendations (default: 20, max: 100)
- `seed` (string, optional): Seed for mood-based recommendations (`happy`, `sad`, `energetic`, `chill`)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "song_789",
        "title": "Recommended Song",
        "artist": {
          "id": "artist_101",
          "name": "New Artist"
        },
        "album": {
          "id": "album_202",
          "title": "New Album",
          "cover": "https://example.com/new-cover.jpg"
        },
        "confidence": 0.85,
        "reason": "Based on your listening to similar artists",
        "streamUrl": "https://stream.example.com/recommended.mp3"
      }
    ],
    "type": "daily",
    "generatedAt": "2023-12-01T10:30:00Z",
    "refreshAt": "2023-12-02T10:30:00Z"
  }
}
```

### Get Smart Playlist Suggestions

```http
POST /api/ai/smart-playlist
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "prompt": "upbeat songs for working out",
  "duration": 3600,
  "songCount": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playlist": {
      "name": "Workout Vibes",
      "description": "Upbeat songs perfect for working out",
      "estimatedDuration": 3540,
      "songs": [
        {
          "id": "song_456",
          "title": "High Energy Song",
          "artist": "Fitness Artist",
          "confidence": 0.92,
          "reason": "High tempo, motivational lyrics"
        }
      ]
    },
    "generatedAt": "2023-12-01T10:30:00Z"
  }
}
```

## 👤 User API

### Get User Profile

```http
GET /api/users/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Music lover and playlist curator",
    "premium": false,
    "joinedAt": "2023-01-01T00:00:00Z",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "audioQuality": "high",
      "notifications": {
        "newMusic": true,
        "playlists": true,
        "social": false
      }
    },
    "stats": {
      "totalPlayTime": 12345678,
      "songsPlayed": 5432,
      "playlistsCreated": 15,
      "artistsFollowed": 50
    }
  }
}
```

### Update User Profile

```http
PUT /api/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "bio": "Updated bio",
  "preferences": {
    "theme": "light",
    "audioQuality": "premium"
  }
}
```

### Get User Listening History

```http
GET /api/users/history?limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "song": {
          "id": "song_123",
          "title": "Recently Played Song",
          "artist": "Artist Name"
        },
        "playedAt": "2023-12-01T15:30:00Z",
        "duration": 240,
        "completionRate": 0.85
      }
    ],
    "total": 1000,
    "limit": 50,
    "offset": 0
  }
}
```

## 📊 Analytics API

### Track Playback Event

```http
POST /api/analytics/play
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "songId": "song_123",
  "timestamp": "2023-12-01T15:30:00Z",
  "duration": 240,
  "position": 120,
  "source": "playlist",
  "sourceId": "playlist_456"
}
```

### Track User Interaction

```http
POST /api/analytics/interaction
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "like",
  "targetType": "song",
  "targetId": "song_123",
  "timestamp": "2023-12-01T15:30:00Z",
  "metadata": {
    "source": "player",
    "context": "now_playing"
  }
}
```

### Get User Analytics

```http
GET /api/analytics/user?period={period}
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `period`: `day`, `week`, `month`, `year`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "stats": {
      "totalPlayTime": 12345,
      "songsPlayed": 89,
      "uniqueArtists": 34,
      "topGenres": [
        { "name": "Pop", "playTime": 3456, "percentage": 28 },
        { "name": "Rock", "playTime": 2345, "percentage": 19 }
      ],
      "topArtists": [
        {
          "id": "artist_123",
          "name": "Top Artist",
          "playTime": 1234,
          "songsPlayed": 15
        }
      ],
      "topSongs": [
        {
          "id": "song_456",
          "title": "Most Played Song",
          "artist": "Artist Name",
          "playCount": 8
        }
      ]
    }
  }
}
```

## 💾 Sync API

### Sync User Data

```http
POST /api/sync/upload
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "playlists": [
    {
      "id": "local_playlist_1",
      "name": "Local Playlist",
      "songs": ["song_123", "song_124"],
      "lastModified": "2023-12-01T10:30:00Z"
    }
  ],
  "preferences": {
    "theme": "dark",
    "audioQuality": "high"
  },
  "playHistory": [
    {
      "songId": "song_123",
      "playedAt": "2023-12-01T15:30:00Z",
      "duration": 240
    }
  ]
}
```

### Download Sync Data

```http
GET /api/sync/download?lastSync={timestamp}
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playlists": [
      {
        "id": "playlist_456",
        "name": "Server Playlist",
        "songs": ["song_789", "song_790"],
        "lastModified": "2023-12-01T12:00:00Z"
      }
    ],
    "preferences": {
      "theme": "light",
      "notifications": {
        "newMusic": false
      }
    },
    "syncTimestamp": "2023-12-01T16:00:00Z"
  }
}
```

## 🔔 Notifications API

### Subscribe to Push Notifications

```http
POST /api/notifications/subscribe
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "key_data_here",
    "auth": "auth_data_here"
  },
  "platform": "web"
}
```

### Get Notification Settings

```http
GET /api/notifications/settings
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pushEnabled": true,
    "emailEnabled": true,
    "preferences": {
      "newMusic": true,
      "playlistUpdates": true,
      "socialActivity": false,
      "recommendations": true
    }
  }
}
```

## 📱 Social API

### Follow Artist

```http
POST /api/social/follow
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "artist",
  "id": "artist_123"
}
```

### Get Following List

```http
GET /api/social/following?type={type}&limit={limit}&offset={offset}
Authorization: Bearer <jwt_token>
```

### Share Content

```http
POST /api/social/share
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "song",
  "id": "song_123",
  "platform": "twitter",
  "message": "Check out this amazing song!"
}
```

## ⚠️ Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    },
    "timestamp": "2023-12-01T15:30:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## 🔄 Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Authentication endpoints**: 5 requests per minute
- **Search endpoints**: 100 requests per minute
- **Streaming endpoints**: 1000 requests per minute
- **General API**: 200 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## 📚 SDK Libraries

### JavaScript/TypeScript

```bash
npm install @universalmusicplayer/sdk
```

```javascript
import { UniversalMusicPlayer } from '@universalmusicplayer/sdk';

const client = new UniversalMusicPlayer({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.universalmusicplayer.com'
});

// Search for music
const results = await client.search('rock music', {
  type: 'song',
  limit: 20
});

// Get user playlists
const playlists = await client.playlists.list();
```

### React Hooks

```bash
npm install @universalmusicplayer/react-hooks
```

```jsx
import { useSearch, usePlayer, usePlaylists } from '@universalmusicplayer/react-hooks';

function MusicApp() {
  const { search, results, loading } = useSearch();
  const { play, pause, currentSong, isPlaying } = usePlayer();
  const { playlists, createPlaylist } = usePlaylists();

  return (
    <div>
      <SearchBox onSearch={search} />
      <SearchResults results={results} loading={loading} />
      <Player 
        song={currentSong}
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
      />
    </div>
  );
}
```

## 🧪 Testing

### API Testing with Postman

Import the Postman collection for comprehensive API testing:

```json
{
  "info": {
    "name": "Universal Music Player API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  }
}
```

### Integration Testing

```javascript
// Example integration test
describe('Music API', () => {
  test('should search for songs', async () => {
    const response = await fetch('/api/music/search?q=rock', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.songs).toHaveLength(20);
  });
});
```

## 🔗 External Integrations

### NetEase Music API

The app integrates with NetEase Music API for music catalog access:

```javascript
// Proxy configuration for CORS
const netEaseApiProxy = {
  '/netease-api': {
    target: 'https://music.163.com',
    changeOrigin: true,
    pathRewrite: {
      '^/netease-api': ''
    }
  }
};
```

### Spotify Web API (Future)

Integration planned for Spotify catalog:

```javascript
const spotifyConfig = {
  clientId: 'your_spotify_client_id',
  redirectUri: 'https://universalmusicplayer.com/callback',
  scopes: [
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private'
  ]
};
```

## 📞 Support and Resources

### API Support
- **Documentation**: https://docs.universalmusicplayer.com/api
- **Status Page**: https://status.universalmusicplayer.com
- **Support Email**: api-support@universalmusicplayer.com
- **Developer Discord**: https://discord.gg/universalmusic

### Changelog
- **v1.0.0** (2024-01-01): Initial API release
- **v1.1.0** (2024-02-01): Added AI recommendations
- **v1.2.0** (2024-03-01): Enhanced analytics and social features