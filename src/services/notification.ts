import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
// import PushNotification from 'react-native-push-notification';

interface Task {
  id: string;
  content: string;
  dateTime: FirebaseFirestoreTypes.Timestamp;
  endTime: FirebaseFirestoreTypes.Timestamp;
  reminderEnabled?: boolean;
  reminderOffsetMinutes?: number;
}

interface TaskReminder {
  id: string;
  content: string;
  dateTime: Date | FirebaseFirestoreTypes.Timestamp;
  reminderOffsetMinutes: number;
}

class NotificationService {
  constructor() {
    // PushNotification.configure({
    //   onRegister: function (token) {
    //     console.log('TOKEN:', token);
    //   },
    //   onNotification: function (notification) {
    //     console.log('NOTIFICATION:', notification);
    //   },
    //   permissions: {
    //     alert: true,
    //     badge: true,
    //     sound: true,
    //   },
    //   popInitialNotification: true,
    //   requestPermissions: true,
    // });
  }

  async createChannel() {
    await notifee.createChannel({
      id: 'default',
      name: '默认通知通道',
    });
  }

  async scheduleNotification(taskTitle: string, reminderTime: Date) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderTime.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        title: '任务提醒',
        body: `即将开始：${taskTitle}`,
        android: {
          channelId: 'default',
        },
      },
      trigger
    );
  }

  async scheduleTaskReminder(task: TaskReminder) {
    const taskDate = task.dateTime instanceof Date ? task.dateTime : task.dateTime.toDate();
    const reminderTime = new Date(taskDate.getTime() - task.reminderOffsetMinutes * 60000);

    // Using notifee instead of PushNotification
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderTime.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: task.id,
        title: '任务提醒',
        body: task.content,
        android: {
          channelId: 'default',
        },
      },
      trigger
    );
  }

  async cancelNotification(taskId: string) {
    await notifee.cancelNotification(taskId);
  }

  async cancelAllNotifications() {
    await notifee.cancelAllNotifications();
  }

  cancelTaskReminder = async (taskId: string) => {
    await notifee.cancelNotification(taskId);
  };
}

export default new NotificationService(); 