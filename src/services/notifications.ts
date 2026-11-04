import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const channelId = 'cybershield-findings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function requestFindingNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(channelId, { name: 'Security findings', importance: Notifications.AndroidImportance.DEFAULT, vibrationPattern: [0, 120], enableVibrate: true, showBadge: false });
  const current = await Notifications.getPermissionsAsync();
  const status = current.granted ? current : await Notifications.requestPermissionsAsync();
  return status.granted;
}

export async function canNotifyFindings(): Promise<boolean> {
  try { return (await Notifications.getPermissionsAsync()).granted; } catch { return false; }
}

export async function notifyNewFindings(count: number): Promise<void> {
  if (!count || !(await canNotifyFindings())) return;
  await Notifications.scheduleNotificationAsync({ content: { title: 'CyberShield needs your attention', body: `${count} new security finding${count === 1 ? '' : 's'} needs review.`, data: { destination: 'alerts' } }, trigger: Platform.OS === 'android' ? { channelId } : null });
}
