/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, useColorScheme, Text, View } from 'react-native';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    // 如果用户未登录，进行匿名登录
    const signInAnonymously = async () => {
      try {
        if (!auth().currentUser) {
          await auth().signInAnonymously();
          console.log('Anonymous auth successful');
        }
      } catch (error) {
        console.error('Anonymous auth error:', error);
      }
    };

    signInAnonymously();
    return subscriber;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={styles.container.backgroundColor}
      />
      <ScheduleScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
