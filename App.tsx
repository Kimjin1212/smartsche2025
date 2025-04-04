/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AppNavigator } from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {
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
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
