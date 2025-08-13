export default {
  expo: {
    name: "Music Player",
    slug: "music-player-universal",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0a"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      buildNumber: "1",
      bundleIdentifier: "com.yourcompany.musicplayer",
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ["audio"],
        NSAppleMusicUsageDescription: "This app uses music to provide audio playback functionality.",
        NSMicrophoneUsageDescription: "This app does not use the microphone."
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      versionCode: 1,
      package: "com.yourcompany.musicplayer",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0a"
      },
      permissions: [
        "INTERNET",
        "WAKE_LOCK",
        "FOREGROUND_SERVICE",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.yourcompany.musicplayer"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-av",
        {
          microphonePermission: "Allow Music Player to access your microphone for audio recording."
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow Music Player to access your photos for album artwork.",
          savePhotosPermission: "Allow Music Player to save images to your photo library.",
          isAccessMediaLocationEnabled: true
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#ef4444",
          sounds: ["./assets/notification-sound.wav"]
        }
      ],
      [
        "expo-background-fetch",
        {
          backgroundFetchTaskName: "music-player-background-fetch"
        }
      ],
      [
        "expo-task-manager",
        {
          backgroundTaskName: "music-player-background-task"
        }
      ]
    ],
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "your-eas-project-id"
      }
    },
    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/your-eas-project-id"
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};