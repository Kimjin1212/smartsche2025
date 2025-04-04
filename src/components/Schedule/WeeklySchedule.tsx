import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type WeeklyScheduleNavigationProp = StackNavigationProp<RootStackParamList, 'WeeklySchedule'>;
type WeeklyScheduleRouteProp = RouteProp<RootStackParamList, 'WeeklySchedule'>;

type Language = 'en' | 'zh' | 'ja' | 'ko';

interface Translations {
  weeklySchedule: string;
  time: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  addRoutine: string;
  editRoutine: string;
  cancel: string;
  save: string;
  delete: string;
  title: string;
  location: string;
  day: string;
  startTime: string;
  endTime: string;
  deleteConfirm: string;
  deleteMessage: string;
  yes: string;
  no: string;
  routineSaved: string;
  routineDeleted: string;
  back: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

const translations: Record<Language, Translations> = {
  en: {
    weeklySchedule: 'Weekly Schedule',
    time: 'Time',
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
    addRoutine: 'Add Routine',
    editRoutine: 'Edit Routine',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    title: 'Title',
    location: 'Location',
    day: 'Day',
    startTime: 'Start Time',
    endTime: 'End Time',
    deleteConfirm: 'Delete Routine',
    deleteMessage: 'Are you sure you want to delete this routine?',
    yes: 'Yes',
    no: 'No',
    routineSaved: 'Routine saved successfully',
    routineDeleted: 'Routine deleted successfully',
    back: 'Back',
    mon: 'MON',
    tue: 'TUE',
    wed: 'WED',
    thu: 'THU',
    fri: 'FRI',
    sat: 'SAT',
    sun: 'SUN',
  },
  zh: {
    weeklySchedule: '周日程表',
    time: '时间',
    monday: '周一',
    tuesday: '周二',
    wednesday: '周三',
    thursday: '周四',
    friday: '周五',
    saturday: '周六',
    sunday: '周日',
    addRoutine: '添加日程',
    editRoutine: '编辑日程',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    title: '标题',
    location: '地点',
    day: '星期',
    startTime: '开始时间',
    endTime: '结束时间',
    deleteConfirm: '删除日程',
    deleteMessage: '确定要删除此日程吗？',
    yes: '是',
    no: '否',
    routineSaved: '日程保存成功',
    routineDeleted: '日程删除成功',
    back: '返回',
    mon: '周一',
    tue: '周二',
    wed: '周三',
    thu: '周四',
    fri: '周五',
    sat: '周六',
    sun: '周日',
  },
  ja: {
    weeklySchedule: '週間スケジュール',
    time: '時間',
    monday: '月',
    tuesday: '火',
    wednesday: '水',
    thursday: '木',
    friday: '金',
    saturday: '土',
    sunday: '日',
    addRoutine: '定期予定を追加',
    editRoutine: '定期予定を編集',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    title: 'タイトル',
    location: '場所',
    day: '曜日',
    startTime: '開始時間',
    endTime: '終了時間',
    deleteConfirm: '定期予定の削除',
    deleteMessage: 'この定期予定を削除してもよろしいですか？',
    yes: 'はい',
    no: 'いいえ',
    routineSaved: '定期予定が保存されました',
    routineDeleted: '定期予定が削除されました',
    back: '戻る',
    mon: '月',
    tue: '火',
    wed: '水',
    thu: '木',
    fri: '金',
    sat: '土',
    sun: '日',
  },
  ko: {
    weeklySchedule: '주간 일정',
    time: '시간',
    monday: '월',
    tuesday: '화',
    wednesday: '수',
    thursday: '목',
    friday: '금',
    saturday: '토',
    sunday: '일',
    addRoutine: '일과 추가',
    editRoutine: '일과 편집',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    title: '제목',
    location: '위치',
    day: '요일',
    startTime: '시작 시간',
    endTime: '종료 시간',
    deleteConfirm: '일과 삭제',
    deleteMessage: '이 일과를 삭제하시겠습니까?',
    yes: '예',
    no: '아니오',
    routineSaved: '일과가 저장되었습니다',
    routineDeleted: '일과가 삭제되었습니다',
    back: '뒤로',
    mon: '월',
    tue: '화',
    wed: '수',
    thu: '목',
    fri: '금',
    sat: '토',
    sun: '일',
  },
};

// 日程表的时间段设置，可以根据需要调整
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', 
  '18:00', '19:00', '20:00', '21:00'
];

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface RoutineItem {
  id?: string;
  userId: string;
  title: string;
  location?: string;
  day: string;
  startTime: string;
  endTime: string;
  isRoutine: boolean;
  color?: string;
}

