import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanHistoryItem } from '../types/security';

const key = '@cybershield/scan-history/v1';

export async function loadHistory(): Promise<ScanHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) as ScanHistoryItem[] : [];
  } catch {
    return [];
  }
}

export async function saveHistory(items: ScanHistoryItem[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items.slice(0, 30)));
}
