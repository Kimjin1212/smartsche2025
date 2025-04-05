import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface Task {
  id: string;
  content: string;
  dateTime: FirebaseFirestoreTypes.Timestamp;
  reminderEnabled?: boolean;
  reminderOffsetMinutes?: number;
}

class NotificationService {
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

  async scheduleTaskReminder(task: Task) {
    if (!task.reminderEnabled || !task.reminderOffsetMinutes) {
      return;
    }

    const taskTime = task.dateTime.toDate();
    const reminderTime = new Date(taskTime.getTime() - (task.reminderOffsetMinutes * 60 * 1000));

    if (reminderTime <= new Date()) {
      return; // 如果提醒时间已过，则不设置提醒
    }

    await this.scheduleNotification(task.content, reminderTime);
  }

  async cancelNotification(taskId: string) {
    await notifee.cancelNotification(taskId);
  }

  async cancelAllNotifications() {
    await notifee.cancelAllNotifications();
  }
}

export default new NotificationService(); 