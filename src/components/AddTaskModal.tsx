import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SmartTimeRecommendationModal } from './SmartTimeRecommendationModal';
import { SmartScheduler } from '../services/smartScheduler';
import { SmartTimeSlot, TaskItem } from '../types/schedule';
import ColorPicker from './ColorPicker';
import { translations, Language } from '../i18n/translations';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTask: (task: TaskItem) => void;
  existingTasks: TaskItem[];
  language?: Language;
}

// 任务类型定义
const TASK_TYPES = [
  { key: 'work', zh: '工作', en: 'Work', ko: '업무' },
  { key: 'study', zh: '学习', en: 'Study', ko: '학습' },
  { key: 'exercise', zh: '运动', en: 'Exercise', ko: '운동' },
  { key: 'meeting', zh: '会议', en: 'Meeting', ko: '회의' },
  { key: 'other', zh: '其他', en: 'Other', ko: '기타' },
];

// 优先级定义
const PRIORITY_LEVELS = [
  { value: 1, zh: '低', en: 'Low', ko: '낮음' },
  { value: 2, zh: '较低', en: 'Lower', ko: '낮음' },
  { value: 3, zh: '中', en: 'Medium', ko: '중간' },
  { value: 4, zh: '较高', en: 'Higher', ko: '높음' },
  { value: 5, zh: '高', en: 'High', ko: '높음' },
];

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onAddTask,
  existingTasks,
  language = 'zh',
}) => {
  const t = translations[language];
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [selectedColor, setSelectedColor] = useState('#4CAF50');
  const [recommendations, setRecommendations] = useState<SmartTimeSlot[]>([]);
  const [taskDuration, setTaskDuration] = useState(60);
  const [preferredRanges, setPreferredRanges] = useState<string[]>([]);
  const [selectedTaskType, setSelectedTaskType] = useState('work');
  const [selectedPriority, setSelectedPriority] = useState(3);
  const [step, setStep] = useState<'form' | 'duration' | 'preferredTime' | 'recommend'>('form');

  const smartScheduler = new SmartScheduler();

  // 日志追踪 step 和 visible
  useEffect(() => {
    console.log('AddTaskModal render, step:', step, 'visible:', visible);
  }, [step, visible]);

  // 每次弹窗打开时重置 step
  useEffect(() => {
    if (visible) {
      setStep('form');
    }
  }, [visible]);

  const getDuration = () => {
    return Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
  };

  const handleSmartRecommendation = () => {
    const duration = Number(taskDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('提示', '请输入有效的任务时长');
      return;
    }

    // Get existing tasks for the selected date
    const dateTasksFilter = existingTasks.filter(task => {
      const taskDate = new Date(task.dateTime);
      return taskDate.toDateString() === selectedDate.toDateString();
    });

    // Convert tasks to TimeSlot format
    const timeSlots = dateTasksFilter.map(task => {
      const start = task.dateTime.toDate();
      let end;
      if ('endTime' in task && task.endTime) {
        if (typeof task.endTime === 'object' && typeof (task.endTime as any).toDate === 'function') {
          end = (task.endTime as any).toDate();
        } else if (typeof task.endTime === 'string' || typeof task.endTime === 'number') {
          end = new Date(task.endTime);
        } else if (task.endTime instanceof Date) {
          end = task.endTime;
        } else {
          end = new Date(start.getTime() + 60 * 60 * 1000);
        }
      } else {
        end = new Date(start.getTime() + 60 * 60 * 1000); // 默认1小时
      }
      return {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
    });

    // 确保 timeSlots 数组有效
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      Alert.alert('提示', '当前日期没有任务，无法推荐时间');
      return;
    }

    const recommendedSlots = smartScheduler.getSmartTimeSlots(
      duration,
      timeSlots,
      selectedDate,
      language,
      { taskType: selectedTaskType as any, priority: selectedPriority as any }
    );
    // 确保 recommendedSlots 数组有效且每个 slot 都有 explanation
    if (!Array.isArray(recommendedSlots) || recommendedSlots.length === 0) {
      Alert.alert('提示', '无法推荐时间，请稍后再试');
      return;
    }
    const smartSlots: SmartTimeSlot[] = recommendedSlots.map(slot => ({
      ...slot,
      explanation: slot.explanation || '推荐时间段'
    }));
    setRecommendations(smartSlots);
  };

  const handleSelectRecommendation = (slot: SmartTimeSlot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    setStartTime(start);
    setEndTime(end);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入任务标题');
      return;
    }

    const newTask: TaskItem = {
      id: Date.now().toString(),
      userId: 'current-user-id',
      content: title,
      dateTime: startTime,
      location: location,
      isRoutine: false,
      status: 'pending',
      color: selectedColor,
      taskType: selectedTaskType as TaskItem['taskType'],
      priority: selectedPriority as TaskItem['priority'],
    };

    onAddTask(newTask);
    resetForm();
    setStep('form');
    onClose();
  };

  const handleClose = () => {
    setStep('form');
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setSelectedDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 60 * 60 * 1000));
    setSelectedColor('#4CAF50');
    setTaskDuration(60);
    setPreferredRanges([]);
    setSelectedTaskType('work');
    setSelectedPriority(3);
  };

  // 偏好时间段定义及多语言文本
  const PREFERRED_TIME_RANGES = [
    { key: 'morning', zh: '早晨', en: 'Morning', ko: '아침', range: [6, 8] },
    { key: 'forenoon', zh: '上午', en: 'Forenoon', ko: '오전', range: [8.5, 11] },
    { key: 'noon', zh: '中午', en: 'Noon', ko: '점심', range: [11, 14] },
    { key: 'afternoon', zh: '下午', en: 'Afternoon', ko: '오후', range: [14, 18] },
    { key: 'evening', zh: '傍晚', en: 'Evening', ko: '저녁', range: [18, 22] },
  ];

  // 多语言文本兜底（类型注解）
  function getText(t: Record<string, string>, key: string, fallback: string): string {
    return (t && t[key]) ? t[key] : fallback;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {step === 'form' && (
            <ScrollView>
              <Text style={styles.title}>添加新任务</Text>
              <Text style={styles.label}>标题</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="输入任务标题"
              />
              <Text style={styles.label}>任务类型</Text>
              <View style={styles.typeContainer}>
                {TASK_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      selectedTaskType === type.key && styles.selectedTypeButton,
                    ]}
                    onPress={() => setSelectedTaskType(type.key)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedTaskType === type.key && styles.selectedTypeButtonText,
                      ]}
                    >
                      {type[language as 'zh' | 'en' | 'ko']}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>优先级</Text>
              <View style={styles.priorityContainer}>
                {PRIORITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.priorityButton,
                      selectedPriority === level.value && styles.selectedPriorityButton,
                    ]}
                    onPress={() => setSelectedPriority(level.value)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        selectedPriority === level.value && styles.selectedPriorityButtonText,
                      ]}
                    >
                      {level[language as 'zh' | 'en' | 'ko']}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>地点</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="输入地点（可选）"
              />
              <Text style={styles.label}>日期</Text>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => date && setSelectedDate(date)}
              />
              <View style={styles.timeContainer}>
                <View style={styles.timeField}>
                  <Text style={styles.label}>开始时间</Text>
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="default"
                    onChange={(event, date) => date && setStartTime(date)}
                  />
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.label}>结束时间</Text>
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="default"
                    onChange={(event, date) => date && setEndTime(date)}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.smartRecommendButton}
                onPress={() => {
                  console.log('to duration');
                  setStep('duration');
                }}
              >
                <Text style={styles.smartRecommendText}>🧠 智能推荐时间</Text>
              </TouchableOpacity>
              <Text style={styles.label}>颜色</Text>
              <ColorPicker
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.buttonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.buttonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
          {step === 'duration' && (
            <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', minWidth: 260, minHeight: 200, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 18, color: '#222' }}>{getText(t, 'enterDuration', '请输入任务时长（分钟）')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 6, padding: 10, width: 100, fontSize: 20, textAlign: 'center', backgroundColor: '#fff', color: '#222' }}
                  value={taskDuration.toString()}
                  onChangeText={text => setTaskDuration(Number(text.replace(/[^0-9]/g, '')))}
                  placeholder={getText(t, 'enterDuration', '请输入任务时长（分钟）')}
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={{ marginLeft: 10, fontSize: 18, color: '#333' }}>{getText(t, 'minutesUnit', '分钟')}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                <TouchableOpacity onPress={() => setStep('form')} style={{ marginRight: 32 }}>
                  <Text style={{ color: '#888', fontSize: 16 }}>{getText(t, 'cancel', '取消')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  const duration = Number(taskDuration);
                  if (isNaN(duration) || duration <= 0) {
                    Alert.alert(getText(t, 'tip', '提示'), getText(t, 'invalidDuration', '请输入有效的任务时长'));
                    return;
                  }
                  setStep('preferredTime');
                }}>
                  <Text style={{ color: '#1976D2', fontSize: 16, fontWeight: 'bold' }}>{getText(t, 'confirm', '确认')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {step === 'preferredTime' && (
            <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', minWidth: 260, minHeight: 260, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>{getText(t, 'selectPreferredTime', '请选择偏好时间段（可多选）')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, justifyContent: 'center' }}>
                {PREFERRED_TIME_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.key}
                    onPress={() => {
                      setPreferredRanges(prev => prev.includes(range.key)
                        ? prev.filter(k => k !== range.key)
                        : [...prev, range.key]);
                    }}
                    style={{
                      backgroundColor: preferredRanges.includes(range.key) ? '#1976D2' : '#fff',
                      borderColor: '#1976D2',
                      borderWidth: 1,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      margin: 4,
                    }}
                  >
                    <Text style={{ color: preferredRanges.includes(range.key) ? '#fff' : '#1976D2', fontSize: 15 }}>
                      {range[language as 'zh' | 'en' | 'ko']}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                <TouchableOpacity onPress={() => setStep('duration')} style={{ marginRight: 32 }}>
                  <Text style={{ color: '#888', fontSize: 16 }}>{getText(t, 'back', '返回')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  // 进入推荐
                  const duration = Number(taskDuration);
                  const dateTasksFilter = existingTasks.filter(task => {
                    const taskDate = task.dateTime.toDate();
                    return taskDate.toDateString() === selectedDate.toDateString();
                  });
                  const timeSlots = dateTasksFilter.map(task => {
                    const start = task.dateTime.toDate();
                    let end;
                    if ('endTime' in task && task.endTime) {
                      if (typeof task.endTime === 'object' && typeof (task.endTime as any).toDate === 'function') {
                        end = (task.endTime as any).toDate();
                      } else if (typeof task.endTime === 'string' || typeof task.endTime === 'number') {
                        end = new Date(task.endTime);
                      } else if (task.endTime instanceof Date) {
                        end = task.endTime;
                      } else {
                        end = new Date(start.getTime() + 60 * 60 * 1000);
                      }
                    } else {
                      end = new Date(start.getTime() + 60 * 60 * 1000); // 默认1小时
                    }
                    return {
                      startTime: start.toISOString(),
                      endTime: end.toISOString(),
                    };
                  });
                  const recommendedSlots = smartScheduler.getSmartTimeSlots(
                    duration,
                    timeSlots,
                    selectedDate,
                    language,
                    { taskType: selectedTaskType as any, priority: selectedPriority as any }
                  );
                  setRecommendations(recommendedSlots);
                  setStep('recommend');
                }}>
                  <Text style={{ color: '#1976D2', fontSize: 16, fontWeight: 'bold' }}>{getText(t, 'confirm', '确认')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {step === 'recommend' && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 320, paddingVertical: 24 }}>
              <View style={{ width: '100%', flexGrow: 1, minHeight: 320, maxHeight: '90%', justifyContent: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 28, textAlign: 'center', color: '#222' }}>智能时间推荐</Text>
                <ScrollView
                  style={{ flexGrow: 1, width: '100%' }}
                  contentContainerStyle={{ alignItems: 'center', paddingBottom: 36, paddingTop: 12 }}
                  showsVerticalScrollIndicator={true}
                >
                  {recommendations.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        backgroundColor: '#E3F2FD',
                        borderColor: '#90CAF9',
                        borderWidth: 2,
                        borderRadius: 16,
                        paddingVertical: 24,
                        paddingHorizontal: 36,
                        marginVertical: 16,
                        minWidth: 220,
                        maxWidth: '90%',
                        width: '90%',
                        alignItems: 'center',
                        shadowColor: '#1976D2',
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                      onPress={() => {
                        handleSelectRecommendation(slot);
                        setStep('form');
                      }}
                    >
                      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1976D2', marginBottom: 8 }}>
                        {new Date(slot.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={{ fontSize: 18, color: '#333' }}>{slot.explanation}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={[styles.closeButton, { marginTop: 18, minWidth: 120, padding: 18 }]} onPress={() => setStep('form')}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>返回</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeField: {
    flex: 1,
    marginHorizontal: 5,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 5,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  explanationText: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  typeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  selectedTypeButton: {
    backgroundColor: '#1976D2',
  },
  typeButtonText: {
    color: '#1976D2',
    fontSize: 14,
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 16,
    paddingVertical: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  selectedPriorityButton: {
    backgroundColor: '#1976D2',
  },
  priorityButtonText: {
    color: '#1976D2',
    fontSize: 14,
  },
  selectedPriorityButtonText: {
    color: '#fff',
  },
}); 