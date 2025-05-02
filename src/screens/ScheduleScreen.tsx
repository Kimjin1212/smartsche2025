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
import NotificationService from '../services/notification';
import { NLPService } from '../services/nlpService';
import QuickNoteInput from '../components/Schedule/QuickNoteInput';
import { SmartScheduler } from '../services/smartScheduler';
import { SmartTimeSlot } from '../types/schedule';
import { AddTaskModal } from '../components/Schedule/AddTaskModal';
import { translations, Language } from '../i18n/translations';

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Schedule'>;
type FilterType = 'all' | 'pending' | 'completed' | 'today';

interface Task {
  id: string;
  userId: string;
  content: string;
  dateTime: FirebaseFirestoreTypes.Timestamp;
  endTime: FirebaseFirestoreTypes.Timestamp;
  location?: string;
  status: 'pending' | 'completed';
  weekday: number;
  color: string;
  reminderEnabled?: boolean;
  reminderOffsetMinutes?: number;
  version: number;
}

// 添加语言显示映射
const languageDisplayNames = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

// 更新星期数组为多语言支持
const getWeekdays = (language: Language) => {
  const t = translations[language];
  return [
    t.monday,
    t.tuesday,
    t.wednesday,
    t.thursday,
    t.friday,
    t.saturday,
    t.sunday,
  ];
};

const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722'];

// Add getFilterLabel function
const getFilterLabel = (filter: FilterType, t: typeof translations['en']) => {
  switch (filter) {
    case 'all':
      return t.allTasks;
    case 'pending':
      return t.pendingTasks;
    case 'completed':
      return t.completedTasks;
    case 'today':
      return t.todayTasks;
    default:
      return t.allTasks;
  }
};

// Add missing type definitions
interface ParsedSchedule {
  date: Date | null;
  content: string;
}

// Add time patterns for different languages
const timePatterns = {
  en: /(\d{1,2}(?::\d{2})?(?:am|pm)?)/i,
  zh: /(\d{1,2}(?::\d{2})?(?:上午|下午)?)/i,
  ja: /(\d{1,2}(?::\d{2})?(?:午前|午後)?)/i,
  ko: /(\d{1,2}(?::\d{2})?(?:오전|오후)?)/i,
};

