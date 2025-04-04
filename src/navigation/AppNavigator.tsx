import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { WeeklySchedule } from '../components/Schedule/WeeklySchedule';

export type RootStackParamList = {
  Schedule: undefined;
  WeeklySchedule: {
    language: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Schedule"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen 
          name="WeeklySchedule" 
          component={WeeklySchedule}
          options={{
            presentation: 'card',
            animationEnabled: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 