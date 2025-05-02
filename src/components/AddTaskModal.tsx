import React, { useState } from 'react';
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

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTask: (task: TaskItem) => void;
  existingTasks: TaskItem[];
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onAddTask,
  existingTasks,
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [selectedColor, setSelectedColor] = useState('#4CAF50');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<SmartTimeSlot[]>([]);

  const smartScheduler = new SmartScheduler();

  const getDuration = () => {
    return Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
  };

  const handleSmartRecommendation = () => {
    const duration = getDuration();
    if (duration <= 0) {
      Alert.alert('提示', '请先设置有效的任务时长');
      return;
    }

    // Get existing tasks for the selected date
    const dateTasksFilter = existingTasks.filter(task => {
      const taskDate = new Date(task.dateTime);
      return taskDate.toDateString() === selectedDate.toDateString();
    });

    // Convert tasks to TimeSlot format
    const timeSlots = dateTasksFilter.map(task => ({
      startTime: new Date(task.dateTime).toISOString(),
      endTime: new Date(task.dateTime).toISOString(), // Assuming end time is stored somewhere
    }));

    const recommendedSlots = smartScheduler.getSmartTimeSlots(duration, timeSlots);
    // Ensure all slots have explanations
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
    setStartTime(start);
    setEndTime(end);
    setShowRecommendations(false);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入任务标题');
      return;
    }

    const newTask: TaskItem = {
      id: Date.now().toString(),
      userId: 'current-user-id', // Replace with actual user ID
      content: title,
      dateTime: startTime,
      location: location,
      isRoutine: false,
      status: 'pending',
      color: selectedColor,
    };

    onAddTask(newTask);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setSelectedDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 60 * 60 * 1000));
    setSelectedColor('#4CAF50');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.title}>添加新任务</Text>

            <Text style={styles.label}>标题</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="输入任务标题"
            />

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
              onPress={handleSmartRecommendation}
            >
              <Text style={styles.smartRecommendText}>🧠 智能推荐时间</Text>
            </TouchableOpacity>

            <Text style={styles.label}>颜色</Text>
            <ColorPicker
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <SmartTimeRecommendationModal
        visible={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        recommendations={recommendations}
        onSelect={handleSelectRecommendation}
      />
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
}); 