// Add helper functions for task display
const extractTaskDisplayContent = (content: string): string => {
  if (!content) return '';
  // Remove any special characters or excessive whitespace
  return content.replace(/[^\w\s\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, ' ').trim();
};

const formatTaskTime = (task: Task): string => {
  if (!task.dateTime) return '';
  const date = task.dateTime.toDate();
  return format(date, 'HH:mm');
};

// Add checkTimeConflict function
const checkTimeConflict = (
  startTime1: Date,
  endTime1: Date,
  startTime2: Date,
  endTime2: Date
): boolean => {
  return (
    (startTime1 >= startTime2 && startTime1 < endTime2) ||
    (endTime1 > startTime2 && endTime1 <= endTime2) ||
    (startTime1 <= startTime2 && endTime1 >= endTime2)
  );
};

export const ScheduleScreen = () => {
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchText, setSearchText] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [language, setLanguage] = useState<Language>('zh');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [isQuickNoteModalVisible, setIsQuickNoteModalVisible] = useState(false);
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<SmartTimeSlot[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const smartScheduler = new SmartScheduler();

  const t = translations[language];
  const currentUser = auth().currentUser;
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';

  // 获取任务数据
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    // 使用实时监听
    const unsubscribe = firestore()
      .collection('tasks')
      .where('userId', '==', userId)
      .onSnapshot(
        snapshot => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Task[];
          setTasks(tasksData);
        },
        error => {
          console.error('Error fetching tasks:', error);
        }
      );

    // 清理监听器
    return () => unsubscribe();
  }, []);

  // 处理任务过滤
  const filteredTasks = tasks.filter(task => {
    const searchLower = searchText.toLowerCase();
    const matchesSearch = 
      task.content?.toLowerCase().includes(searchLower) || 
      task.location?.toLowerCase().includes(searchLower) ||
      getWeekdays(language)[task.weekday]?.toLowerCase().includes(searchLower) ||
      false;
    
    const today = new Date();
    const taskStartTime = task.dateTime?.toDate();
    
    switch (currentFilter) {
      case 'pending':
        return matchesSearch && task.status !== 'completed';
      case 'completed':
        return matchesSearch && task.status === 'completed';
      case 'today':
        return matchesSearch && taskStartTime &&
          taskStartTime.getDate() === today.getDate() &&
          taskStartTime.getMonth() === today.getMonth() &&
          taskStartTime.getFullYear() === today.getFullYear();
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

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsEditModalVisible(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await firestore()
        .collection('tasks')
        .doc(taskId)
        .delete();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // 处理日期选择
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setSelectedDay(currentDate.getDay());
  };

  // 修改添加任务的函数
  const handleAddTask = async (newTask: Partial<Task>) => {
    try {
      if (!currentUser) {
        Alert.alert('错误', '请先登录');
        return;
      }

      const taskRef = await firestore().collection('tasks').add({
        ...newTask,
        userId: currentUser.uid,
        status: 'pending',
        version: 1,
      });

      const addedTask = {
        id: taskRef.id,
        ...newTask,
        userId: currentUser.uid,
        status: 'pending' as const,
        version: 1,
      } as Task;

      setTasks(prevTasks => [...prevTasks, addedTask]);
      setIsAddModalVisible(false);

      if (addedTask.reminderEnabled && typeof addedTask.reminderOffsetMinutes === 'number') {
        await NotificationService.scheduleTaskReminder({
          id: addedTask.id,
          content: addedTask.content,
          dateTime: addedTask.dateTime,
          reminderOffsetMinutes: addedTask.reminderOffsetMinutes
        });
      }
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('错误', '添加任务失败');
    }
  };

  // 修改编辑任务的保存函数
  const handleEditTask = async (editingTask: Task) => {
    if (!editingTask) return;

    // 检查时间冲突
    const conflictingTask = checkTimeConflict(
      editingTask.weekday,
      format(editingTask.dateTime.toDate(), 'HH:mm'),
      format(editingTask.dateTime.toDate(), 'HH:mm'),
      tasks,
      editingTask.id // 排除当前正在编辑的任务
    );

    if (conflictingTask) {
      Alert.alert(
        t.timeConflict || '时间冲突',
        `${t.conflictWith || '与以下任务时间冲突'}: ${conflictingTask.content} (${format(conflictingTask.dateTime.toDate(), 'HH:mm')} - ${format(conflictingTask.dateTime.toDate(), 'HH:mm')})`,
        [
          {
            text: t.cancel || '取消',
            style: 'cancel'
          },
          {
            text: t.continue || '继续保存',
            onPress: async () => {
              await updateTaskInFirestore(editingTask);
            }
          }
        ]
      );
      return;
    }

    await updateTaskInFirestore(editingTask);
  };

  // 修改 updateTaskInFirestore 函数
  const updateTaskInFirestore = async (task: Task) => {
    try {
      const taskRef = firestore().collection('tasks').doc(task.id);
      
      // Use transaction to handle concurrent updates
      await firestore().runTransaction(async (transaction) => {
        const taskDoc = await transaction.get(taskRef);
        if (!taskDoc.exists) {
          throw new Error('Task does not exist');
        }
        
        const currentVersion = taskDoc.data()?.version || 0;
        if (currentVersion !== task.version) {
          throw new Error('Task was updated by another user');
        }
        
        // Increment version and update task
        transaction.update(taskRef, {
          ...task,
          version: currentVersion + 1
        });
      });

      if (task.reminderEnabled) {
        await NotificationService.scheduleTaskReminder(task);
      } else {
        await NotificationService.cancelNotification(task.id);
      }

      setIsEditModalVisible(false);
      setEditingTask(null);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Task was updated by another user') {
        Alert.alert('更新冲突', '该任务已被其他用户更新，请刷新后重试');
      } else {
        console.error('Error updating task:', error);
        Alert.alert('错误', '更新任务失败，请重试');
      }
    }
  };

  // 修改同步函数
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        Alert.alert('错误', '请先登录');
        return;
      }

      // 从服务器获取最新任务
      const serverSnapshot = await firestore()
        .collection('tasks')
        .where('userId', '==', userId)
        .get();
      
      const serverTasks = serverSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      // 本地任务版本号检查和更新
      for (const serverTask of serverTasks) {
        const localTask = tasks.find(t => t.id === serverTask.id);
        if (!localTask || (serverTask.version > (localTask.version || 0))) {
          // 服务器版本更新，更新本地任务
          await firestore().collection('tasks').doc(serverTask.id).set(serverTask);
        }
      }

      // 更新本地状态
      setTasks(serverTasks);
      Alert.alert(t.syncSuccess);
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(t.syncFailed);
    } finally {
      setIsSyncing(false);
    }
  };

  // 修改解析函数
  const parseNaturalLanguage = (text: string): ParsedSchedule => {
    const detectLanguage = (text: string): Language => {
      const patterns = {
        zh: /[\u4e00-\u9fa5]/,
        ja: /[\u3040-\u309f\u30a0-\u30ff]/,
        ko: /[\uac00-\ud7af\u1100-\u11ff]/,
        en: /^[a-zA-Z0-9\s.,!?]*$/,
      };

      for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
          return lang as Language;
        }
      }
      return 'en';
    };

    const lang = detectLanguage(text);
    const patterns = timePatterns[lang];
    const now = new Date();
    let dateTime = new Date(now);
    let content = text;

    // 重置时间部分，只保留日期
    dateTime.setHours(0, 0, 0, 0);

    // 解析相对日期
    if (patterns.tomorrow.test(text)) {
      // 设置为明天的日期
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      dateTime = tomorrow;
      // 获取明天的星期几 (0-6, 0表示星期日)
      const weekday = tomorrow.getDay();
      // 转换为我们的格式 (0-6, 0表示周一)
      const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
      setSelectedDay(adjustedWeekday);
    } else if (patterns.dayAfterTomorrow.test(text)) {
      // 设置为后天的日期
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);
      dateTime = dayAfterTomorrow;
      // 获取后天的星期几 (0-6, 0表示星期日)
      const weekday = dayAfterTomorrow.getDay();
      // 转换为我们的格式 (0-6, 0表示周一)
      const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
      setSelectedDay(adjustedWeekday);
    } else {
      // 如果是今天，使用今天的星期几
      const weekday = now.getDay();
      const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
      setSelectedDay(adjustedWeekday);
    }

    // 解析时间
    const parseTimeString = (timeStr: string, lang: Language): number => {
      const numbers = timePatterns[lang].numbers;
      return numbers[timeStr] || parseInt(timeStr);
    };

    const timeMatch = text.match(patterns.time);
    if (timeMatch) {
      let hours = 0;
      let minutes = 0;

      if (lang === 'zh' || lang === 'ja' || lang === 'ko') {
        // 处理中文/日文/韩文数字
        const timeStr = timeMatch[0];
        const numberMatch = timeStr.match(/[一二三四五六七八九十]{1,2}|[일이삼사오육칠팔구십]{1,2}|\d{1,2}/);
        if (numberMatch) {
          hours = parseTimeString(numberMatch[0], lang);
        }
        const minuteMatch = timeStr.match(/(\d{1,2})分|(\d{1,2})분/);
        if (minuteMatch) {
          minutes = parseInt(minuteMatch[1] || minuteMatch[2] || '0');
        }
      } else {
        // 处理英文和数字时间
        hours = parseInt(timeMatch[1] || '0');
        minutes = parseInt(timeMatch[2] || '0');
        
        if (timeMatch[3]) {
          const meridiem = timeMatch[3].toLowerCase();
          if (meridiem === 'pm' && hours < 12) {
            hours += 12;
          } else if (meridiem === 'am' && hours === 12) {
            hours = 0;
          }
        }
      }

      // 处理下午/晚上的情况
      if (patterns.afternoon.test(text) || patterns.evening.test(text)) {
        if (hours < 12) hours += 12;
      }

      // 保持日期不变，只更新时间部分
      dateTime.setHours(hours, minutes, 0);
    }

    // 提取内容（移除时间相关文本）
    content = text.replace(patterns.time, '')
                 .replace(patterns.today, '')
                 .replace(patterns.tomorrow, '')
                 .replace(patterns.dayAfterTomorrow, '')
                 .replace(patterns.morning, '')
                 .replace(patterns.afternoon, '')
                 .replace(patterns.evening, '')
                 .trim();

    return {
      content,
      dateTime,
      location: '', // 可以进一步解析地点
    };
  };

  // 处理随手记笔记
  const handleQuickNoteProcessed = (date: Date | null, content: string) => {
    try {
      if (date) {
        const taskDate = new Date(date);
        const endDate = new Date(taskDate);
        endDate.setHours(taskDate.getHours() + 1);

        const newTask: Omit<Task, 'id'> = {
          userId: currentUser?.uid || '',
          content: content,
          dateTime: firestore.Timestamp.fromDate(taskDate),
          endTime: firestore.Timestamp.fromDate(endDate),
          location: '',
          status: 'pending',
          weekday: taskDate.getDay(),
          color: colors[Math.floor(Math.random() * colors.length)],
          version: 1,
          reminderEnabled: false,
          reminderOffsetMinutes: 10
        };

        handleAddTask(newTask);
      }
      setIsQuickNoteModalVisible(false);
      setQuickNoteText('');
    } catch (error) {
      console.error('Error processing quick note:', error);
      Alert.alert('错误', '处理快速笔记失败');
    }
  };

  const handleSmartRecommendation = () => {
    const startDate = new Date(`2000-01-01 ${startTime}`);
    const endDate = new Date(`2000-01-01 ${endTime}`);
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));
    
    if (duration <= 0) {
      Alert.alert('错误', '请先设置有效的任务时长');
      return;
    }

    const dateTasksFilter = tasks.filter(task => {
      const taskDate = task.dateTime.toDate();
      return taskDate.toDateString() === selectedDate.toDateString();
    });

    const timeSlots = dateTasksFilter.map(task => ({
      startTime: task.dateTime.toDate().toISOString(),
      endTime: task.endTime.toDate().toISOString(),
    }));

    const recommendedSlots = smartScheduler.getSmartTimeSlots(duration, timeSlots, undefined, language);
    const smartSlots: SmartTimeSlot[] = recommendedSlots.map(slot => ({
      ...slot,
      explanation: slot.explanation || '推荐时间段'
    }));
    setRecommendations(smartSlots);
    setShowRecommendations(true);
  };

  const handleSelectRecommendation = (slot: SmartTimeSlot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    setStartTime(format(start, 'HH:mm'));
    setEndTime(format(end, 'HH:mm'));
    setShowRecommendations(false);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;

      const tasksSnapshot = await firestore()
        .collection('tasks')
        .where('userId', '==', currentUser.uid)
        .get();

      const fetchedTasks = tasksSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
      
      // Sort tasks by dateTime client-side
      const sortedTasks = fetchedTasks.sort((a, b) => 
        a.dateTime.toMillis() - b.dateTime.toMillis()
      );

      setTasks(sortedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      
      {/* 应用标题栏 */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.appTitle}>Smart Schedule</Text>
          {currentUser && (
            <TextInput
              style={styles.welcomeInput}
              placeholder={t.welcome}
              defaultValue={userDisplayName}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
              onChangeText={async (newName) => {
                try {
                  await auth().currentUser?.updateProfile({
                    displayName: newName
                  });
                } catch (error) {
                  console.error('Error updating display name:', error);
                }
              }}
            />
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Text style={styles.languageButtonText}>{languageDisplayNames[language]}</Text>
          </TouchableOpacity>

          {currentUser && (
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>{t.signOut}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 顶部操作按钮区域 */}
      <View style={styles.topActionContainer}>
        <TouchableOpacity 
          style={[styles.topActionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('WeeklySchedule', { language })}
        >
          <Text style={styles.primaryButtonText}>{t.weeklySchedule}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.topActionButton, styles.primaryButton]}
          onPress={() => setIsQuickNoteModalVisible(true)}
        >
          <Text style={styles.primaryButtonText}>{t.quickNote}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.topActionButton, styles.primaryButton]}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Text style={styles.primaryButtonText}>{t.addTask}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.topActionButton, styles.primaryButton]}
          onPress={handleSync}
          disabled={isSyncing}
        >
          <Text style={styles.primaryButtonText}>
            {isSyncing ? t.syncing : t.sync}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
        />
      </View>

      {/* 过滤器 */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContentContainer}
        >
          {(['all', 'pending', 'completed', 'today'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                currentFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setCurrentFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  currentFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {getFilterLabel(filter, t)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 任务列表 */}
      <View style={styles.taskListContainer}>
        <ScrollView 
          style={styles.taskList}
          contentContainerStyle={styles.taskListContent}
        >
          {filteredTasks.length === 0 ? (
            <Text style={styles.noTasksText}>{t.noTasks}</Text>
          ) : (
            filteredTasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  task.status === 'completed' && styles.taskItemCompleted,
                ]}
              >
                <View style={styles.taskMainContent}>
                  <TouchableOpacity
                    style={styles.taskStatusButton}
                    onPress={() => handleToggleComplete(task)}
                  >
                    <View style={[
                      styles.taskStatusIndicator,
                      task.status === 'completed' && styles.taskStatusIndicatorCompleted
                    ]}>
                      {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.taskContent,
                      task.status === 'completed' && styles.taskContentCompleted,
                    ]}
                  >
                    {extractTaskDisplayContent(task.content)}
                  </Text>
                  <Text style={styles.taskDateTime}>
                    {formatTaskTime(task)}
                  </Text>
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={[styles.taskActionButton, styles.editButton]}
                    onPress={() => openEditModal(task)}
                  >
                    <Text style={styles.taskActionButtonText}>{t.edit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.taskActionButton, styles.deleteButton]}
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Text style={[styles.taskActionButtonText, styles.deleteButtonText]}>{t.delete}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* 语言选择菜单 */}
      {showLanguageMenu && (
        <View style={styles.languageMenu}>
          {Object.entries(languageDisplayNames).map(([lang, name]) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageMenuItem,
                language === lang && styles.languageMenuItemActive
              ]}
              onPress={() => {
                setLanguage(lang as Language);
                setShowLanguageMenu(false);
              }}
            >
              <Text style={[
                styles.languageMenuItemText,
                language === lang && styles.languageMenuItemTextActive
              ]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <AddTaskModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddTask={handleAddTask}
        existingTasks={tasks}
        language={language}
        selectedHour={selectedHour}
        selectedDay={selectedDay}
      />

      {/* 编辑任务模态窗口 */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.edit}</Text>
            
            <TextInput
              style={styles.modalInputField}
              placeholder={t.taskTitle}
              value={editingTask?.content || ''}
              onChangeText={(text) => setEditingTask(prev => prev ? {...prev, content: text} : null)}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
            />

            <TextInput
              style={styles.modalInputField}
              placeholder={t.taskLocation}
              value={editingTask?.location || ''}
              onChangeText={(text) => setEditingTask(prev => prev ? {...prev, location: text} : null)}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
            />

            <Text style={styles.modalLabel}>{t.weekday}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.weekdayContainer}
              contentContainerStyle={styles.weekdayContentContainer}
            >
              {getWeekdays(language).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekdayButton,
                    editingTask?.weekday === index && styles.weekdayButtonSelected
                  ]}
                  onPress={() => setEditingTask(prev => prev ? {...prev, weekday: index} : null)}
                >
                  <Text style={[
                    styles.weekdayButtonText,
                    editingTask?.weekday === index && styles.weekdayButtonTextSelected
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.timeContainer}>
              <View style={styles.timeField}>
                <Text style={styles.modalLabel}>{t.startTime}</Text>
                <TextInput
                  style={styles.timeInput}
                  value={editingTask?.dateTime && editingTask.dateTime instanceof firestore.Timestamp ? format(editingTask.dateTime.toDate(), 'HH:mm') : ''}
                  onChangeText={(text) => {
                    if (editingTask && editingTask.dateTime instanceof firestore.Timestamp) {
                      const [hours, minutes] = text.split(':').map(Number);
                      const date = editingTask.dateTime.toDate();
                      date.setHours(hours || 0, minutes || 0);
                      setEditingTask({...editingTask, dateTime: firestore.Timestamp.fromDate(date)});
                    }
                  }}
                  placeholder="08:00"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.modalLabel}>{t.endTime}</Text>
                <TextInput
                  style={styles.timeInput}
                  value={editingTask?.dateTime && editingTask.dateTime instanceof firestore.Timestamp ? format(editingTask.dateTime.toDate(), 'HH:mm') : ''}
                  onChangeText={(text) => {
                    if (editingTask && editingTask.dateTime instanceof firestore.Timestamp) {
                      const [hours, minutes] = text.split(':').map(Number);
                      const date = editingTask.dateTime.toDate();
                      date.setHours(hours || 0, minutes || 0);
                      setEditingTask({...editingTask, dateTime: firestore.Timestamp.fromDate(date)});
                    }
                  }}
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>{t.color}</Text>
            <View style={styles.colorContainer}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    editingTask?.color === color && styles.colorButtonSelected
                  ]}
                  onPress={() => setEditingTask(prev => prev ? {...prev, color} : null)}
                />
              ))}
            </View>

            <View style={styles.reminderContainer}>
              <Text style={styles.modalLabel}>{t.reminder}</Text>
              <View style={styles.reminderRow}>
                <TouchableOpacity
                  style={[
                    styles.reminderToggle,
                    editingTask?.reminderEnabled && styles.reminderToggleActive
                  ]}
                  onPress={() => setEditingTask(prev => 
                    prev ? {...prev, reminderEnabled: !prev.reminderEnabled} : null
                  )}
                >
                  <Text style={[
                    styles.reminderToggleText,
                    editingTask?.reminderEnabled && styles.reminderToggleTextActive
                  ]}>
                    {editingTask?.reminderEnabled ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
                {editingTask?.reminderEnabled && (
                  <View style={styles.reminderOffsetContainer}>
                    <Text style={styles.modalLabel}>{t.reminderOffset}</Text>
                    <TextInput
                      style={styles.reminderOffsetInput}
                      value={String(editingTask?.reminderOffsetMinutes || '')}
                      onChangeText={(text) => setEditingTask(prev =>
                        prev ? {...prev, reminderOffsetMinutes: parseInt(text) || 0} : null
                      )}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.modalLabel}>{t.minutes}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setEditingTask(null);
                }}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={async () => {
                  if (editingTask) {
                    try {
                      await updateTaskInFirestore(editingTask);
                    } catch (error) {
                      console.error('Error updating task:', error);
                      Alert.alert('错误', '更新任务失败，请重试');
                    }
                  }
                }}
              >
                <Text style={styles.saveButtonText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 快速添加模态框 */}
      <Modal
        visible={isQuickNoteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsQuickNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.quickNote}</Text>
            <TextInput
              style={[styles.modalInputField, { height: 100, textAlignVertical: 'top' }]}
              placeholder={language === 'zh' ? "例如：明天下午三点去医院" : 
                          language === 'en' ? "Example: Going to hospital tomorrow at 3 PM" :
                          language === 'ja' ? "例：明日の午後3時に病院に行く" :
                          language === 'ko' ? "예시: 내일 오후 3시에 병원에 가기" : ""}
              value={quickNoteText}
              onChangeText={setQuickNoteText}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsQuickNoteModalVisible(false);
                  setQuickNoteText('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={async () => {
                  try {
                    // 使用NLP服务解析输入
                    const nlpService = NLPService.getInstance();
                    const result = nlpService.parse(quickNoteText);
                    
                    // 如果解析不到日期，显示提示
                    if (!result.date) {
                      Alert.alert('信息', '未能识别日期时间，将使用默认时间');
                    }
                    
                    // 直接创建任务而不打开任务编辑窗口
                    const taskDate = result.date || new Date();
                    const weekday = taskDate.getDay() === 0 ? 6 : taskDate.getDay() - 1; // 调整为0=周一，6=周日
                    
                    const startTimeString = format(taskDate, 'HH:mm');
                    // 结束时间设为开始时间后一小时
                    const endDate = new Date(taskDate);
                    endDate.setHours(taskDate.getHours() + 1);
                    const endTimeString = format(endDate, 'HH:mm');
                    
                    const randomColorIndex = Math.floor(Math.random() * colors.length);
                    const taskColor = colors[randomColorIndex];
                    
                    // 创建任务
                    if (currentUser) {
                      const newTask: Omit<Task, 'id'> = {
                        userId: currentUser.uid,
                        content: result.content,
                        dateTime: firestore.Timestamp.fromDate(taskDate),
                        location: '',
                        status: 'pending',
                        weekday: weekday,
                        color: taskColor,
                        version: 1,
                      };
                      
                      // 保存到Firestore
                      await firestore().collection('tasks').add(newTask);
                      
                      // 可能需要的本地处理
                      const newTaskWithId = { 
                        ...newTask, 
                        id: Date.now().toString() // 只是临时ID
                      };
                      setTasks([...tasks, newTaskWithId as Task]);
                      
                      console.log('随手记任务已保存:', newTaskWithId);
                    }
                    
                    // 关闭随手记窗口并清空输入
                    setIsQuickNoteModalVisible(false);
                    setQuickNoteText('');
                  } catch (error) {
                    console.error('保存随手记任务出错:', error);
                    Alert.alert('错误', '保存任务失败，请重试');
                  }
                }}
              >
                <Text style={styles.saveButtonText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2196F3',
    letterSpacing: 0.5,
  },
  welcomeInput: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    padding: 0,
    height: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  signOutButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  topActionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  topActionButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContentContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  taskListContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  taskItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskItemCompleted: {
    opacity: 0.7,
  },
  taskMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskContent: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'left',
  },
  taskContentCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  taskDateTime: {
    fontSize: 14,
    color: '#999',
    marginLeft: 12,
  },
  taskLocation: {
    display: 'none',
  },
  taskTags: {
    display: 'none',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  taskActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#2196F3',
  },
  deleteButton: {
    borderColor: '#ff6b6b',
  },
  taskActionButtonText: {
    fontSize: 14,
    color: '#2196F3',
  },
  deleteButtonText: {
    color: '#ff6b6b',
  },
  noTasksText: {
    textAlign: 'center',
    color: '#999',
    padding: 16,
    fontSize: 15,
  },
  languageMenu: {
    position: 'absolute',
    top: 64,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  languageMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageMenuItemActive: {
    backgroundColor: '#f5f5f5',
  },
  languageMenuItemText: {
    fontSize: 14,
    color: '#333',
  },
  languageMenuItemTextActive: {
    color: '#2196F3',
    fontWeight: '500',
  },
  taskTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginRight: 4,
    marginTop: 2,
  },
  taskTagText: {
    fontSize: 10,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  modalLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  inputField: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
  },
  weekdayContainer: {
    marginBottom: 12,
  },
  weekdayContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  weekdayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  weekdayButtonSelected: {
    backgroundColor: '#2196F3',
  },
  weekdayButtonText: {
    fontSize: 14,
    color: '#666',
  },
  weekdayButtonTextSelected: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 12,
  },
  timeField: {
    flex: 1,
    marginRight: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorButtonSelected: {
    borderWidth: 2,
    borderColor: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  taskStatusButton: {
    marginRight: 12,
  },
  taskStatusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskStatusIndicatorCompleted: {
    backgroundColor: '#2196F3',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderContainer: {
    marginBottom: 16,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderToggle: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderToggleActive: {
    backgroundColor: '#2196F3',
  },
  reminderToggleText: {
    color: 'transparent',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderToggleTextActive: {
    color: '#fff',
  },
  reminderOffsetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderOffsetInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  smartRecommendButton: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  smartRecommendText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  selectedWeekday: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  selectedWeekdayText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
}); 