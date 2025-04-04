import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Language = 'en' | 'zh' | 'ja' | 'ko';

interface LoginScreenProps {
  language?: string;
}

const translations = {
  en: {
    email: 'Email',
    password: 'Password',
    login: 'Login',
    register: 'Register',
    switchToRegister: 'Need an account? Register',
    switchToLogin: 'Already have an account? Login',
    loginError: 'Login failed',
    registerError: 'Registration failed',
    tryAgain: 'Please try again',
  },
  zh: {
    email: '邮箱',
    password: '密码',
    login: '登录',
    register: '注册',
    switchToRegister: '没有账号？注册',
    switchToLogin: '已有账号？登录',
    loginError: '登录失败',
    registerError: '注册失败',
    tryAgain: '请重试',
  },
  ja: {
    email: 'メールアドレス',
    password: 'パスワード',
    login: 'ログイン',
    register: '登録',
    switchToRegister: 'アカウントをお持ちでない方は登録',
    switchToLogin: 'すでにアカウントをお持ちの方はログイン',
    loginError: 'ログインに失敗しました',
    registerError: '登録に失敗しました',
    tryAgain: 'もう一度お試しください',
  },
  ko: {
    email: '이메일',
    password: '비밀번호',
    login: '로그인',
    register: '회원가입',
    switchToRegister: '계정이 없으신가요? 회원가입',
    switchToLogin: '이미 계정이 있으신가요? 로그인',
    loginError: '로그인 실패',
    registerError: '회원가입 실패',
    tryAgain: '다시 시도해주세요',
  },
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ language = 'zh' }) => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const t = translations[language as keyof typeof translations];

  const handleAuth = async () => {
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (isRegistering) {
        await auth().createUserWithEmailAndPassword(email.trim(), password);
      } else {
        await auth().signInWithEmailAndPassword(email.trim(), password);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      let errorMessage = '';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        default:
          errorMessage = error.message || 'Authentication failed. Please try again.';
      }

      Alert.alert(
        isRegistering ? t.registerError : t.loginError,
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Smart Schedule</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t.email}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.email}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t.password}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            autoComplete="password"
          />
        </View>

        <TouchableOpacity 
          style={styles.authButton}
          onPress={handleAuth}
        >
          <Text style={styles.authButtonText}>
            {isRegistering ? t.register : t.login}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={styles.switchButtonText}>
            {isRegistering ? t.switchToLogin : t.switchToRegister}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    padding: 8,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#2196F3',
    fontSize: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 12,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#fff',
  },
}); 