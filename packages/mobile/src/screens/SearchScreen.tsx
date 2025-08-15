import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '@music-player/shared';
import { theme } from '../styles/theme';
import GlassView from '../components/GlassView';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const { 
    search, 
    performSearch, 
    clearSearch, 
    clearSearchHistory,
    play 
  } = usePlayerStore();
  
  // 热门搜索
  const hotSearches = [
    '周杰伦', '邓紫棋', '毛不易', '陈奕迅', '李荣浩', 
    '薛之谦', '林俊杰', '王力宏', '张学友', '刘德华'
  ];
  
  // 执行搜索
  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) return;
    setSearchText(keyword);
    await performSearch(keyword);
  };
  
  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>搜索</Text>
        </View>
        
        {/* 搜索框 */}
        <GlassView style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={theme.colors.textTertiary} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索歌曲、歌手、专辑..."
              placeholderTextColor={theme.colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => handleSearch(searchText)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchText('')}
                style={styles.clearButton}
              >
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={theme.colors.textTertiary} 
                />
              </TouchableOpacity>
            )}
          </View>
        </GlassView>
        
        {searchText.length === 0 ? (
          // 搜索建议页面
          <View style={styles.content}>
            {/* 搜索历史 */}
            {search.history.length > 0 && (
              <GlassView style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>搜索历史</Text>
                  <TouchableOpacity onPress={clearSearchHistory}>
                    <Ionicons 
                      name="trash-outline" 
                      size={20} 
                      color={theme.colors.textTertiary} 
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagContainer}>
                  {search.history.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.tag}
                      onPress={() => handleSearch(item)}
                    >
                      <Text style={styles.tagText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassView>
            )}
            
            {/* 热门搜索 */}
            <GlassView style={styles.section}>
              <Text style={styles.sectionTitle}>热门搜索</Text>
              <View style={styles.tagContainer}>
                {hotSearches.map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={[styles.tag, index < 3 && styles.hotTag]}
                    onPress={() => handleSearch(item)}
                  >
                    {index < 3 && (
                      <View style={styles.hotBadge}>
                        <Text style={styles.hotBadgeText}>{index + 1}</Text>
                      </View>
                    )}
                    <Text style={[styles.tagText, index < 3 && styles.hotTagText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassView>
          </View>
        ) : (
          // 搜索结果页面
          <View style={styles.content}>
            {search.isSearching ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>搜索中...</Text>
              </View>
            ) : search.results ? (
              <View>
                <Text style={styles.resultsText}>
                  搜索 "{searchText}" 的结果 ({search.results.total || 0})
                </Text>
                {search.results.songs && search.results.songs.length > 0 && (
                  <GlassView style={styles.section}>
                    <Text style={styles.sectionTitle}>歌曲</Text>
                    <FlatList
                      data={search.results.songs}
                      keyExtractor={(item) => String(item.id)}
                      renderItem={({ item: song }) => (
                        <TouchableOpacity 
                          style={styles.songItem}
                          onPress={() => play(song)}
                        >
                          <View style={styles.songInfo}>
                            <Text style={styles.songName} numberOfLines={1}>
                              {song.name}
                            </Text>
                            <Text style={styles.artistName} numberOfLines={1}>
                              {song.artists?.map(artist => artist.name).join(', ') || '未知艺术家'}
                            </Text>
                          </View>
                          <TouchableOpacity style={styles.playButton}>
                            <Ionicons name="play" size={20} color={theme.colors.text} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={false}
                    />
                  </GlassView>
                )}
              </View>
            ) : (
              <Text style={styles.resultsText}>
                暂无搜索结果
              </Text>
            )}
          </View>
        )}
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
  searchContainer: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.text,
    height: '100%',
  },
  clearButton: {
    marginLeft: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  tagText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  hotTagText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  hotBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  hotBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  resultsText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.xxl,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
});