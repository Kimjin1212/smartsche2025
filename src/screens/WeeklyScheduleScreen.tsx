import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WeeklySchedule } from '../components/Schedule/WeeklySchedule';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = StackScreenProps<RootStackParamList, 'WeeklySchedule'>;

export const WeeklyScheduleScreen: React.FC<Props> = ({ route }) => {
  const { language } = route.params;

  return (
    <View style={styles.container}>
      <WeeklySchedule language={language} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 