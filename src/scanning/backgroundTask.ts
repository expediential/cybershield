import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { automaticScanTaskName, runAutomaticScan } from './ScanScheduler';

if (!TaskManager.isTaskDefined(automaticScanTaskName)) {
  TaskManager.defineTask(automaticScanTaskName, async () => {
    try { await runAutomaticScan(); return BackgroundTask.BackgroundTaskResult.Success; }
    catch { return BackgroundTask.BackgroundTaskResult.Failed; }
  });
}
