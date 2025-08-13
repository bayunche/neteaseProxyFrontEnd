import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '@music-player/shared';
import { theme } from '../styles/theme';
import GlassView from '../components/GlassView';

export default function ProfileScreen() {
  const { user, ui, setTheme, logout } = usePlayerStore();
  
  const settingsItems = [
    {
      id: '1',
      title: '音质设置',
      icon: 'musical-notes-outline',
      subtitle: '高品质',
      onPress: () => {},
    },
    {
      id: '2', 
      title: '下载设置',
      icon: 'download-outline',
      subtitle: '仅WiFi下载',
      onPress: () => {},
    },
    {
      id: '3',
      title: '主题设置',
      icon: 'color-palette-outline',
      subtitle: ui.theme === 'dark' ? '深色模式' : '浅色模式',
      onPress: () => setTheme(ui.theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: '4',
      title: '通知设置',
      icon: 'notifications-outline',
      subtitle: '已开启',
      onPress: () => {},
    },
    {
      id: '5',
      title: '隐私设置',
      icon: 'shield-outline',
      subtitle: '管理隐私',
      onPress: () => {},
    },
    {
      id: '6',
      title: '关于应用',
      icon: 'information-circle-outline',
      subtitle: 'v1.0.0',
      onPress: () => {},
    },
  ];
  
  const handleLogout = () => {
    Alert.alert(
      '确认登出',
      '您确定要登出当前账户吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '登出', 
          style: 'destructive',
          onPress: () => logout()
        },
      ]
    );
  };
  
  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>我的</Text>
        </View>
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 用户信息 */}
          <GlassView style={styles.userCard}>
            {user.isLoggedIn ? (
              <>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.profile?.nickname?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {user.profile?.nickname || '用户'}
                    </Text>
                    <Text style={styles.userLevel}>
                      音乐达人 · LV.8
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="create-outline" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>128</Text>
                    <Text style={styles.statLabel}>收藏</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>8</Text>
                    <Text style={styles.statLabel}>歌单</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>1.2k</Text>
                    <Text style={styles.statLabel}>播放时长</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.loginPrompt}>
                <View style={styles.loginAvatar}>
                  <Ionicons name="person-outline" size={32} color={theme.colors.textTertiary} />
                </View>
                <Text style={styles.loginTitle}>登录获取更多功能</Text>
                <Text style={styles.loginSubtitle}>
                  同步收藏、歌单和播放记录
                </Text>
                <TouchableOpacity style={styles.loginButton}>
                  <Text style={styles.loginButtonText}>立即登录</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassView>
          
          {/* 设置选项 */}
          <GlassView style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>设置</Text>
            {settingsItems.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.settingItem,
                  index === settingsItems.length - 1 && styles.lastSettingItem
                ]}
                onPress={item.onPress}
              >
                <View style={styles.settingIcon}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={22} 
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </GlassView>
          
          {/* 登出按钮 */}
          {user.isLoggedIn && (
            <TouchableOpacity onPress={handleLogout}>
              <GlassView style={styles.logoutButton}>
                <Text style={styles.logoutText}>登出账户</Text>
              </GlassView>
            </TouchableOpacity>
          )}
          
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  userCard: {
    marginBottom: theme.spacing.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userLevel: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h4,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loginAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  loginTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  loginSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
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
  settingsCard: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...theme.typography.body1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  bottomSpacing: {
    height: theme.dimensions.bottomTabHeight + theme.dimensions.bottomPlayerHeight,
  },
});