import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { format } from 'date-fns';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { WeeklySchedule } from '../components/Schedule/WeeklySchedule';

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Schedule'>;

interface Task {
  id: string;
  content: string;
  dateTime: FirebaseFirestoreTypes.Timestamp;
  status: 'pending' | 'completed';
  userId: string;
  location?: string;
  notes?: string;
  tags?: string[];
}

type Language = 'en' | 'zh' | 'ja' | 'ko';

// 多语言支持
const translations = {
  en: {
    welcome: 'Welcome, ',
    addTask: 'Add Task',
    weeklySchedule: 'Weekly Schedule',
    signOut: 'Sign Out',
    searchPlaceholder: 'Search tasks...',
    allTasks: 'All',
    pendingTasks: 'Pending',
    completedTasks: 'Completed',
    todayTasks: 'Today',
    noTasks: 'No tasks found',
    complete: 'Complete',
    incomplete: 'Todo',
    edit: 'Edit',
  },
  zh: {
    welcome: '欢迎, ',
    addTask: '添加任务',
    weeklySchedule: '周日程',
    signOut: '退出登录',
    searchPlaceholder: '搜索任务...',
    allTasks: '全部',
    pendingTasks: '待办',
    completedTasks: '已完成',
    todayTasks: '今日',
    noTasks: '暂无任务',
    complete: '完成',
    incomplete: '待办',
    edit: '编辑',
  },
  ja: {
    welcome: 'ようこそ、',
    addTask: 'タスク追加',
    weeklySchedule: '週間スケジュール',
    signOut: 'ログアウト',
    searchPlaceholder: 'タスクを検索...',
    allTasks: '全て',
    pendingTasks: '未完了',
    completedTasks: '完了',
    todayTasks: '今日',
    noTasks: 'タスクがありません',
    complete: '完了',
    incomplete: '未完了',
    edit: '編集',
  },
  ko: {
    welcome: '환영합니다, ',
    addTask: '할일 추가',
    weeklySchedule: '주간 일정',
    signOut: '로그아웃',
    searchPlaceholder: '할일 검색...',
    allTasks: '전체',
    pendingTasks: '진행중',
    completedTasks: '완료',
    todayTasks: '오늘',
    noTasks: '할일이 없습니다',
    complete: '완료',
    incomplete: '진행중',
    edit: '편집',
  },
};

