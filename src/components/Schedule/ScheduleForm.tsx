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