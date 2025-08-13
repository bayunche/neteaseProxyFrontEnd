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
import { theme } from '../styles/theme';
import GlassView from '../components/GlassView';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // 热门搜索
  const hotSearches = [
    '周杰伦', '邓紫棋', '毛不易', '陈奕迅', '李荣浩', 
    '薛之谦', '林俊杰', '王力宏', '张学友', '刘德华'
  ];
  
  // 搜索历史
  const searchHistory = [
    '告白气球', '光年之外', '消愁', '十年'
  ];
  
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
              autoCapitalize="none"
              autoCorrect={false}
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
            {searchHistory.length > 0 && (
              <GlassView style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>搜索历史</Text>
                  <TouchableOpacity>
                    <Ionicons 
                      name="trash-outline" 
                      size={20} 
                      color={theme.colors.textTertiary} 
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagContainer}>
                  {searchHistory.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.tag}
                      onPress={() => setSearchText(item)}
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
                    onPress={() => setSearchText(item)}
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
            <Text style={styles.resultsText}>
              搜索 "{searchText}" 的结果
            </Text>
            {/* TODO: 实际的搜索结果列表 */}
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
});