interface TaskItem {
  id: string;
  userId: string;
  content: string;
  dateTime: FirebaseFirestoreTypes.Timestamp;
  location?: string;
  day?: string;
  startTime?: string;
  isRoutine: boolean;
  status?: 'pending' | 'completed';
}

interface WeeklyScheduleProps {
  route: WeeklyScheduleRouteProp;
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ route }) => {
  const navigation = useNavigation<WeeklyScheduleNavigationProp>();
  const { language } = route.params;
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineItem | null>(null);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineLocation, setRoutineLocation] = useState('');
  const [routineDay, setRoutineDay] = useState('monday');
  const [routineStartTime, setRoutineStartTime] = useState('08:00');
  const [routineEndTime, setRoutineEndTime] = useState('09:00');
  const [routineColor, setRoutineColor] = useState('#4CAF50');
  const [message, setMessage] = useState<string | null>(null);

  const t = translations[language as Language] || translations.en;

  // 获取日程和任务数据
  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;

    // 获取固定日程
    const unsubscribeRoutines = firestore()
      .collection('routines')
      .where('userId', '==', userId)
      .onSnapshot(snapshot => {
        const routinesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as RoutineItem[];
        setRoutines(routinesData);
      });

    // 获取任务 - 简化查询避免需要复合索引
    const unsubscribeTasks = firestore()
      .collection('tasks')
      .where('userId', '==', userId)
      .onSnapshot(snapshot => {
        if (!snapshot || !snapshot.docs) {
          console.error('Invalid snapshot or no docs property', snapshot);
          return;
        }

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);

        // 在JS端过滤日期范围，而不是在查询中进行
        const tasksData = snapshot.docs
          .map(doc => {
            const data = doc.data();
            if (!data.dateTime) return null;
            
            const date = data.dateTime.toDate();
            
            // 检查是否在当前周内
            if (date < startOfWeek || date > endOfWeek) return null;
            
            // 计算星期几 (0 = Sunday, 1 = Monday, etc.)
            const dayIndex = date.getDay();
            const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // 调整为我们的星期格式
            
            // 格式化时间为 HH:MM
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const startTime = `${hours}:${minutes}`;
            
            return {
              id: doc.id,
              ...data,
              day: dayName,
              startTime: startTime,
              isRoutine: false,
            };
          })
          .filter(task => task !== null) as TaskItem[];
        
        setTasks(tasksData);
      }, error => {
        console.error('Error fetching tasks:', error);
      });

    return () => {
      unsubscribeRoutines();
      unsubscribeTasks();
    };
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleAddRoutine = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const handleEditRoutine = (routine: RoutineItem) => {
    setEditingRoutine(routine);
    setRoutineTitle(routine.title);
    setRoutineLocation(routine.location || '');
    setRoutineDay(routine.day);
    setRoutineStartTime(routine.startTime);
    setRoutineEndTime(routine.endTime);
    setRoutineColor(routine.color || '#4CAF50');
    setIsModalVisible(true);
  };

  const handleDeleteRoutine = () => {
    if (!editingRoutine?.id) return;

    Alert.alert(
      t.deleteConfirm,
      t.deleteMessage,
      [
        {
          text: t.no,
          style: 'cancel',
        },
        {
          text: t.yes,
          onPress: async () => {
            try {
              await firestore().collection('routines').doc(editingRoutine.id).delete();
              setIsModalVisible(false);
              resetForm();
              showMessage(t.routineDeleted);
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const resetForm = () => {
    setEditingRoutine(null);
    setRoutineTitle('');
    setRoutineLocation('');
    setRoutineDay('monday');
    setRoutineStartTime('08:00');
    setRoutineEndTime('09:00');
    setRoutineColor('#4CAF50');
  };

  const handleSaveRoutine = async () => {
    if (!routineTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const userId = auth().currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    try {
      const routineData: RoutineItem = {
        userId,
        title: routineTitle.trim(),
        location: routineLocation.trim() || '',
        day: routineDay,
        startTime: routineStartTime,
        endTime: routineEndTime,
        isRoutine: true,
        color: routineColor,
      };

      if (editingRoutine?.id) {
        await firestore().collection('routines').doc(editingRoutine.id).update(routineData);
      } else {
        await firestore().collection('routines').add(routineData);
      }
      
      setIsModalVisible(false);
      resetForm();
      showMessage(t.routineSaved);
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine');
    }
  };

  // 时间转换为数字，用于排序和比较
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 检查事件是否在时间段内
  const isInTimeSlot = (event: { startTime: string; endTime?: string }, timeSlot: string) => {
    const eventStart = timeToMinutes(event.startTime);
    const slotStart = timeToMinutes(timeSlot);
    const nextSlotStart = slotStart + 60; // 一小时后
    
    return eventStart >= slotStart && eventStart < nextSlotStart;
  };

  // 根据开始时间计算高度位置
  const calculateTopPosition = (startTime: string, slotTime: string) => {
    const eventMinutes = timeToMinutes(startTime);
    const slotMinutes = timeToMinutes(slotTime);
    const minutesDiff = eventMinutes - slotMinutes;
    
    // 60分钟对应格子的高度
    const cellHeight = 60;
    return (minutesDiff / 60) * cellHeight;
  };

  // 根据持续时间计算高度
  const calculateHeight = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    
    // 60分钟对应格子的高度
    const cellHeight = 60;
    return (duration / 60) * cellHeight;
  };

  const getEventsForTimeAndDay = (timeSlot: string, day: string) => {
    // 获取固定日程
    const dayRoutines = routines.filter(
      routine => routine.day === day && isInTimeSlot(routine, timeSlot)
    );
    
    // 获取临时任务
    const dayTasks = tasks.filter(task => {
      if (!task.day || !task.startTime) return false;
      
      return task.day === day && isInTimeSlot({
        startTime: task.startTime,
        endTime: task.startTime // 对于任务，结束时间与开始时间相同
      }, timeSlot);
    });
    
    return [...dayRoutines, ...dayTasks];
  };

  const renderTimeSlots = () => {
    return (
      <View style={styles.timeColumn}>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>{t.time}</Text>
        </View>
        {timeSlots.map(time => (
          <View key={time} style={styles.timeCell}>
            <Text style={styles.timeText}>{time}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDayColumn = (day: string, index: number) => {
    const dayKey = day as keyof Translations;
    const dayTitle = t[dayKey];
    
    return (
      <View style={styles.dayColumn} key={day}>
        <View style={styles.headerCell}>
          <Text style={styles.headerText}>{dayTitle}</Text>
        </View>
        
        {timeSlots.map((timeSlot, slotIndex) => {
          const events = getEventsForTimeAndDay(timeSlot, day);
          
          return (
            <View key={`${day}-${timeSlot}`} style={styles.scheduleCell}>
              {events.map((event, eventIndex) => {
                const isRoutineEvent = event.isRoutine;
                const routineEvent = event as RoutineItem;
                const taskEvent = event as TaskItem;
                
                const eventColor = isRoutineEvent ? routineEvent.color || '#4CAF50' : '#2196F3';
                const eventStartTime = isRoutineEvent ? routineEvent.startTime : taskEvent.startTime || timeSlot;
                const eventEndTime = isRoutineEvent ? routineEvent.endTime : eventStartTime;
                
                const topPosition = calculateTopPosition(eventStartTime, timeSlot);
                const height = isRoutineEvent ? calculateHeight(eventStartTime, eventEndTime) : 40;
                
                return (
                  <TouchableOpacity
                    key={`event-${event.id}-${eventIndex}`}
                    style={[
                      styles.eventItem,
                      {
                        backgroundColor: eventColor,
                        top: topPosition,
                        height: height,
                      },
                    ]}
                    onPress={() => {
                      if (isRoutineEvent) {
                        handleEditRoutine(routineEvent);
                      }
                    }}
                  >
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {isRoutineEvent ? routineEvent.title : taskEvent.content}
                    </Text>
                    {event.location && (
                      <Text style={styles.eventLocation} numberOfLines={1}>
                        📍 {event.location}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.weeklySchedule}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddRoutine}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      <ScrollView horizontal={true} style={styles.horizontalScroll}>
        <ScrollView>
          <View style={styles.scheduleContainer}>
            {renderTimeSlots()}
            {days.map((day, index) => renderDayColumn(day, index))}
          </View>
        </ScrollView>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingRoutine ? t.editRoutine : t.addRoutine}
            </Text>

            <Text style={styles.inputLabel}>{t.title}</Text>
            <TextInput
              style={styles.input}
              value={routineTitle}
              onChangeText={setRoutineTitle}
              placeholder={t.title}
            />

            <Text style={styles.inputLabel}>{t.location}</Text>
            <TextInput
              style={styles.input}
              value={routineLocation}
              onChangeText={setRoutineLocation}
              placeholder={t.location}
            />

            <Text style={styles.inputLabel}>{t.day}</Text>
            <View style={styles.dayButtons}>
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    routineDay === day && styles.selectedDayButton,
                  ]}
                  onPress={() => setRoutineDay(day)}
                >
                  <Text 
                    style={[
                      styles.dayButtonText,
                      routineDay === day && styles.selectedDayButtonText,
                    ]}
                  >
                    {t[day as keyof typeof t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeInputsContainer}>
              <View style={styles.timeInputWrapper}>
                <Text style={styles.inputLabel}>{t.startTime}</Text>
                <TextInput
                  style={styles.timeInput}
                  value={routineStartTime}
                  onChangeText={setRoutineStartTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              
              <View style={styles.timeInputWrapper}>
                <Text style={styles.inputLabel}>{t.endTime}</Text>
                <TextInput
                  style={styles.timeInput}
                  value={routineEndTime}
                  onChangeText={setRoutineEndTime}
                  placeholder="HH:MM"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorButtons}>
              {['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#795548'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    routineColor === color && styles.selectedColorButton,
                  ]}
                  onPress={() => setRoutineColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              {editingRoutine && (
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={handleDeleteRoutine}
                >
                  <Text style={styles.deleteButtonText}>{t.delete}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setIsModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveRoutine}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  horizontalScroll: {
    flex: 1,
  },
  scheduleContainer: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 60,
  },
  dayColumn: {
    width: 120,
  },
  headerCell: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontWeight: 'bold',
  },
  timeCell: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  scheduleCell: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    position: 'relative',
  },
  eventItem: {
    position: 'absolute',
    left: 2,
    right: 2,
    padding: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  eventTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventLocation: {
    color: 'white',
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dayButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDayButton: {
    backgroundColor: '#2196F3',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#333',
  },
  selectedDayButtonText: {
    color: 'white',
  },
  timeInputsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeInputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  colorButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  selectedColorButton: {
    borderWidth: 2,
    borderColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 'auto',
  },
  deleteButtonText: {
    color: 'white',
  },
  messageContainer: {
    backgroundColor: '#4CAF50',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  messageText: {
    color: 'white',
    textAlign: 'center',
  },
}); 