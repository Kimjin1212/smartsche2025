import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { TagInput } from './TagInput';

interface ScheduleFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    description: string;
    dateTime: Date;
    tags: string[];
  };
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dateTime, setDateTime] = useState(initialData?.dateTime || new Date());
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入日程标题');
      return;
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('错误', '用户未登录');
        return;
      }

      const scheduleData = {
        title: title.trim(),
        description: description.trim(),
        dateTime: firestore.Timestamp.fromDate(dateTime),
        tags,
        userId: currentUser.uid,
        createdAt: firestore.Timestamp.now(),
        updatedAt: firestore.Timestamp.now(),
      };

      await firestore()
        .collection('schedules')
        .add(scheduleData);
      
      console.log('Schedule added successfully');
      onSubmit();
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('错误', '添加日程失败，请重试');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateTime;
    setShowDatePicker(Platform.OS === 'ios');
    setShowTimePicker(Platform.OS === 'ios');
    setDateTime(currentDate);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>标题</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="输入日程标题"
      />

      <Text style={styles.label}>描述</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="输入日程描述"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>日期和时间</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{dateTime.toLocaleDateString()}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowTimePicker(true)}
      >
        <Text>{dateTime.toLocaleTimeString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dateTime}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dateTime}
          mode="time"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Text style={styles.label}>标签</Text>
      <TagInput tags={tags} onChange={setTags} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>保存</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>取消</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 