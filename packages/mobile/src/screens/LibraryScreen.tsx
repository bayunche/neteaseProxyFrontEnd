import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '@music-player/shared';
import { theme } from '../styles/theme';
import GlassView from '../components/GlassView';

export default function LibraryScreen() {
  const { user } = usePlayerStore();
  
  const libraryItems = [
    { 
      id: '1', 
      title: '最近播放', 
      icon: 'time-outline', 
      count: 25,
      description: '最近播放的歌曲'
    },
    { 
      id: '2', 
      title: '我喜欢的音乐', 
      icon: 'heart-outline', 
      count: 128,
      description: '收藏的歌曲'
    },
    { 
      id: '3', 
      title: '创建的歌单', 
      icon: 'musical-notes-outline', 
      count: 8,
      description: '我创建的歌单'
    },
    { 
      id: '4', 
      title: '收藏的歌单', 
      icon: 'bookmark-outline', 
      count: 15,
      description: '收藏的歌单'
    },
    { 
      id: '5', 
      title: '下载的音乐', 
      icon: 'download-outline', 
      count: 42,
      description: '离线下载的歌曲'
    },
    { 
      id: '6', 
      title: '播放历史', 
      icon: 'list-outline', 
      count: 256,
      description: '完整的播放记录'
    },
  ];
  
  if (!user.isLoggedIn) {
    return (
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>音乐库</Text>
          </View>
          
          <View style={styles.loginPrompt}>
            <GlassView style={styles.loginCard}>
              <Ionicons 
                name="library-outline" 
                size={64} 
                color={theme.colors.textTertiary}
                style={styles.loginIcon}
              />
              <Text style={styles.loginTitle}>登录查看你的音乐库</Text>
              <Text style={styles.loginSubtitle}>
                登录后可以查看收藏的歌曲、歌单和播放历史
              </Text>
              <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginButtonText}>立即登录</Text>
              </TouchableOpacity>
            </GlassView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }
  
  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>音乐库</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* 用户信息 */}
        <GlassView style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.profile?.nickname?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user.profile?.nickname || '用户'}
            </Text>
            <Text style={styles.userSubtitle}>
              个人音乐库
            </Text>
          </View>
          <TouchableOpacity style={styles.userButton}>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </GlassView>
        
        {/* 音乐库内容 */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {libraryItems.map((item) => (
            <TouchableOpacity key={item.id}>
              <GlassView 
                style={styles.libraryItem}
                animated
                onPress={() => {}}
              >
                <View style={styles.itemIcon}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={24} 
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemCount}>{item.count}</Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={theme.colors.textTertiary}
                  />
                </View>
              </GlassView>
            </TouchableOpacity>
          ))}
          
          {/* 底部间距 */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loginCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  loginIcon: {
    marginBottom: theme.spacing.lg,
  },
  loginTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  loginSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
  },
  loginButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    ...theme.typography.h4,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  userButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  itemDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  itemMeta: {
    alignItems: 'center',
  },
  itemCount: {
    ...theme.typography.body2,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  bottomSpacing: {
    height: theme.dimensions.bottomTabHeight + theme.dimensions.bottomPlayerHeight,
  },
});