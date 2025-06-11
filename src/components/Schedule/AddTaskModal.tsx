import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import { format } from 'date-fns';
import SmartTimeRecommendationModal from './SmartTimeRecommendationModal';
import { SmartScheduler } from '../../services/smartScheduler';
import { SmartTimeSlot } from '../../types/schedule';
import { translations, Language } from '../../i18n/translations';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTask: (task: any) => void;
  existingTasks: any[];
  language?: Language;
  selectedHour?: number;
  selectedDay?: number;
}

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type WeekdayKey = typeof weekdays[number];
const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722'];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onAddTask,
  existingTasks,
  language = 'zh',
  selectedHour,
  selectedDay,
}) => {
  const t = translations[language];
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTime, setStartTime] = useState(selectedHour ? `${selectedHour}:00` : '08:00');
  const [endTime, setEndTime] = useState(selectedHour ? `${selectedHour + 1}:00` : '09:00');
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<SmartTimeSlot[]>([]);
  const [weekdayText, setWeekdayText] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState('10');
  const [step, setStep] = useState<'form' | 'duration' | 'recommend'>('form');
  const [taskDuration, setTaskDuration] = useState(60);
  
  const smartScheduler = new SmartScheduler();

  useEffect(() => {
    if (selectedHour) {
      const newStartTime = new Date();
      newStartTime.setHours(selectedHour, 0, 0, 0);
      setStartTime(format(newStartTime, 'HH:mm'));
      
      const newEndTime = new Date();
      newEndTime.setHours(selectedHour + 1, 0, 0, 0);
      setEndTime(format(newEndTime, 'HH:mm'));
    }
  }, [selectedHour]);

  useEffect(() => {
    if (selectedDate) {
      const weekday = selectedDate.getDay();
      const weekdayKey = weekdays[weekday] as WeekdayKey;
      const weekdayText = t[weekdayKey];
      setWeekdayText(weekdayText);
    }
  }, [selectedDate, language]);

  useEffect(() => {
    if (visible) {
      setStep('form');
    }
  }, [visible]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleStartTimeChange = (event: any, date?: Date) => {
    setShowStartTimePicker(false);
    if (date) {
      setStartTime(format(date, 'HH:mm'));
    }
  };

  const handleEndTimeChange = (event: any, date?: Date) => {
    setShowEndTimePicker(false);
    if (date) {
      setEndTime(format(date, 'HH:mm'));
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

    const dateTasksFilter = existingTasks.filter(task => {
      const taskDate = task.dateTime.toDate();
      return taskDate.toDateString() === selectedDate.toDateString();
    });

    const timeSlots = dateTasksFilter.map(task => ({
      startTime: task.dateTime.toDate().toISOString(),
      endTime: task.endTime.toDate().toISOString(),
    }));

    const recommendedSlots = smartScheduler.getSmartTimeSlots(duration, timeSlots, undefined, language);
    setRecommendations(recommendedSlots);
    setShowRecommendations(true);
  };

  const handleSelectRecommendation = (slot: SmartTimeSlot) => {
    try {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      
      setStartTime(format(start, 'HH:mm'));
      setEndTime(format(end, 'HH:mm'));
      
      setShowRecommendations(false);
    } catch (error) {
      console.error('Error in handleSelectRecommendation:', error);
      Alert.alert(t.error, 'Failed to set recommended time');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t.error, t.pleaseEnterTitle);
      return;
    }

    try {
      const taskDate = new Date(selectedDate);
      const [startHour, startMinute] = startTime.split(':').map(Number);
      taskDate.setHours(startHour, startMinute, 0);

      const endDate = new Date(selectedDate);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      endDate.setHours(endHour, endMinute, 0);

      const newTask: any = {
        title,
        content: title,
        location: location || '',
        dateTime: firestore.Timestamp.fromDate(taskDate),
        endTime: firestore.Timestamp.fromDate(endDate),
        color: selectedColor || '',
        weekday: taskDate.getDay() === 0 ? 6 : taskDate.getDay() - 1,
        createdAt: firestore.FieldValue.serverTimestamp(),
        reminderEnabled: !!reminderEnabled,
      };
      if (reminderEnabled && reminderOffsetMinutes) {
        newTask.reminderOffsetMinutes = parseInt(reminderOffsetMinutes);
      }
      Object.keys(newTask).forEach(k => newTask[k] === undefined && delete newTask[k]);

      await onAddTask(newTask);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert(t.error, t.errorAddingTask);
    }
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setSelectedDate(new Date());
    setStartTime('08:00');
    setEndTime('09:00');
    setSelectedColor(colors[0]);
    setReminderEnabled(false);
    setReminderOffsetMinutes('10');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {step === 'form' && (
            <ScrollView>
              <Text style={styles.modalTitle}>{t.addTask}</Text>

              <Text style={styles.inputLabel}>{t.taskTitle}</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t.taskTitle}
              />

              <Text style={styles.inputLabel}>{t.taskLocation}</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder={t.taskLocation}
              />

              <Text style={styles.inputLabel}>{t.date}</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>
                  {format(selectedDate, language === 'en' ? 'MM/dd/yyyy' : 'yyyy-MM-dd')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>{t.weekday}</Text>
              <View style={styles.weekdayDisplay}>
                <Text style={styles.weekdayText}>{weekdayText}</Text>
              </View>

              <View style={styles.timeContainer}>
                <View style={styles.timeField}>
                  <Text style={styles.inputLabel}>{t.startTime}</Text>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text>{startTime}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeField}>
                  <Text style={styles.inputLabel}>{t.endTime}</Text>
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text>{endTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.smartRecommendButton}
                onPress={() => setStep('duration')}
              >
                <Text style={styles.smartRecommendText}>{t.smartRecommend}</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>{t.color}</Text>
              <View style={styles.colorContainer}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorButtonSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>

              <View style={styles.reminderContainer}>
                <Text style={styles.inputLabel}>{t.reminder}</Text>
                <View style={styles.reminderRow}>
                  <TouchableOpacity
                    style={[
                      styles.reminderToggle,
                      reminderEnabled && styles.reminderToggleActive,
                    ]}
                    onPress={() => setReminderEnabled(!reminderEnabled)}
                  >
                    <Text
                      style={[
                        styles.reminderToggleText,
                        reminderEnabled && styles.reminderToggleTextActive,
                      ]}
                    >
                      ✓
                    </Text>
                  </TouchableOpacity>
                  {reminderEnabled && (
                    <View style={styles.reminderOffsetContainer}>
                      <TextInput
                        style={styles.reminderOffsetInput}
                        value={reminderOffsetMinutes}
                        onChangeText={setReminderOffsetMinutes}
                        keyboardType="number-pad"
                      />
                      <Text style={styles.reminderOffsetLabel}>{t.minutes}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
          {step === 'duration' && (
            <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', minWidth: 260, minHeight: 180, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 18, color: '#222' }}>{t.enterDuration}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#bbb', borderRadius: 6, padding: 10, width: 100, fontSize: 20, textAlign: 'center', backgroundColor: '#fff', color: '#222' }}
                  value={taskDuration.toString()}
                  onChangeText={text => setTaskDuration(Number(text.replace(/[^0-9]/g, '')))}
                  placeholder="请输入分钟数"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={{ marginLeft: 10, fontSize: 18, color: '#333' }}>{t.minutesUnit}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                <TouchableOpacity onPress={() => setStep('form')} style={{ marginRight: 32 }}>
                  <Text style={{ color: '#888', fontSize: 16 }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  const duration = Number(taskDuration);
                  if (isNaN(duration) || duration <= 0) {
                    Alert.alert('提示', '请输入有效的任务时长');
                    return;
                  }
                  const dateTasksFilter = existingTasks.filter(task => {
                    const taskDate = task.dateTime.toDate();
                    return taskDate.toDateString() === selectedDate.toDateString();
                  });
                  const timeSlots = dateTasksFilter.map(task => ({
                    startTime: task.dateTime.toDate().toISOString(),
                    endTime: task.endTime.toDate().toISOString(),
                  }));
                  const recommendedSlots = smartScheduler.getSmartTimeSlots(duration, timeSlots, selectedDate, language);
                  console.log('to recommend', recommendedSlots);
                  setRecommendations(recommendedSlots);
                  setStep('recommend');
                }}>
                  <Text style={{ color: '#1976D2', fontSize: 16, fontWeight: 'bold' }}>{t.confirm}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {step === 'recommend' && (
            <View style={{ backgroundColor: '#f5f5f5', borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', minWidth: 260, minHeight: 180, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#222' }}>{t.smartRecommendTitle}</Text>
              <ScrollView style={{ maxHeight: 220, width: '100%', backgroundColor: 'transparent' }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
                {recommendations.length === 0 ? (
                  <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 }}>{t.noRecommendation}</Text>
                ) : recommendations.map((slot, index) => (
                  <TouchableOpacity
                    key={slot.startTime + slot.endTime + '-' + index}
                    style={[styles.smartRecommendButton, { width: '90%', marginBottom: 10 }]}
                    onPress={() => {
                      const start = new Date(slot.startTime);
                      const end = new Date(slot.endTime);
                      setStartTime(format(start, 'HH:mm'));
                      setEndTime(format(end, 'HH:mm'));
                      setStep('form');
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1976D2' }}>{format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}</Text>
                    <Text style={{ fontSize: 14, color: '#333', marginTop: 2 }}>{slot.explanation || '推荐时间段'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.cancelButton, { marginTop: 10 }]} onPress={() => setStep('form')}>
                <Text style={styles.cancelButtonText}>{t.back}</Text>
              </TouchableOpacity>
            </View>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          {showStartTimePicker && (
            <DateTimePicker
              value={(() => {
                const [hours, minutes] = startTime.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes);
                return date;
              })()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={(() => {
                const [hours, minutes] = endTime.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes);
                return date;
              })()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
            />
          )}

          <SmartTimeRecommendationModal
            visible={showRecommendations}
            onClose={() => setShowRecommendations(false)}
            recommendations={recommendations}
            onSelect={handleSelectRecommendation}
            language={language}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  weekdayDisplay: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  weekdayText: {
    fontSize: 16,
    textAlign: 'center',
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
  colorContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
  reminderContainer: {
    marginBottom: 16,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 12,
  },
  reminderOffsetInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: 'center',
  },
  reminderOffsetLabel: {
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 