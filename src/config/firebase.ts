import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

// 初始化 Firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    // Firebase 配置会从 google-services.json 自动读取
  });
}

export { firebase }; 