import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayerStore } from '@music-player/shared';
import { theme } from '../styles/theme';
import GlassView from '../components/GlassView';

export default function HomeScreen() {
  const { user } = usePlayerStore();
  
  // 模拟推荐数据
  const recommendations = [
    { id: '1', title: '每日推荐', subtitle: '根据你的喜好推荐', image: null },
    { id: '2', title: '最新音乐', subtitle: '发现新歌', image: null },
    { id: '3', title: '热门榜单', subtitle: '当前最火音乐', image: null },
  ];
  
  const recentPlayed = [
    { id: '1', name: '示例歌曲1', artist: '示例歌手1' },
    { id: '2', name: '示例歌曲2', artist: '示例歌手2' },
    { id: '3', name: '示例歌曲3', artist: '示例歌手3' },
  ];
  
  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* 问候语 */}
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {getGreeting()}
            </Text>
            <Text style={styles.userName}>
              {user.isLoggedIn ? user.profile?.nickname || '用户' : '未登录'}
            </Text>
          </View>
          
          {/* 快速操作 */}
          <GlassView style={styles.quickActions}>
            <Text style={styles.sectionTitle}>快速操作</Text>
            <FlatList
              data={recommendations}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.quickActionItem}>
                  <GlassView 
                    style={styles.quickActionCard}
                    intensity="light"
                    animated
                    onPress={() => {}}
                  >
                    <View style={styles.quickActionIcon} />
                    <Text style={styles.quickActionTitle}>{item.title}</Text>
                    <Text style={styles.quickActionSubtitle}>{item.subtitle}</Text>
                  </GlassView>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.quickActionsList}
            />
          </GlassView>
          
          {/* 最近播放 */}
          <GlassView style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最近播放</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>查看全部</Text>
              </TouchableOpacity>
            </View>
            
            {recentPlayed.map((item) => (
              <TouchableOpacity key={item.id} style={styles.recentItem}>
                <View style={styles.albumCover} />
                <View style={styles.songInfo}>
                  <Text style={styles.songName}>{item.name}</Text>
                  <Text style={styles.artistName}>{item.artist}</Text>
                </View>
                <TouchableOpacity style={styles.playButton}>
                  <Text style={styles.playButtonText}>▶</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </GlassView>
          
          {/* 底部间距 */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  greeting: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  greetingText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userName: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  quickActions: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quickActionsList: {
    paddingLeft: 0,
  },
  quickActionItem: {
    marginRight: theme.spacing.md,
  },
  quickActionCard: {
    width: 140,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  quickActionTitle: {
    ...theme.typography.body2,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  quickActionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  albumCover: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.md,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    ...theme.typography.body1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  artistName: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: theme.dimensions.bottomTabHeight + theme.dimensions.bottomPlayerHeight,
  },
});