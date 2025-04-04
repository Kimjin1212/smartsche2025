import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { ScheduleList } from '../components/Schedule/ScheduleList';
import { ScheduleForm } from '../components/Schedule/ScheduleForm';

export const ScheduleScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <View style={styles.container}>
      {showForm ? (
        <ScheduleForm
          onSubmit={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.addButtonText}>添加日程</Text>
          </TouchableOpacity>
          <ScheduleList />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 