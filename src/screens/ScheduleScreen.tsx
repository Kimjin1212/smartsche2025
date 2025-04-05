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
  userId: string;
  content: string;
  dateTime: FirebaseFirestoreTypes.Timestamp;
  location?: string;
  status: 'pending' | 'completed';
  weekday: number;
  color: string;
}

type Language = 'en' | 'zh' | 'ja' | 'ko';

type FilterType = 'all' | 'pending' | 'completed' | 'today';

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
    addNewTask: 'Add New Task',
    taskContent: 'Task Content',
    taskDateTime: 'Date & Time',
    save: 'Save',
    cancel: 'Cancel',
    taskTitle: 'Title',
    taskLocation: 'Location',
    weekday: 'Weekday',
    startTime: 'Start Time',
    endTime: 'End Time',
    color: 'Color',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    delete: 'Delete',
    timeConflict: 'Time Conflict',
    conflictWith: 'Conflicts with task',
    continue: 'Continue Anyway',
    sync: 'Sync',
    syncing: 'Syncing...',
    syncSuccess: 'Sync completed',
    syncFailed: 'Sync failed',
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
    addNewTask: '添加新任务',
    taskContent: '任务内容',
    taskDateTime: '日期时间',
    save: '保存',
    cancel: '取消',
    taskTitle: '标题',
    taskLocation: '地点',
    weekday: '星期',
    startTime: '开始时间',
    endTime: '结束时间',
    color: 'Color',
    monday: '周一',
    tuesday: '周二',
    wednesday: '周三',
    thursday: '周四',
    friday: '周五',
    saturday: '周六',
    sunday: '周日',
    delete: '删除',
    timeConflict: '时间冲突',
    conflictWith: '与以下任务时间冲突',
    continue: '继续添加',
    sync: '同步',
    syncing: '同步中...',
    syncSuccess: '同步完成',
    syncFailed: '同步失败',
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
    addNewTask: '新規タスク',
    taskContent: 'タスク内容',
    taskDateTime: '日時',
    save: '保存',
    cancel: 'キャンセル',
    taskTitle: 'タイトル',
    taskLocation: '場所',
    weekday: '曜日',
    startTime: '開始時間',
    endTime: '終了時間',
    color: 'カラー',
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
    delete: '削除',
    timeConflict: '時間の重複',
    conflictWith: '次のタスクと時間が重複しています',
    continue: '続行',
    sync: '同期',
    syncing: '同期中...',
    syncSuccess: '同期完了',
    syncFailed: '同期失敗',
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
    addNewTask: '새 할일',
    taskContent: '할일 내용',
    taskDateTime: '날짜 및 시간',
    save: '저장',
    cancel: '취소',
    taskTitle: '제목',
    taskLocation: '위치',
    weekday: '요일',
    startTime: '시작 시간',
    endTime: '종료 시간',
    color: '색상',
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일',
    delete: '삭제',
    timeConflict: '시간 중복',
    conflictWith: '다음 작업과 시간이 중복됩니다',
    continue: '계속하기',
    sync: '동기화',
    syncing: '동기화 중...',
    syncSuccess: '동기화 완료',
    syncFailed: '동기화 실패',
  },
};

const getFilterLabel = (filter: FilterType, t: any) => {
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
      return '';
  }
};

// 添加星期数组
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const colors = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#795548'];

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

// 添加时间冲突检查函数
const checkTimeConflict = (
  weekday: number,
  startTime: string,
  endTime: string,
  existingTasks: Task[],
  excludeTaskId?: string
) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const newStartMinutes = startHour * 60 + startMinute;
  const newEndMinutes = endHour * 60 + endMinute;

  const conflictingTask = existingTasks.find(task => {
    if (excludeTaskId && task.id === excludeTaskId) return false;
    if (task.weekday !== weekday) return false;

    const taskStartTime = task.dateTime.toDate();
    const taskEndTime = task.dateTime.toDate();
    const taskStartMinutes = taskStartTime.getHours() * 60 + taskStartTime.getMinutes();
    const taskEndMinutes = taskEndTime.getHours() * 60 + taskEndTime.getMinutes();

    return (
      (newStartMinutes >= taskStartMinutes && newStartMinutes < taskEndMinutes) ||
      (newEndMinutes > taskStartMinutes && newEndMinutes <= taskEndMinutes) ||
      (newStartMinutes <= taskStartMinutes && newEndMinutes >= taskEndMinutes)
    );
  });

  return conflictingTask;
};

