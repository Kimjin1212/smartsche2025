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
import { format, parse, addHours } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { WeeklySchedule } from '../components/Schedule/WeeklySchedule';
import NotificationService from '../services/notification';
import { NLPService } from '../services/nlpService';
import QuickNoteInput from '../components/Schedule/QuickNoteInput';

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
  reminderEnabled?: boolean;
  reminderOffsetMinutes?: number;
  version: number;
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
    date: 'Date',
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
    reminder: 'Reminder',
    reminderOffset: 'Remind me before',
    minutes: 'minutes',
    quickNote: 'Quick Note',
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
    taskDateTime: '日期和时间',
    save: '保存',
    cancel: '取消',
    taskTitle: '标题',
    taskLocation: '地点',
    weekday: '星期',
    date: '日期',
    startTime: '开始时间',
    endTime: '结束时间',
    color: '颜色',
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
    continue: '继续保存',
    sync: '同步',
    syncing: '同步中...',
    syncSuccess: '同步完成',
    syncFailed: '同步失败',
    reminder: '提醒',
    reminderOffset: '提前提醒',
    minutes: '分钟',
    quickNote: '随手记',
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
    date: '日付',
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
    reminder: 'リマインダー',
    reminderOffset: '事前通知',
    minutes: '分',
    quickNote: 'クイックメモ',
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
    date: '날짜',
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
    reminder: '알림',
    reminderOffset: '미리 알림',
    minutes: '분',
    quickNote: '빠른 메모',
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
  // 直接显示任务的截止时间（设定时间）
  return format(date, 'yyyy-MM-dd HH:mm');
};

// 添加自然语言处理相关的类型定义
interface ParsedSchedule {
  content: string;
  dateTime: Date | null;
  location?: string;
}

// 添加数字映射类型
interface NumberMapping {
  [key: string]: number;
}

interface TimePatterns {
  today: RegExp;
  tomorrow: RegExp;
  dayAfterTomorrow: RegExp;
  morning: RegExp;
  afternoon: RegExp;
  evening: RegExp;
  time: RegExp;
  weekdays: RegExp;
  numbers: NumberMapping;
}

interface LanguagePatterns {
  [key: string]: TimePatterns;
}

const timePatterns: LanguagePatterns = {
  zh: {
    today: /今天|今日/,
    tomorrow: /明天|明日/,
    dayAfterTomorrow: /后天|後日/,
    morning: /早上|上午/,
    afternoon: /下午|午后/,
    evening: /晚上|夜晚/,
    time: /(\d{1,2})[点點時:：](\d{0,2})?|[一二三四五六七八九十]{1,2}[点點時]/,
    weekdays: /周[一二三四五六日]|星期[一二三四五六日]/,
    numbers: {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '十一': 11, '十二': 12
    }
  },
  ja: {
    today: /今日|本日/,
    tomorrow: /明日/,
    dayAfterTomorrow: /明後日/,
    morning: /朝|午前/,
    afternoon: /午後/,
    evening: /夜|夕方/,
    time: /(\d{1,2})時(\d{0,2})?分?|[一二三四五六七八九十]{1,2}時/,
    weekdays: /[月火水木金土日]曜日/,
    numbers: {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '十一': 11, '十二': 12
    }
  },
  en: {
    today: /today/i,
    tomorrow: /tomorrow/i,
    dayAfterTomorrow: /day after tomorrow/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening|night/i,
    time: /(\d{1,2}):?(\d{0,2})?\s*(am|pm)?|([0-9a-z]+)\s*(am|pm)/i,
    weekdays: /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
    numbers: {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
      'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12
    }
  },
  ko: {
    today: /오늘/,
    tomorrow: /내일/,
    dayAfterTomorrow: /모레/,
    morning: /아침|오전/,
    afternoon: /오후/,
    evening: /저녁|밤/,
    time: /(\d{1,2})시\s?(\d{0,2})?분?|[일이삼사오육칠팔구십]{1,2}시/,
    weekdays: /[월화수목금토일]요일/,
    numbers: {
      '일': 1, '이': 2, '삼': 3, '사': 4, '오': 5, '육': 6, '칠': 7, '팔': 8, '구': 9, '십': 10,
      '십일': 11, '십이': 12
    }
  }
};

/**
 * 从任务内容中提取核心显示内容
 * 该函数会去除常见的时间和日期表达，只保留任务的实际内容，并保护常用词组不被拆分
 */