export const ScheduleScreen = () => {
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [language, setLanguage] = useState<Language>('zh');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const t = translations[language];

  const currentUser = auth().currentUser;
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';

  // 获取任务数据
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    const unsubscribe = firestore()
      .collection('tasks')
      .where('userId', '==', userId)
      .onSnapshot(
        (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Task[];
          setTasks(tasksData);
        },
        (error) => {
          console.error('Error fetching tasks:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  // 处理任务过滤
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.content.toLowerCase().includes(searchText.toLowerCase());
    const today = new Date();
    const taskDate = task.dateTime?.toDate();
    
    switch (currentFilter) {
      case 'pending':
        return matchesSearch && task.status !== 'completed';
      case 'completed':
        return matchesSearch && task.status === 'completed';
      case 'today':
        return matchesSearch && taskDate &&
          taskDate.getDate() === today.getDate() &&
          taskDate.getMonth() === today.getMonth() &&
          taskDate.getFullYear() === today.getFullYear();
      default:
        return matchesSearch;
    }
  });

  const handleSignOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await firestore()
        .collection('tasks')
        .doc(task.id)
        .update({ status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      
      {/* 应用标题栏 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.appTitle}>SmartSche</Text>
          {currentUser && (
            <Text style={styles.welcomeText}>
              {t.welcome}{userDisplayName}
            </Text>
          )}
        </View>
        
        {currentUser && (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>{t.signOut}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 顶部操作按钮区域 */}
      <View style={styles.topActionContainer}>
        <TouchableOpacity 
          style={styles.topActionButton}
          onPress={() => navigation.navigate('WeeklySchedule', { language })}
        >
          <Text style={styles.topActionButtonText}>{t.weeklySchedule}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topActionButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Text style={styles.topActionButtonText}>{t.addTask}</Text>
        </TouchableOpacity>
      </View>
      
      {/* 搜索栏和语言选择 */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearSearchText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.languageButton} 
          onPress={() => setShowLanguageMenu(!showLanguageMenu)}
        >
          <Text style={styles.languageButtonText}>{language.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      
      {showLanguageMenu && (
        <View style={styles.languageMenu}>
          {['en', 'zh', 'ja', 'ko'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                language === lang && styles.activeLanguageOption,
              ]}
              onPress={() => {
                setLanguage(lang as Language);
                setShowLanguageMenu(false);
              }}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  language === lang && styles.activeLanguageOptionText,
                ]}
              >
                {lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 任务过滤标签 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTagsContainer}>
        <TouchableOpacity
          style={[
            styles.filterTag,
            currentFilter === 'all' && styles.activeFilterTag,
          ]}
          onPress={() => setCurrentFilter('all')}
        >
          <Text style={[
            styles.filterTagText,
            currentFilter === 'all' && styles.activeFilterTagText
          ]}>
            {t.allTasks}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTag,
            currentFilter === 'pending' && styles.activeFilterTag,
          ]}
          onPress={() => setCurrentFilter('pending')}
        >
          <Text style={[
            styles.filterTagText,
            currentFilter === 'pending' && styles.activeFilterTagText
          ]}>
            {t.pendingTasks}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTag,
            currentFilter === 'completed' && styles.activeFilterTag,
          ]}
          onPress={() => setCurrentFilter('completed')}
        >
          <Text style={[
            styles.filterTagText,
            currentFilter === 'completed' && styles.activeFilterTagText
          ]}>
            {t.completedTasks}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTag,
            currentFilter === 'today' && styles.activeFilterTag,
          ]}
          onPress={() => setCurrentFilter('today')}
        >
          <Text style={[
            styles.filterTagText,
            currentFilter === 'today' && styles.activeFilterTagText
          ]}>
            {t.todayTasks}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 任务列表 */}
      <ScrollView style={styles.tasksList} contentContainerStyle={styles.tasksListContent}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t.noTasks}</Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <View 
              key={task.id} 
              style={[
                styles.taskItem,
                task.status === 'completed' && styles.completedTaskItem,
              ]}
            >
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <Text 
                    style={[
                      styles.taskTitle,
                      task.status === 'completed' && styles.completedTaskTitle,
                    ]}
                    numberOfLines={2}
                  >
                    {task.content}
                  </Text>
                </View>
                
                <View style={styles.taskDetails}>
                  {task.dateTime && (
                    <View style={styles.taskDetail}>
                      <Text style={styles.taskDetailText}>
                        {format(task.dateTime.toDate(), 'yyyy-MM-dd HH:mm')}
                      </Text>
                    </View>
                  )}
                  
                  {task.location && (
                    <View style={styles.taskDetail}>
                      <Text style={styles.taskDetailText}>{task.location}</Text>
                    </View>
                  )}

                  {task.notes && (
                    <View style={styles.taskDetail}>
                      <Text style={styles.taskDetailText} numberOfLines={2}>{task.notes}</Text>
                    </View>
                  )}
                </View>
                
                {/* 任务标签 */}
                {task.tags && task.tags.length > 0 && (
                  <View style={styles.tagList}>
                    {task.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              {/* 任务操作按钮 */}
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={styles.taskActionButton}
                  onPress={() => handleToggleComplete(task)}
                >
                  <Text style={[
                    styles.taskActionButtonText,
                    task.status === 'completed' && styles.completedTaskActionText
                  ]}>
                    {task.status === 'completed' ? t.complete : t.incomplete}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.taskActionButton}
                  onPress={() => handleEditTask(task)}
                >
                  <Text style={styles.taskActionButtonText}>{t.edit}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  signOutButtonText: {
    color: '#FF5722',
    fontSize: 14,
  },
  topActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
  },
  topActionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#333',
  },
  clearSearchText: {
    fontSize: 20,
    color: '#999',
    paddingHorizontal: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  languageMenu: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    elevation: 4,
    zIndex: 1000,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeLanguageOption: {
    backgroundColor: '#f0f0f0',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#666',
  },
  activeLanguageOptionText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  filterTagsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  activeFilterTag: {
    backgroundColor: '#2196F3',
  },
  filterTagText: {
    color: '#666',
    fontSize: 15,
  },
  activeFilterTagText: {
    color: '#fff',
  },
  tasksList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tasksListContent: {
    padding: 12,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  completedTaskItem: {
    backgroundColor: '#fff',
  },
  taskContent: {
    flex: 1,
    marginRight: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  completedTaskTitle: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  taskDetails: {
    marginTop: 6,
  },
  taskDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskDetailText: {
    fontSize: 13,
    color: '#666',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskActionButton: {
    padding: 8,
    marginLeft: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  taskActionButtonText: {
    fontSize: 13,
    color: '#666',
  },
  completedTaskActionText: {
    color: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
}); 