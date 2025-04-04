import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  selectedHour?: number;
  selectedDay?: number;
  isQuickAdd?: boolean;
}

const predefinedTags = ['Study', 'Work', 'Life', 'Other'];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  selectedHour,
  selectedDay,
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleAddTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      await firestore().collection('schedules').add({
        title,
        location,
        dateTime: firestore.Timestamp.fromDate(startTime),
        endTime: firestore.Timestamp.fromDate(endTime),
        tags: selectedTags,
        userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      onClose();
      setTitle('');
      setLocation('');
      setSelectedTags([]);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Schedule</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location (optional)"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.timeContainer}>
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, date) => date && setStartTime(date)}
            />
            <DateTimePicker
              value={endTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, date) => date && setEndTime(date)}
            />
          </View>

          <View style={styles.tagsContainer}>
            {predefinedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.tagButtonSelected,
                ]}
                onPress={() => handleAddTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
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
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 5,
  },
  tagButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  tagText: {
    color: '#666',
  },
  tagTextSelected: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 10,
  },
  cancelButtonText: {
    color: 'white',
  },
  saveButtonText: {
    color: 'white',
  },
}); 