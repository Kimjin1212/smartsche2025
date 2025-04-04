import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyCalendarProps {
  onTimeSlotPress: (hour: number, day: number) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ onTimeSlotPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.timeHeaderCell}>
          <Text style={styles.headerText}>Time</Text>
        </View>
        {DAYS.map((day, index) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.headerText}>{day}</Text>
          </View>
        ))}
      </View>
      <ScrollView>
        {HOURS.map((hour) => (
          <View key={hour} style={styles.row}>
            <View style={styles.timeCell}>
              <Text style={styles.timeText}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
            </View>
            {DAYS.map((_, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={styles.cell}
                onPress={() => onTimeSlotPress(hour, dayIndex)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  timeHeaderCell: {
    width: 60,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHeaderCell: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderColor: '#ddd',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  timeCell: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  cell: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: '#eee',
  },
}); 