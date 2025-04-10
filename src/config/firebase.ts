import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

// 初始化 Firebase
if (!firebase.apps.length) {
  // 使用 as any 避免 TypeScript 错误
  // Firebase 配置会从 google-services.json/GoogleService-Info.plist 自动读取
  firebase.initializeApp({} as any);
}

export { firebase }; 