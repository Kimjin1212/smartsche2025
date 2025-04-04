declare module 'react-native-push-notification' {
  export interface PushNotificationPermissions {
    alert?: boolean;
    badge?: boolean;
    sound?: boolean;
  }

  export interface PushNotificationOptions {
    onRegister?: (token: { os: string; token: string }) => void;
    onNotification?: (notification: any) => void;
    onAction?: (notification: any) => void;
    onRegistrationError?: (error: any) => void;
    onRemoteFetch?: (notificationData: any) => void;
    permissions?: PushNotificationPermissions;
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  export interface PushNotificationObject {
    /* Android only properties */
    id?: string;
    ticker?: string;
    autoCancel?: boolean;
    largeIcon?: string;
    smallIcon?: string;
    bigText?: string;
    subText?: string;
    color?: string;
    vibrate?: boolean;
    vibration?: number;
    tag?: string;
    group?: string;
    ongoing?: boolean;

    /* iOS only properties */
    alertAction?: string;
    category?: string;
    userInfo?: any;

    /* iOS and Android properties */
    title?: string;
    message: string;
    playSound?: boolean;
    soundName?: string;
    number?: string;
    repeatType?: string;
    actions?: string;
    channelId?: string;
    date?: Date;
    allowWhileIdle?: boolean;
    repeatTime?: number;
  }

  export interface PushNotificationScheduleObject extends PushNotificationObject {
    date: Date;
  }

  export interface PushNotificationChannelObject {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: number;
    vibrate?: boolean;
    vibration?: number;
  }

  export interface PushNotification {
    configure(options: PushNotificationOptions): void;
    unregister(): void;
    localNotification(details: PushNotificationObject): void;
    localNotificationSchedule(details: PushNotificationScheduleObject): void;
    requestPermissions(permissions?: PushNotificationPermissions): Promise<PushNotificationPermissions>;
    presentLocalNotification(details: PushNotificationObject): void;
    scheduleLocalNotification(details: PushNotificationScheduleObject): void;
    cancelLocalNotifications(details: any): void;
    cancelAllLocalNotifications(): void;
    setApplicationIconBadgeNumber(count: number): void;
    getApplicationIconBadgeNumber(callback: (count: number) => void): void;
    abandonPermissions(): void;
    checkPermissions(callback: (permissions: PushNotificationPermissions) => void): void;
    getScheduledLocalNotifications(callback: (notifications: PushNotificationScheduleObject[]) => void): void;
    getDeliveredNotifications(callback: (notifications: PushNotificationScheduleObject[]) => void): void;
    createChannel(channel: PushNotificationChannelObject, callback: (created: boolean) => void): void;
    channelExists(channelId: string, callback: (exists: boolean) => void): void;
    channelBlocked(channelId: string, callback: (blocked: boolean) => void): void;
    deleteChannel(channelId: string): void;
    getChannels(callback: (channel_ids: string[]) => void): void;
    removeAllDeliveredNotifications(): void;
    removeDeliveredNotifications(identifiers: string[]): void;
    subscribeToTopic(topic: string): void;
    unsubscribeFromTopic(topic: string): void;
    clearAllNotifications(): void;
  }

  const PushNotification: PushNotification;
  export default PushNotification;
} 