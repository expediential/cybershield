import AsyncStorage from '@react-native-async-storage/async-storage';

const onboardingKey = '@cybershield/onboarding-complete/v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(onboardingKey)) === 'true'; }
  catch { return false; }
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(onboardingKey, 'true');
}