const extractTaskDisplayContent = (content: string): string => {
  if (!content) return '';
  
  // 保护常见词组，防止被错误拆分
  const commonPhrases = [
    'business class', 'english class', 'math class', 'science class', 'yoga class',
    'flight number', 'train number', 'bus number', 'ticket number', 
    'high school', 'junior high', 'middle school', 'elementary school',
    'piano lesson', 'guitar lesson', 'music lesson', 'tennis lesson',
    'team meeting', 'staff meeting', 'board meeting', 'group meeting',
    'job interview', 'doctor appointment', 'dentist appointment',
    'family dinner', 'lunch meeting', 'coffee break',
    'grocery shopping', 'online shopping', 'clothes shopping',
    'birthday party', 'wedding ceremony', 'office party',
    'hotel reservation', 'restaurant reservation', 'flight reservation',
    'swimming pool', 'tennis court', 'basketball court', 'football field',
    'bus station', 'train station', 'subway station', 'airport terminal',
    // Korean common phrases
    '비즈니스 클래스', '영어 수업', '수학 수업', '과학 수업', '요가 수업',
    '항공편 번호', '열차 번호', '버스 번호', '티켓 번호',
    '고등학교', '중학교', '초등학교',
    '피아노 레슨', '기타 레슨', '음악 레슨', '테니스 레슨',
    '팀 회의', '직원 회의', '이사회', '그룹 미팅',
    '면접', '병원 예약', '치과 예약',
    '가족 저녁', '점심 회의', '커피 브레이크',
    '식료품 쇼핑', '온라인 쇼핑', '의류 쇼핑',
    '생일 파티', '결혼식', '회사 파티',
    '호텔 예약', '식당 예약', '항공편 예약',
    '수영장', '테니스 코트', '농구 코트', '축구장',
    '버스 정류장', '기차역', '지하철역', '공항 터미널'
  ];
  
  // 临时替换常见词组为标记，以防止它们被拆分
  let tempContent = content.toLowerCase();
  const phraseReplacements = new Map<string, string>();
  
  commonPhrases.forEach((phrase, i) => {
    const marker = `__PHRASE${i}__`;
    const regex = new RegExp('\\b' + phrase.replace(/\s+/g, '\\s+') + '\\b', 'gi');
    
    if (regex.test(tempContent)) {
      tempContent = tempContent.replace(regex, marker);
      phraseReplacements.set(marker, phrase);
    }
  });
  
  // 移除日期和时间表达式
  const patterns = [
    // 日期相关
    /今天|今日|明天|明日|后天|下周|下下周|本周|这周/g,
    /星期[一二三四五六日天]|周[一二三四五六日天]|礼拜[一二三四五六日天]/g,
    /\b(today|tomorrow|yesterday|next\s*week|last\s*week|this\s*week)\b/gi,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(mon|tue|wed|thu|fri|sat|sun)\b/gi,
    
    // 时间相关
    /早上|上午|中午|下午|晚上|凌晨|深夜|傍晚|黄昏/g,
    /([0-9０-９一二三四五六七八九十]+)[点點时時]([0-9０-９半刻]+)?[分]?/g,
    /([0-9]{1,2})[:.：]([0-9]{2})(\s*(am|pm))?/gi,
    /\bat\s*\d+(\s*(am|pm))?/gi,
    /\b(morning|afternoon|evening|night|noon|midnight)\b/gi,
    
    // 韩文日期和时间相关
    /오늘|내일|모레/g,
    /[월화수목금토일]요일/g,
    /아침|오전|오후|저녁|밤/g,
    /(\d{1,2})시\s?(\d{0,2})?분?/g,
    
    // 介词和连接词
    /\b(on|at|in|next|this|about|from|to|by|until)\b/gi,
    
    // 日期数字和序数词
    /\b\d{1,2}(st|nd|rd|th)?\b/g,
    
    // 月份名称
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi,
    
    // 日期格式
    /\b\d{1,4}[\/-]\d{1,2}([\/-]\d{1,4})?\b/g
  ];
  
  // 应用所有模式替换为空格
  patterns.forEach(pattern => {
    tempContent = tempContent.replace(pattern, ' ');
  });
  
  // 去除任务前缀词
  const prefixPatterns = [
    /^(需要|记得|别忘了|别忘|提醒|记住|安排|完成|做|办|处理|准备|参加|开始|结束|任务:|提醒:|备忘:|安排:)/g,
    /^(need to|have to|must|should|going to|will|remember to|don't forget to|to|task:|assignment:|reminder:)/gi,
    /^(해야 할|기억|잊지 마|상기시켜|일정|완료|준비|참가|시작|끝|작업:|알림:|메모:|일정:)/gi
  ];
  
  prefixPatterns.forEach(pattern => {
    tempContent = tempContent.replace(pattern, '');
  });
  
  // 清理多余空格
  tempContent = tempContent.replace(/\s+/g, ' ').trim();
  
  // 恢复受保护词组
  phraseReplacements.forEach((phrase, marker) => {
    tempContent = tempContent.replace(marker, phrase);
  });
  
  // 再次清理空格
  tempContent = tempContent.replace(/\s+/g, ' ').trim();
  
  // 如果提取后的内容为空，则尝试从原始内容提取关键词
  if (!tempContent) {
    // 按空格分割得到所有单词
    const words = content.trim().split(/\s+/);
    
    // 过滤掉短词和数字
    const keyWords = words.filter(word => 
      word.length > 3 && 
      !/^\d+$/.test(word) && 
      !patterns.some(pattern => pattern.test(word.toLowerCase()))
    );
    
    // 如果有关键词，返回第一个；否则返回原始内容的第一个单词
    if (keyWords.length > 0) {
      return keyWords[0].charAt(0).toUpperCase() + keyWords[0].slice(1).toLowerCase();
    } else if (words.length > 0) {
      return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    }
    
    return content;
  }
  
  // 首字母大写
  return tempContent.charAt(0).toUpperCase() + tempContent.slice(1);
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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState('10');
  const [isQuickNoteModalVisible, setIsQuickNoteModalVisible] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  // 存储NLP解析出的日期
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    setShowDatePicker(false);
    setSelectedDate(currentDate);
    
    // 根据选择的日期更新星期几
    const weekday = currentDate.getDay(); // 0-6, 0是周日
    const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
    setSelectedWeekday(adjustedWeekday);
  };

  // 修改添加任务的函数
  const handleAddTask = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId || !newTaskTitle.trim()) {
        Alert.alert('错误', '请输入任务标题');
        return;
      }

      // 验证时间格式
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        Alert.alert('错误', '请输入正确的时间格式 (HH:MM)');
        return;
      }

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
          `${t.conflictWith || '与以下任务时间冲突'}: ${conflictingTask.content}`,
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
    } catch (error: unknown) {
      console.error('Error in handleAddTask:', error);
      Alert.alert('错误', '添加任务失败，请重试');
    }
  };

  const addTaskToFirestore = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!newTaskTitle.trim()) {
        Alert.alert('错误', '请输入任务标题');
        return;
      }

      // 验证时间格式
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        Alert.alert('错误', '请输入正确的时间格式 (HH:MM)');
        return;
      }

      // 解析时间
      const [startHour, startMinute] = startTime.split(':').map(Number);
      
      // 使用NLP解析的日期（如果有）或用户选择的日期
      let taskDate: Date;
      if (parsedDate) {
        // 使用NLP解析的日期，但更新小时和分钟
        taskDate = new Date(parsedDate);
        taskDate.setHours(startHour, startMinute, 0);
        console.log('使用NLP解析的日期：', taskDate.toString());
      } else {
        // 使用用户选择的日期和时间
        taskDate = new Date(selectedDate);
        taskDate.setHours(startHour, startMinute, 0);
        console.log('使用用户选择的日期：', taskDate.toString());
      }

      // 确保所有必需字段都有值
      const newTask = {
        content: newTaskTitle.trim(),
        location: newTaskLocation.trim() || '',  // 如果为空则使用空字符串
        weekday: selectedWeekday,
        dateTime: firestore.Timestamp.fromDate(taskDate),
        status: 'pending' as const,
        userId: userId,
        color: selectedColor || colors[0],  // 如果未选择则使用默认颜色
        reminderEnabled: Boolean(reminderEnabled),  // 确保是布尔值
        reminderOffsetMinutes: reminderEnabled ? Math.max(1, parseInt(reminderOffsetMinutes) || 10) : 0,  // 确保是数字
        version: 1
      };

      const docRef = firestore().collection('tasks').doc();
      await firestore().runTransaction(async transaction => {
        transaction.set(docRef, newTask);
      });

      if (reminderEnabled) {
        await NotificationService.scheduleTaskReminder({
          ...newTask,
          id: docRef.id
        });
      }

      // 重置表单
      setNewTaskTitle('');
      setNewTaskLocation('');
      setSelectedWeekday(0);
      setStartTime('08:00');
      setEndTime('09:00');
      setSelectedColor(colors[0]);
      setReminderEnabled(false);
      setReminderOffsetMinutes('10');
      setParsedDate(null); // 清除保存的日期
      setSelectedDate(new Date()); // 重置选择的日期
      setIsAddModalVisible(false);

      Alert.alert('成功', '任务已添加');
    } catch (error: unknown) {
      console.error('Error in addTaskToFirestore:', error);
      if (error instanceof Error) {
        Alert.alert('错误', `添加任务失败: ${error.message}`);
      } else {
        Alert.alert('错误', '添加任务失败，请检查输入是否正确');
      }
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
      setSelectedWeekday(adjustedWeekday);
    } else if (patterns.dayAfterTomorrow.test(text)) {
      // 设置为后天的日期
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(now.getDate() + 2);
      dateTime = dayAfterTomorrow;
      // 获取后天的星期几 (0-6, 0表示星期日)
      const weekday = dayAfterTomorrow.getDay();
      // 转换为我们的格式 (0-6, 0表示周一)
      const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
      setSelectedWeekday(adjustedWeekday);
    } else {
      // 如果是今天，使用今天的星期几
      const weekday = now.getDay();
      const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
      setSelectedWeekday(adjustedWeekday);
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
      console.log('收到NLP解析结果 - 日期:', date);
      console.log('收到NLP解析结果 - 内容:', content);
      
      // 设置新任务的值
      setNewTaskTitle(content);
      
      if (date) {
        // 保存解析出的完整日期，用于后续创建任务
        setParsedDate(date);
        setSelectedDate(date); // 同时更新选择的日期
        
        // 记录原始时间进行调试
        console.log('原始日期时间字符串:', date.toString());
        console.log('原始小时:', date.getHours());
        console.log('原始分钟:', date.getMinutes());
        
        // 设置时间 (确保24小时制格式正确)
        setStartTime(format(date, 'HH:mm'));
        
        // 设置结束时间为开始时间后一小时
        const endDate = new Date(date);
        endDate.setHours(date.getHours() + 1);
        setEndTime(format(endDate, 'HH:mm'));
        
        console.log('设置开始时间:', format(date, 'HH:mm'));
        console.log('设置结束时间:', format(endDate, 'HH:mm'));
        
        // 获取星期几 (0-6, 0是周日)
        const weekday = date.getDay();
        console.log('原始星期几索引 (0=周日):', weekday);
        
        // 调整星期几索引，使星期一为0，星期日为6
        const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
        console.log('调整后的星期几索引 (0=周一):', adjustedWeekday);
        
        setSelectedWeekday(adjustedWeekday);
      } else {
        // 如果没有日期，清除保存的日期
        setParsedDate(null);
      }
      
      // 打开任务编辑模态框
      setIsAddModalVisible(true);
    } catch (error) {
      // Convert unknown error to string or just show generic message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert('错误', errorMessage);
      setParsedDate(null);
      return { date: new Date(), content: content, location: "" };
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

            {/* 添加日期选择器 */}
            <Text style={styles.modalLabel}>{t.date}</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerButtonText}>
                {format(selectedDate, 'yyyy-MM-dd')}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

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

            <View style={styles.reminderContainer}>
              <Text style={styles.modalLabel}>{t.reminder}</Text>
              <View style={styles.reminderRow}>
                <TouchableOpacity
                  style={[
                    styles.reminderToggle,
                    reminderEnabled && styles.reminderToggleActive
                  ]}
                  onPress={() => setReminderEnabled(!reminderEnabled)}
                >
                  <Text style={[
                    styles.reminderToggleText,
                    reminderEnabled && styles.reminderToggleTextActive
                  ]}>
                    {reminderEnabled ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
                {reminderEnabled && (
                  <View style={styles.reminderOffsetContainer}>
                    <Text style={styles.modalLabel}>{t.reminderOffset}</Text>
                    <TextInput
                      style={styles.reminderOffsetInput}
                      value={reminderOffsetMinutes}
                      onChangeText={setReminderOffsetMinutes}
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
  datePickerButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
}); 