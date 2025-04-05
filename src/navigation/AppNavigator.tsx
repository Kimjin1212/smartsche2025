import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { LoginScreen } from '../screens/LoginScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { WeeklyScheduleScreen } from '../screens/WeeklyScheduleScreen';

export type RootStackParamList = {
  Login: undefined;
  Schedule: undefined;
  WeeklySchedule: { language: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return subscriber;
  }, [initializing]);

  if (initializing) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="WeeklySchedule" component={WeeklyScheduleScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}; 