const formatTaskTime = (task: Task) => {
  if (!task.dateTime) return '';
  const date = task.dateTime.toDate();
  return format(date, 'yyyy-MM-dd HH:mm');
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
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskDateTime, setNewTaskDateTime] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [selectedWeekday, setSelectedWeekday] = useState(0); // 默认选中周一
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isSyncing, setIsSyncing] = useState(false);

  const t = translations[language];

  const currentUser = auth().currentUser;
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '';

  // 获取任务数据
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    // 不再使用实时监听，改为普通获取
    const fetchTasks = async () => {
      try {
        const snapshot = await firestore()
          .collection('tasks')
          .where('userId', '==', userId)
          .get();
        
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
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

  // 修改添加任务的函数
  const handleAddTask = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId || !newTaskTitle.trim()) return;

      // 检查时间冲突
      const conflictingTask = checkTimeConflict(
        selectedWeekday,
        startTime,
        endTime,
        tasks
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
              text: t.continue || '继续添加',
              onPress: async () => {
                await addTaskToFirestore();
              }
            }
          ]
        );
        return;
      }

      await addTaskToFirestore();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    }
  };

  // 将原来的添加任务逻辑抽取为单独的函数
  const addTaskToFirestore = async () => {
    const userId = auth().currentUser?.uid;
    if (!userId || !newTaskTitle.trim()) return;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const taskDate = new Date();
    taskDate.setHours(startHour, startMinute, 0);

    const taskEndDate = new Date();
    taskEndDate.setHours(endHour, endMinute, 0);

    await firestore().collection('tasks').add({
      content: newTaskTitle.trim(),
      location: newTaskLocation.trim(),
      weekday: selectedWeekday,
      dateTime: firestore.Timestamp.fromDate(taskDate),
      status: 'pending',
      userId: userId,
    });

    setNewTaskTitle('');
    setNewTaskLocation('');
    setSelectedWeekday(0);
    setStartTime('08:00');
    setEndTime('09:00');
    setSelectedColor(colors[0]);
    setIsAddModalVisible(false);
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

  // 将原来的更新任务逻辑抽取为单独的函数
  const updateTaskInFirestore = async (task: Task) => {
    try {
      await firestore()
        .collection('tasks')
        .doc(task.id)
        .update(task);
      setIsEditModalVisible(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  };

  // 修改同步函数
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      // 从服务器获取最新任务
      const serverSnapshot = await firestore()
        .collection('tasks')
        .where('userId', '==', userId)
        .get();
      
      const serverTasks = serverSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      // 直接使用服务器数据更新本地状态
      setTasks(serverTasks);
      Alert.alert(t.syncSuccess);
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(t.syncFailed);
    } finally {
      setIsSyncing(false);
    }
  };

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
                    {task.content}
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

      {/* 添加任务模态窗口 */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.addNewTask}</Text>
            
            <TextInput
              style={styles.modalInputField}
              placeholder={t.taskTitle}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="none"
              autoComplete="off"
            />

            <TextInput
              style={styles.modalInputField}
              placeholder={t.taskLocation}
              value={newTaskLocation}
              onChangeText={setNewTaskLocation}
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
                    selectedWeekday === index && styles.weekdayButtonSelected
                  ]}
                  onPress={() => setSelectedWeekday(index)}
                >
                  <Text style={[
                    styles.weekdayButtonText,
                    selectedWeekday === index && styles.weekdayButtonTextSelected
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
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.modalLabel}>{t.endTime}</Text>
                <TextInput
                  style={styles.timeInput}
                  value={endTime}
                  onChangeText={setEndTime}
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
                    selectedColor === color && styles.colorButtonSelected
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddTask}
              >
                <Text style={styles.saveButtonText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                      await firestore()
                        .collection('tasks')
                        .doc(editingTask.id)
                        .update(editingTask);
                      setIsEditModalVisible(false);
                      setEditingTask(null);
                    } catch (error) {
                      console.error('Error updating task:', error);
                      Alert.alert('Error', 'Failed to update task. Please try again.');
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
  },
  modalLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  weekdayContainer: {
    marginBottom: 16,
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
}); 