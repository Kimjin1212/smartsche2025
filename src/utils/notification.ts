import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';

export const initializeNotifications = async () => {
  // 为 Android 创建通知渠道
  await notifee.createChannel({
    id: 'task-reminders',
    name: 'Task Reminders',
    description: 'Reminders for scheduled tasks',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
};

export const scheduleTaskReminder = async (
  taskId: string,
  taskContent: string,
  taskTime: Date,
  reminderMinutes: number
) => {
  const reminderTime = new Date(taskTime.getTime() - (reminderMinutes * 60 * 1000));

  // 创建定时通知
  await notifee.createTriggerNotification(
    {
      id: `task-${taskId}`,
      title: '任务提醒',
      body: `任务"${taskContent}"将在${reminderMinutes}分钟后开始`,
      android: {
        channelId: 'task-reminders',
        pressAction: {
          id: 'default',
        },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderTime.getTime(),
    },
  );
};

export const cancelTaskReminder = async (taskId: string) => {
  await notifee.cancelNotification(`task-${taskId}`);
}; 