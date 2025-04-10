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
import { useTranslation } from 'react-i18next';
import * as chrono from 'chrono-node';
import { format, addHours } from 'date-fns';

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
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedWeekday, setSelectedWeekday] = useState(0);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const { t } = useTranslation();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('error'), t('enterTitle'));
      return;
    }

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert(t('error'), t('userNotLoggedIn'));
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
      Alert.alert(t('error'), t('addScheduleFailed'));
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateTime;
    setShowDatePicker(Platform.OS === 'ios');
    setShowTimePicker(Platform.OS === 'ios');
    setDateTime(currentDate);
  };

  const parseQuickNote = (text: string): { date: Date, content: string } | null => {
    try {
      // 使用当前日期作为参考日期
      const referenceDate = new Date();
      console.log('参考日期:', referenceDate);
      
      // 使用严格模式和强制日期解析选项
      const results = chrono.parse(text, referenceDate, {
        forwardDate: true,
      });
      
      if (results.length === 0) return null;
      
      // 获取解析结果
      const parsedResult = results[0];
      const parsedDate = parsedResult.start.date();
      console.log('解析后的日期:', parsedDate);
      console.log('解析后的时间:', parsedDate.getHours() + ':' + parsedDate.getMinutes());
      
      // 检查是否有PM/AM标记
      const isPM = /\b([0-9]{1,2})\s*(?::|：)?\s*([0-9]{0,2})?\s*[pP][mM]\b/.test(text);
      const isAM = /\b([0-9]{1,2})\s*(?::|：)?\s*([0-9]{0,2})?\s*[aA][mM]\b/.test(text);
      
      // 如果有PM标记但时间小于12，加12小时
      if (isPM && parsedDate.getHours() < 12) {
        parsedDate.setHours(parsedDate.getHours() + 12);
        console.log('调整后的PM时间:', parsedDate.getHours() + ':' + parsedDate.getMinutes());
      }
      // 如果有AM标记且时间是12，设为0点
      else if (isAM && parsedDate.getHours() === 12) {
        parsedDate.setHours(0);
      }

      // 内容提取
      let content = text;
      if (parsedResult.text) {
        content = text.replace(parsedResult.text, '').trim();
      }
      
      return { date: parsedDate, content };
    } catch (error) {
      console.error('Error parsing quick note:', error);
      return null;
    }
  };

  const handleQuickNoteProcessed = (date: Date | null, content: string) => {
    try {
      setNewTaskTitle(content);
      
      if (date) {
        // 显示日志以便调试
        console.log('接收到的日期时间:', date);
        console.log('日期字符串:', date.toDateString());
        console.log('时间字符串:', date.toTimeString());
        console.log('当前星期几:', date.getDay()); // 0-6, 0是周日
        
        // 设置时间 (确保24小时制格式正确)
        const hours = date.getHours();
        const minutes = date.getMinutes();
        console.log('解析的小时:', hours);
        console.log('解析的分钟:', minutes);
        
        setStartTime(format(date, 'HH:mm'));
        setEndTime(format(addHours(date, 1), 'HH:mm'));
        
        // 获取正确的星期几
        const weekday = date.getDay(); // 0-6, 0是周日
        const adjustedWeekday = weekday === 0 ? 6 : weekday - 1;
        console.log('调整后的星期索引:', adjustedWeekday);
        
        setSelectedWeekday(adjustedWeekday);
      }
      
      setIsAddModalVisible(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('Error processing quick note:', errorMessage);
      Alert.alert('错误', '无法处理输入内容，请重试');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>{t('title')}</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={t('titlePlaceholder')}
      />

      <Text style={styles.label}>{t('description')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('descriptionPlaceholder')}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>{t('dateTime')}</Text>
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

      <Text style={styles.label}>{t('tags')}</Text>
      <TagInput tags={tags} onChange={setTags} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{t('save')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>{t('cancel')}</Text>
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
    minWidth: 100,
    padding: 12,
    marginHorizontal: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
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